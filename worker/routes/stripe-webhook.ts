import { markBookPaid } from "../db";

// Stripe's v1 signing scheme: header is "t=<timestamp>,v1=<hex>,...",
// signed payload is "<timestamp>.<raw body>", HMAC-SHA256 with the webhook
// secret. Implemented by hand via Web Crypto (available in Workers) instead
// of the `stripe` SDK's Node-crypto-based verifier, to keep the worker
// dependency-free. Note: plain string `===` compare, not constant-time —
// acceptable for this pass, flagged as hardening work for later.
async function verifyStripeSignature(rawBody: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [key, value] = kv.split("=");
      return [key, value];
    })
  );
  const timestamp = parts["t"];
  const expected = parts["v1"];
  if (!timestamp || !expected) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const computedHex = [...new Uint8Array(signatureBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return computedHex === expected;
}

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const signatureHeader = request.headers.get("Stripe-Signature");
  // Must read as raw text before any JSON parsing — Stripe signs the exact bytes.
  const rawBody = await request.text();

  if (!signatureHeader || !(await verifyStripeSignature(rawBody, signatureHeader, env.STRIPE_WEBHOOK_SECRET))) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: { type?: string; data?: { object?: { metadata?: { bookId?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const bookId = event.data?.object?.metadata?.bookId;
    if (bookId) await markBookPaid(env.DB, bookId);
  }

  return new Response(null, { status: 200 });
}
