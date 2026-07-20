import { getBooksForUser } from "../db";
import { getSessionUser, isPaymentUnlocked } from "../auth";
import { PRICES_CENTS } from "../pricing";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export interface MyBookSummary {
  bookId: string;
  title: string;
  coverUrl: string | null;
  paymentStatus: string;
  paymentUnlocked: boolean;
  format: string | null;
  priceCents: number | null;
  createdAt: string;
  fullStatus: string;
  fullUnitsDone: number;
  fullUnitsTotal: number;
  pdfReady: boolean;
}

// Pulled out from handleGetMyBooks so worker/routes/admin/customer-detail.ts
// can build the same order/library list for an arbitrary customer (looked up
// by userId, no session involved) instead of only "me".
export async function buildBooksList(db: D1Database, userId: string): Promise<MyBookSummary[]> {
  const books = await getBooksForUser(db, userId);
  // Free avatar-only creations (see worker/routes/avatar.ts) aren't real
  // orders — they only feed the profile card, not this order/library list.
  const realBooks = books.filter((book) => book.kind !== "avatar");

  return realBooks.map((book) => ({
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
  }));
}

export async function handleGetMyBooks(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);
  return jsonResponse({ books: await buildBooksList(env.DB, user.id) });
}
