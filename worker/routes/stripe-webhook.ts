import { getBook, markBookAuthorized } from "../db";
import { getUserById } from "../users-db";
import { sendEmail, adminOrderPlacedEmailHtml, ADMIN_EMAIL } from "../email";
import { PRICES_CENTS } from "../pricing";

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

  let event: {
    type?: string;
    data?: { object?: { metadata?: { bookId?: string }; payment_intent?: string } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const bookId = event.data?.object?.metadata?.bookId;
    const paymentIntentId = event.data?.object?.payment_intent;
    // The card is authorized (held), not charged yet — see checkout.ts's
    // capture_method: manual and worker/scheduled.ts's capture-on-ready.
    if (bookId && paymentIntentId) {
      await markBookAuthorized(env.DB, bookId, paymentIntentId);
      // Best-effort — an email hiccup shouldn't make Stripe think this
      // webhook failed and retry it (which would just re-run the same
      // markBookAuthorized, harmlessly, but is still noise to avoid).
      try {
        const book = await getBook(env.DB, bookId);
        const user = book?.userId ? await getUserById(env.DB, book.userId) : null;
        if (book && user) {
          await sendEmail(env, {
            to: ADMIN_EMAIL,
            subject: "New order placed",
            html: adminOrderPlacedEmailHtml({
              bookTitle: book.story?.frontCover.title ?? book.draft.name,
              customerEmail: user.email,
              format: book.format,
              priceCents: book.format ? PRICES_CENTS[book.format] ?? null : null,
              adminOrderUrl: `${env.APP_BASE_URL}/admin/orders/${bookId}`,
            }),
          });
        }
      } catch (err) {
        console.error(`Admin order-placed email failed for book ${bookId}:`, err);
      }
    }
  }

  return new Response(null, { status: 200 });
}
