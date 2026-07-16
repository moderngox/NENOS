import { getBook } from "../db";
import { isPaymentUnlocked } from "../auth";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Full snapshot for the reader page, which has no BookDraftContext state to
// fall back on — a returning customer opens /livre/:bookId in a fresh tab
// (or on a different device) with nothing but the bookId from their
// confirmation email/page.
export async function handleGetBookStatus(bookId: string, env: Env): Promise<Response> {
  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);

  const base = `/api/books/${bookId}`;
  const pageCount = book.story?.pages.length ?? 0;

  const fullAssets =
    book.fullStatus === "ready"
      ? {
          coverFrontUrl: `${base}/full-assets/cover-front.png`,
          coverBackUrl: `${base}/full-assets/cover-back.png`,
          pageUrls: Array.from({ length: pageCount }, (_, i) => `${base}/full-assets/page-${String(i + 1).padStart(2, "0")}.png`),
        }
      : null;

  return jsonResponse({
    bookId,
    paymentStatus: book.paymentStatus,
    paymentUnlocked: isPaymentUnlocked(book.paymentStatus),
    story: book.story,
    fullStatus: book.fullStatus,
    fullUnitsDone: book.fullUnitsDone,
    fullUnitsTotal: pageCount + 3, // character-sheet + cover-front + pages + cover-back
    fullAssets,
  });
}
