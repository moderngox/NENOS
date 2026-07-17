import { getBook } from "../db";
import { getSessionUser, isPaymentUnlocked } from "../auth";
import { PRICES_CENTS } from "../pricing";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface CardInfo {
  brand: string;
  last4: string;
}

async function fetchCardInfo(env: Env, paymentIntentId: string): Promise<{ card: CardInfo | null; stripeStatus: string | null }> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}?expand[]=payment_method`,
      { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
    );
    if (!response.ok) return { card: null, stripeStatus: null };
    const pi = (await response.json()) as {
      status?: string;
      payment_method?: { card?: { brand?: string; last4?: string } };
    };
    const card = pi.payment_method?.card;
    return {
      card: card?.brand && card?.last4 ? { brand: card.brand, last4: card.last4 } : null,
      stripeStatus: pi.status ?? null,
    };
  } catch {
    // Stripe being unreachable shouldn't break the whole order-detail page —
    // the rest of the order info (from our own DB) is still useful on its own.
    return { card: null, stripeStatus: null };
  }
}

export async function handleGetOrderDetail(bookId: string, request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Order not found." }, 404);
  if (book.userId !== user.id) return jsonResponse({ error: "Order not found." }, 404);

  const { card, stripeStatus } = book.stripePaymentIntentId
    ? await fetchCardInfo(env, book.stripePaymentIntentId)
    : { card: null, stripeStatus: null };

  const pageCount = book.story?.pages.length ?? 10;

  return jsonResponse({
    bookId: book.id,
    title: book.story?.frontCover.title ?? book.draft.name,
    coverUrl: book.fullStatus === "ready" ? `/api/books/${book.id}/full-assets/cover-front.png` : book.previewAssets ? `/api/books/${book.id}/assets/${book.previewAssets.coverFront}` : null,
    createdAt: book.createdAt,
    format: book.format,
    priceCents: book.format ? PRICES_CENTS[book.format] ?? null : null,
    paymentStatus: book.paymentStatus,
    paymentUnlocked: isPaymentUnlocked(book.paymentStatus),
    stripeStatus,
    card,
    fullStatus: book.fullStatus,
    fullUnitsDone: book.fullUnitsDone,
    fullUnitsTotal: pageCount + 4,
    pdfReady: book.pdfStatus === "ready",
  });
}
