import { getBook, markBookCheckoutStarted, stampBookUser } from "../db";
import { getSessionUser } from "../auth";
import { PRICES_CENTS } from "../pricing";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Stripe's classic REST API expects form-encoded bodies with bracket
// notation for nested params (line_items[0][price_data][...], metadata[...]).
function toFormBody(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export async function handleCreateCheckout(bookId: string, request: Request, env: Env): Promise<Response> {
  // Signup/login happens right here at the payment step — the wizard and
  // sneak-peek preview stay open to anyone, but we need an account to
  // attach the order to (order history, "your book is ready" email).
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "You need to be signed in to complete your order." }, 401);

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);

  await stampBookUser(env.DB, bookId, user.id);

  let format: string;
  try {
    const body = (await request.json()) as { format?: string };
    format = body.format === "digital" ? "digital" : "print";
  } catch {
    return jsonResponse({ error: "Expected a JSON body with a format field." }, 400);
  }

  const unitAmount = PRICES_CENTS[format];
  const origin = new URL(request.url).origin;
  const productName = book.story?.frontCover.title || `Livre personnalisé — ${book.draft.name}`;

  const form = toFormBody({
    mode: "payment",
    success_url: `${origin}/commande-confirmee?bookId=${bookId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/paiement`,
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][product_data][name]": productName,
    "line_items[0][price_data][unit_amount]": String(unitAmount),
    "line_items[0][quantity]": "1",
    "metadata[bookId]": bookId,
    "metadata[format]": format,
    // Authorizes (holds) the card without charging it — the actual capture
    // happens later, once the book is ready (worker/scheduled.ts).
    "payment_intent_data[capture_method]": "manual",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const session = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !session.url || !session.id) {
    return jsonResponse({ error: `Stripe error: ${session.error?.message ?? response.status}` }, 502);
  }

  await markBookCheckoutStarted(env.DB, bookId, format, session.id);
  return jsonResponse({ url: session.url });
}
