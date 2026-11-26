/**
 * HardCall Cloudflare Workers 边缘入口（D1 订单持久化 + 边缘限流 + Resend 自动交付确认版）：
 * 1. POST /api/checkout         — 调用 Creem.io Checkout API 生成实时美元结账链接（$299 Audit / $1,200 RTP Kit）
 * 2. GET  /api/verify-checkout  — 服务端核验 Creem 结账单并幂等入库 D1 hc_orders
 * 3. POST /api/webhook          — 校验 Creem HMAC-SHA256 签名、入库 D1 并自动发送工程启动邮件
 * 4. POST /api/license/restore  — 跨设备订单核验与找回
 * 5. GET  /api/stats & /api/health — 订单统计与健康探针
 */

interface D1Prepared {
  bind: (...args: unknown[]) => {
    run: () => Promise<unknown>;
    first: <T = Record<string, unknown>>() => Promise<T | null>;
    all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
  };
  run: () => Promise<unknown>;
  all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
}

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  DB?: {
    prepare: (sql: string) => D1Prepared;
  };
  CREEM_API_KEY?: string;
  CREEM_PRODUCT_ID_AUDIT?: string;
  CREEM_PRODUCT_ID_KIT?: string;
  CREEM_WEBHOOK_SECRET?: string;
  ADMIN_API_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

const PLAN_METADATA = {
  audit: {
    name: "HardCall 48h Voice Latency Audit Pilot",
    amountUsd: 299,
  },
  kit: {
    name: "HardCall 8kHz RTP Self-Hosted Deployment Kit",
    amountUsd: 1200,
  },
  enterprise: {
    name: "HardCall Custom Enterprise SIP/FreeSWITCH Integration",
    amountUsd: 3000,
  },
} as const;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Content-Security-Policy": "frame-ancestors 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(request: Request, scope: string, maxPerMin: number): boolean {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0";
  const now = Date.now();
  if (rateBuckets.size > 2000) {
    for (const [k, v] of rateBuckets) {
      if (v.resetAt <= now) rateBuckets.delete(k);
    }
  }
  const key = `${scope}:${ip}`;
  const entry = rateBuckets.get(key);
  if (!entry || entry.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMin) return false;
  entry.count += 1;
  return true;
}

