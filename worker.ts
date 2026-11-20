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
  CREEM_PRODUCT_ID_WEEKLY?: string;
  CREEM_PRODUCT_ID_LIFETIME?: string;
  CREEM_WEBHOOK_SECRET?: string;
}

const PLAN_METADATA = {
  weekly: {
    name: "HardCall Weekly Sprint Pass",
    amountUsd: 6.99,
  },
  lifetime: {
    name: "HardCall Lifetime Offer Pass",
    amountUsd: 49.99,
  },
} as const;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
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
    const plan = body.plan === "lifetime" ? "lifetime" : "weekly";
    const customerEmail = body.email?.trim() || "";
    const meta = PLAN_METADATA[plan];
    const origin = request.headers.get("origin") || new URL(request.url).origin;

    const creemApiKey = env.CREEM_API_KEY?.trim();
    const productId =
      plan === "lifetime"
        ? env.CREEM_PRODUCT_ID_LIFETIME?.trim() || env.CREEM_PRODUCT_ID_WEEKLY?.trim()
        : env.CREEM_PRODUCT_ID_WEEKLY?.trim() || env.CREEM_PRODUCT_ID_LIFETIME?.trim();

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
      mode: "sandbox",
      gateway: "Creem.io MoR Sandbox",
      plan,
      planName: meta.name,
      amountUsd: meta.amountUsd,
      sessionId: `hc_sbx_${plan}_${Date.now()}`,
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
