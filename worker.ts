/**
 * HardCall Cloudflare Workers 边缘入口：
 * 1. 处理 /api/checkout（调用 Creem.io Checkout API 生成实时美元结账链接）
 * 2. 处理 /api/webhook（校验 Creem Webhook HMAC-SHA256 签名）
 * 3. 其余静态资源交给 Cloudflare Assets 托管
 */

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  CREEM_API_KEY?: string;
  CREEM_PRODUCT_ID_AUDIT?: string;
  CREEM_PRODUCT_ID_KIT?: string;
  CREEM_WEBHOOK_SECRET?: string;
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

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
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

async function handleCheckout(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as {
      plan?: string;
      email?: string;
    };
    const plan: keyof typeof PLAN_METADATA =
      body.plan === "kit"
        ? "kit"
        : body.plan === "enterprise"
        ? "enterprise"
        : "audit";
    const customerEmail = body.email?.trim() || "";
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
        metadata: { plan },
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

  const event = JSON.parse(rawBody) as { eventType?: string; id?: string };
  console.info(
    `[hardcall/webhook/creem] verified event=${event.eventType || "unknown"} id=${event.id || "n/a"}`
  );
  return jsonResponse({
    received: true,
    provider: "creem",
    eventType: event.eventType || "unknown",
  });
}

async function handleVerifyCheckout(request: Request, env: Env): Promise<Response> {
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
      metadata?: { plan?: string };
    };
    const verified = data.status === "completed";
    return jsonResponse({
      verified,
      status: data.status || "unknown",
      checkoutId: data.id,
      plan: data.metadata?.plan || "weekly",
    });
  } catch {
    return jsonResponse({ verified: false, error: "Verification failed" }, 500);
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/checkout" && request.method === "POST") {
      return handleCheckout(request, env);
    }

    if (pathname === "/api/verify-checkout" && request.method === "GET") {
      return handleVerifyCheckout(request, env);
    }

    if (pathname === "/api/webhook" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
