import { getBook, markBookCheckoutStarted } from "../db";

// EUR only for now — the UI shows a €/$ symbol per language but never
// actually converts currency; unifying on EUR for the real charge is a
// deliberate simplification (see plan). Amounts in cents.
const PRICES_CENTS: Record<string, number> = {
  print: 2490,
  digital: 1290,
};

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
  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);

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
