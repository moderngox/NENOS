import { getBooksForUser } from "../db";
import { getSessionUser, isPaymentUnlocked } from "../auth";
import { PRICES_CENTS } from "../pricing";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetMyBooks(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);

  const books = await getBooksForUser(env.DB, user.id);
  // Free avatar-only creations (see worker/routes/avatar.ts) aren't real
  // orders — they only feed the profile card, not this order/library list.
  const realBooks = books.filter((book) => book.kind !== "avatar");

  return jsonResponse({
    books: realBooks.map((book) => ({
      bookId: book.id,
      title: book.story?.frontCover.title ?? book.draft.name,
      coverUrl: book.fullStatus === "ready" ? `/api/books/${book.id}/full-assets/cover-front.png` : book.previewAssets ? `/api/books/${book.id}/assets/${book.previewAssets.coverFront}` : null,
      paymentStatus: book.paymentStatus,
      paymentUnlocked: isPaymentUnlocked(book.paymentStatus),
      format: book.format,
      priceCents: book.format ? PRICES_CENTS[book.format] ?? null : null,
      createdAt: book.createdAt,
      fullStatus: book.fullStatus,
      fullUnitsDone: book.fullUnitsDone,
      fullUnitsTotal: (book.story?.pages.length ?? 10) + 4,
      pdfReady: book.pdfStatus === "ready",
    })),
  });
}