let hcSchemaReady = false;
async function ensureHcTables(env: Env): Promise<void> {
  if (hcSchemaReady || !env.DB) return;
  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS hc_orders (
        order_id TEXT PRIMARY KEY,
        customer_email TEXT NOT NULL DEFAULT '',
        plan TEXT NOT NULL DEFAULT 'audit',
        amount_usd INTEGER NOT NULL DEFAULT 299,
        status TEXT NOT NULL DEFAULT 'completed',
        restore_token TEXT NOT NULL DEFAULT '',
        stack_note TEXT NOT NULL DEFAULT '',
        email_sent INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ).run();
    try {
      await env.DB.prepare(
        `ALTER TABLE hc_orders ADD COLUMN email_sent INTEGER NOT NULL DEFAULT 0`
      ).run();
    } catch {
      // 列已存在时安全忽略
    }
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS email_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_label TEXT NOT NULL DEFAULT 'HardCall Voice Engineering',
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        body_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        sent_at TEXT NOT NULL DEFAULT ''
      )`
    ).run();
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS hc_intake_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_ref TEXT NOT NULL DEFAULT '',
        customer_email TEXT NOT NULL DEFAULT '',
        sip_or_repo TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ).run();
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS hc_funnel_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'XX',
        meta_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ).run();
    hcSchemaReady = true;
  } catch {
    // ignore
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...SECURITY_HEADERS,
    },
  });
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyCreemSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedHex = Array.from(new Uint8Array(sigBytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqualHex(signature.toLowerCase(), expectedHex);
}

async function sendHcEmail(
  env: Env,
  params: { to: string; subject: string; text: string }
): Promise<boolean> {
  if (!params.to) return false;
  const apiKey = env.RESEND_API_KEY?.trim();
  if (apiKey) {
    const rawFrom =
      env.RESEND_FROM_EMAIL?.trim() || "HardCall Voice Engineering <hello@mail.statementflow.win>";
    const from = rawFrom.replace(/@statementflow\.win\b/i, "@mail.statementflow.win");
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          reply_to: "hello@statementflow.win",
          to: [params.to],
          subject: params.subject,
          text: params.text,
        }),
      });
      if (res.ok) return true;
    } catch {
      // fallback to shared D1 outbox
    }
  }
  if (env.DB) {
    try {
      await ensureHcTables(env);
      await env.DB.prepare(
        `INSERT INTO email_outbox (from_label, to_email, subject, body_text, status)
         VALUES ('HardCall Voice Engineering', ?1, ?2, ?3, 'pending')`
      )
        .bind(params.to, params.subject, params.text)
        .run();
      await fetch("https://pulse.statementflow.win/api/internal/flush-outbox", {
        method: "POST",
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function handleCheckout(request: Request, env: Env): Promise<Response> {
  if (!checkRateLimit(request, "checkout", 15)) {
    return jsonResponse({ error: "Too many checkout requests. Please wait 60s." }, 429);
  }
  try {
    const body = (await request.json()) as {
      plan?: string;
      email?: string;
      stackNote?: string;
    };
    const plan: keyof typeof PLAN_METADATA =
      body.plan === "kit"
        ? "kit"
        : body.plan === "enterprise"
        ? "enterprise"
        : "audit";
    const customerEmail = (body.email || "").trim().toLowerCase();
    const stackNote = (body.stackNote || "").trim().slice(0, 180);
    const meta = PLAN_METADATA[plan];
    const origin = request.headers.get("origin") || new URL(request.url).origin;

    const creemApiKey = env.CREEM_API_KEY?.trim();
    const productId =
      plan === "audit"
        ? env.CREEM_PRODUCT_ID_AUDIT?.trim()
        : plan === "kit"
        ? env.CREEM_PRODUCT_ID_KIT?.trim()
        : "";

    if (creemApiKey && productId) {
      const creemPayload: Record<string, unknown> = {
        product_id: productId,
        success_url: `${origin}/?checkout=success&plan=${plan}`,
        request_id: `hc_${plan}_${Date.now()}`,
        metadata: { plan, stackNote },
      };
      if (customerEmail) {
        creemPayload.customer = { email: customerEmail };
      }

      const creemRes = await fetch("https://api.creem.io/v1/checkouts", {
        method: "POST",
        headers: {
          "x-api-key": creemApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(creemPayload),
      });

      if (creemRes.ok) {
        const data = (await creemRes.json()) as { checkout_url?: string };
        if (data.checkout_url) {
          return jsonResponse({
            mode: "live_redirect",
            gateway: "Creem.io",
            checkoutUrl: data.checkout_url,
          });
        }
      }
    }

    return jsonResponse({
      mode: "concierge_invoice",
      gateway: "Direct B2B Invoice",
      plan,
      planName: meta.name,
      amountUsd: meta.amountUsd,
      contactEmail: "hello@statementflow.win",
    });
  } catch {
    return jsonResponse({ error: "Unable to initialize checkout session." }, 500);
  }
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("creem-signature") || "";
  const secret = env.CREEM_WEBHOOK_SECRET?.trim() || "";

  if (!signature || !secret) {
    return jsonResponse({ error: "Webhook secret or signature header not configured." }, 400);
  }

  const valid = await verifyCreemSignature(rawBody, signature, secret);
  if (!valid) {
    return jsonResponse({ error: "Invalid webhook signature" }, 401);
  }

  const event = JSON.parse(rawBody) as {
    eventType?: string;
    id?: string;
    object?: {
      id?: string;
      customer?: { email?: string };
      metadata?: { plan?: string; stackNote?: string };
      order?: { amount?: number };
    };
  };

  if (env.DB) {
    await ensureHcTables(env);
    try {
      const obj = event.object || {};
      const orderId = obj.id || event.id || `hc_ord_${Date.now()}`;
      const email = (obj.customer?.email || "").trim().toLowerCase();
      const plan = obj.metadata?.plan === "kit" ? "kit" : "audit";
      const stackNote = (obj.metadata?.stackNote || "").slice(0, 180);
      const fallbackCents = plan === "kit" ? 120000 : 29900;
      const amountUsd = Math.round((obj.order?.amount || fallbackCents) / 100);
      const evt = (event.eventType || "").toLowerCase();
      const status = /refund|cancel|dispute/.test(evt) ? "refunded" : "completed";
      const restoreToken = `hc_lic_${crypto.randomUUID().replace(/-/g, "")}`;

      await env.DB.prepare(
        `INSERT INTO hc_orders (order_id, customer_email, plan, amount_usd, status, restore_token, stack_note)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(order_id) DO UPDATE SET status = ?5`
      )
        .bind(orderId, email, plan, amountUsd, status, restoreToken, stackNote)
        .run();

      if (status === "completed" && email) {
        const saved = await env.DB.prepare(
          `SELECT restore_token, email_sent FROM hc_orders WHERE order_id = ?1 LIMIT 1`
        )
          .bind(orderId)
          .first<{ restore_token: string; email_sent?: number }>();
        if (!saved || Number(saved.email_sent || 0) === 0) {
          await env.DB.prepare(`UPDATE hc_orders SET email_sent = 1 WHERE order_id = ?1`)
            .bind(orderId)
            .run();
          const activeToken = saved?.restore_token || restoreToken;
          const activateUrl = `https://hardcall.statementflow.win/?restore_token=${encodeURIComponent(activeToken)}`;
          await sendHcEmail(env, {
            to: email,
            subject:
              plan === "kit"
                ? "HardCall 8kHz RTP Self-Hosted Deployment Kit ($1,200) — Onboarding & Access"
                : "HardCall 48h Voice Latency Audit ($299) — Kickoff Instructions",
            text: [
              "Welcome to HardCall B2B Voice Engineering!",
              "",
              `Engagement Confirmed: ${plan === "kit" ? "8kHz RTP Self-Hosted Deployment Kit ($1,200)" : "48h Voice Latency Audit & Benchmark ($299)"}`,
              `Order ID: ${orderId}`,
              "",
              "Next Steps (Instant Vault + Kickoff within 4 hours):",
              plan === "kit"
                ? "Open your License Verification Link below to instantly download your Docker Compose + FreeSWITCH 20ms + SOXR VHQ bundle, and submit your GitHub handle for private repository access."
                : "Open your License Verification Link below or reply to hello@statementflow.win with a test SIP/WebRTC endpoint + current STT/LLM/TTS stack. Your frame-level barge-in latency report will be delivered within 48 hours.",
              "",
              `License Verification & Vault Link: ${activateUrl}`,
              "",
              "— Wang Guo, HardCall Voice Architecture",
            ].join("\n"),
          });

          await sendHcEmail(env, {
            to: "hello@statementflow.win",
            subject: `💰 [HardCall B2B Paid] $${amountUsd} (${plan.toUpperCase()}) from ${email}`,
            text: [
              `New Paid B2B Engagement on HardCall!`,
              `- Order ID: ${orderId}`,
              `- Customer: ${email}`,
              `- Tier: ${plan.toUpperCase()} ($${amountUsd})`,
              `- Stack Note: ${stackNote || "None"}`,
              `- Activation Link Sent: ${activateUrl}`,
            ].join("\n"),
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return jsonResponse({
    received: true,
    provider: "creem",
    eventType: event.eventType || "unknown",
  });
}

async function handleVerifyCheckout(request: Request, env: Env): Promise<Response> {
  if (!checkRateLimit(request, "verify", 20)) {
    return jsonResponse({ verified: false, error: "Too many attempts." }, 429);
  }
  const checkoutId = new URL(request.url).searchParams.get("checkout_id")?.trim();
  const creemApiKey = env.CREEM_API_KEY?.trim();

  if (!checkoutId || !creemApiKey) {
    return jsonResponse({ verified: false, error: "Missing checkout_id or API key" }, 400);
  }

  try {
    const res = await fetch(
      `https://api.creem.io/v1/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`,
      { headers: { "x-api-key": creemApiKey } }
    );
    if (!res.ok) {
      return jsonResponse({ verified: false, status: "unverified" }, 402);
    }
    const data = (await res.json()) as {
      id?: string;
      status?: string;
      customer?: { email?: string };
      metadata?: { plan?: string; stackNote?: string };
    };
    const verified = data.status === "completed";
    const plan = data.metadata?.plan === "kit" ? "kit" : "audit";
    const email = (data.customer?.email || "").trim().toLowerCase();
    let restoreToken = "";
    if (verified && env.DB && data.id) {
      await ensureHcTables(env);
      try {
        const tok = `hc_lic_${crypto.randomUUID().replace(/-/g, "")}`;
        await env.DB.prepare(
          `INSERT INTO hc_orders (order_id, customer_email, plan, amount_usd, status, restore_token, stack_note)
           VALUES (?1, ?2, ?3, ?4, 'completed', ?5, ?6)
           ON CONFLICT(order_id) DO NOTHING`
        )
          .bind(
            data.id,
            email,
            plan,
            plan === "kit" ? 1200 : 299,
            tok,
            (data.metadata?.stackNote || "").slice(0, 180)
          )
          .run();
        const saved = await env.DB.prepare(
          `SELECT restore_token FROM hc_orders WHERE order_id = ?1 LIMIT 1`
        )
          .bind(data.id)
          .first<{ restore_token: string }>();
        restoreToken = saved?.restore_token || tok;
      } catch {
        // ignore
      }
    }
    return jsonResponse({
      verified,
      status: data.status || "unknown",
      checkoutId: data.id,
      plan,
      email,
      restoreToken,
    });
  } catch {
    return jsonResponse({ verified: false, error: "Verification failed" }, 500);
  }
}

async function handleRestoreOrder(request: Request, env: Env): Promise<Response> {
  if (!checkRateLimit(request, "restore", 12)) {
    return jsonResponse({ ok: false, error: "Too many attempts. Wait 60s." }, 429);
  }
  if (!env.DB) return jsonResponse({ ok: false, error: "DB unavailable" }, 503);
  await ensureHcTables(env);
  try {
    const body = (await request.json()) as { token?: string; email?: string; orderRef?: string };
    const token = (body.token || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const orderRef = (body.orderRef || "").trim();

    if (token && token.length >= 10) {
      const row = await env.DB.prepare(
        `SELECT order_id, customer_email, plan FROM hc_orders WHERE restore_token = ?1 AND status = 'completed' LIMIT 1`
      )
        .bind(token)
        .first<{ order_id: string; customer_email: string; plan: string }>();
      if (!row) return jsonResponse({ ok: false, error: "Invalid activation token." }, 404);
      return jsonResponse({ ok: true, restored: true, plan: row.plan, email: row.customer_email, orderId: row.order_id });
    }

    if (email && email.includes("@") && orderRef.length >= 6) {
      const rows = await env.DB.prepare(
        `SELECT order_id, customer_email, plan FROM hc_orders WHERE customer_email = ?1 AND status = 'completed'`
      )
        .bind(email)
        .all<{ order_id: string; customer_email: string; plan: string }>();
      const matched = (rows.results || []).find((r) =>
        r.order_id.toLowerCase().includes(orderRef.toLowerCase())
      );
      if (!matched) {
        return jsonResponse({ ok: false, error: "No matching active order found." }, 404);
      }
      return jsonResponse({ ok: true, restored: true, plan: matched.plan, email: matched.customer_email, orderId: matched.order_id });
    }

    return jsonResponse({ ok: false, error: "Enter both your checkout email and Order/Checkout ID." }, 400);
  } catch {
    return jsonResponse({ ok: false, error: "Invalid request." }, 400);
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/health" && request.method === "GET") {
      return jsonResponse({ ok: true, service: "hardcall" });
    }

    if (pathname === "/api/event" && request.method === "POST") {
      if (!checkRateLimit(request, "event", 60)) {
        return jsonResponse({ ok: true, throttled: true });
      }
      try {
        const body = (await request.json()) as { event?: string; meta?: Record<string, unknown> };
        const ev = String(body.event || "unknown").slice(0, 48);
        const country = (request.headers.get("cf-ipcountry") || "XX").slice(0, 8);
        if (env.DB) {
          await ensureHcTables(env);
          await env.DB.prepare(
            `INSERT INTO hc_funnel_events (event, country, meta_json) VALUES (?1, ?2, ?3)`
          )
            .bind(ev, country, JSON.stringify(body.meta || {}).slice(0, 260))
            .run();
        }
        return jsonResponse({ ok: true });
      } catch {
        return jsonResponse({ ok: false }, 400);
      }
    }

    if (pathname === "/api/stats" && request.method === "GET") {
      const adminKey = env.ADMIN_API_KEY?.trim() || "";
      const provided = (request.headers.get("x-admin-key") || "").trim();
      if (!adminKey || !provided || !timingSafeEqualHex(provided, adminKey)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      if (!env.DB) return jsonResponse({ ok: false }, 503);
      await ensureHcTables(env);
      const ordersRes = await env.DB.prepare(
        `SELECT plan, COUNT(*) AS orders, COALESCE(SUM(amount_usd), 0) AS revenue_usd
         FROM hc_orders WHERE status = 'completed' GROUP BY plan`
      ).all();
      return jsonResponse({ ok: true, orders: ordersRes.results || [] });
    }

    if (pathname === "/api/checkout" && request.method === "POST") {
      return handleCheckout(request, env);
    }

    if (pathname === "/api/verify-checkout" && request.method === "GET") {
      return handleVerifyCheckout(request, env);
    }

    if (pathname === "/api/b2b-intake" && request.method === "POST") {
      if (!checkRateLimit(request, "intake", 8)) {
        return jsonResponse({ ok: false, error: "Too many submissions." }, 429);
      }
      try {
        const body = (await request.json()) as {
          orderRef?: string;
          email?: string;
          sipOrRepo?: string;
          notes?: string;
        };
        const orderRef = (body.orderRef || "").trim().slice(0, 80);
        const email = (body.email || "").trim().toLowerCase().slice(0, 120);
        const sipOrRepo = (body.sipOrRepo || "").trim().slice(0, 240);
        const notes = (body.notes || "").trim().slice(0, 1000);
        if (!sipOrRepo) {
          return jsonResponse({ ok: false, error: "Please provide your SIP/WebRTC endpoint or GitHub handle." }, 400);
        }
        if (!orderRef && !email) {
          return jsonResponse({ ok: false, error: "Please provide your B2B Order ID or checkout email." }, 400);
        }
        if (!env.DB) return jsonResponse({ ok: false, error: "Database unavailable." }, 503);
        await ensureHcTables(env);
        const paidOrder = await env.DB.prepare(
          `SELECT order_id, customer_email FROM hc_orders
           WHERE status = 'completed'
             AND ((?1 != '' AND (order_id = ?1 OR restore_token = ?1))
               OR (?2 != '' AND LOWER(customer_email) = ?2))
           LIMIT 1`
        )
          .bind(orderRef, email)
          .first<{ order_id: string; customer_email: string }>();
        if (!paidOrder) {
          return jsonResponse(
            { ok: false, error: "Active HardCall B2B order required to submit kickoff intake." },
            403
          );
        }
        await env.DB.prepare(
          `INSERT INTO hc_intake_submissions (order_ref, customer_email, sip_or_repo, notes)
           VALUES (?1, ?2, ?3, ?4)`
        )
          .bind(paidOrder.order_id, paidOrder.customer_email || email, sipOrRepo, notes)
          .run();
        await sendHcEmail(env, {
          to: "hello@statementflow.win",
          subject: `🚀 [HardCall Kickoff Intake] ${sipOrRepo.slice(0, 50)} (${paidOrder.customer_email || paidOrder.order_id})`,
          text: `Verified Order: ${paidOrder.order_id}\nCustomer Email: ${paidOrder.customer_email || email}\nSIP / GitHub Target: ${sipOrRepo}\nNotes:\n${notes}`,
        });
        return jsonResponse({ ok: true });
      } catch {
        return jsonResponse({ ok: false }, 400);
      }
    }

    if (pathname === "/api/kit-bundle" && request.method === "GET") {
      if (!checkRateLimit(request, "kit_dl", 10)) {
        return jsonResponse({ ok: false, error: "Too many attempts." }, 429);
      }
      if (!env.DB) return jsonResponse({ ok: false }, 503);
      await ensureHcTables(env);
      const ref = (new URL(request.url).searchParams.get("ref") || "").trim();
      if (ref.length < 8) return jsonResponse({ ok: false, error: "Missing valid license reference." }, 401);
      const row = await env.DB.prepare(
        `SELECT order_id, customer_email, plan FROM hc_orders
         WHERE (order_id = ?1 OR restore_token = ?1) AND status = 'completed' AND plan = 'kit' LIMIT 1`
      )
        .bind(ref)
        .first<{ order_id: string; customer_email: string; plan: string }>();
      if (!row) {
        return jsonResponse({ ok: false, error: "Active $1,200 RTP Kit license required." }, 403);
      }
      const bundle = {
        licenseCertificate: {
          product: "HardCall 8kHz RTP Self-Hosted Commercial Deployment Kit",
          orderId: row.order_id,
          licensedTo: row.customer_email,
          issuedAt: new Date().toISOString(),
          sla: "Sub-60ms Barge-In · 0.16ms 256-Frame Ring Flush · SOXR VHQ 8kHz->16kHz",
        },
        dockerComposeYaml: [
          "services:",
          "  freeswitch-rtp:",
          "    image: signalwire/freeswitch:1.10",
          "    network_mode: host",
          "    environment:",
          "      - RTP_START_PORT=16384",
          "      - RTP_END_PORT=16484",
          "      - PTIME_MS=20",
          "  hardcall-rtp-orchestrator:",
          "    build: ./rtp-gateway",
          "    network_mode: host",
          "    environment:",
          "      - RING_BUFFER_FRAMES=256",
          "      - RESAMPLER_QUALITY=SOXR_VHQ",
          "      - FAST_VAD_WINDOW_MS=50",
          "      - SEMANTIC_GUARD_MS=200",
        ].join("\n"),
        repositoryAccessInstruction:
          "Submit your GitHub username in the Verified Fulfillment Vault or reply to hello@statementflow.win for private repo collaborator invite + 2h onboarding call.",
      };
      return new Response(JSON.stringify(bundle, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="hardcall-8khz-rtp-kit-${row.order_id}.json"`,
          ...SECURITY_HEADERS,
        },
      });
    }

    if (pathname === "/api/license/restore" && request.method === "POST") {
      return handleRestoreOrder(request, env);
    }

    if (pathname === "/api/webhook" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    const assetRes = await env.ASSETS.fetch(request);
    const hdrs = new Headers(assetRes.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      if (!hdrs.has(k)) hdrs.set(k, v);
    }
    return new Response(assetRes.body, { status: assetRes.status, headers: hdrs });
  },
};

export default worker;
