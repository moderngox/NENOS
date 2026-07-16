import { getBooksForUser } from "../db";
import { getSessionUser, isPaymentUnlocked } from "../auth";

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

  return jsonResponse({
    books: books.map((book) => ({
      bookId: book.id,
      title: book.story?.frontCover.title ?? book.draft.name,
      coverUrl: book.fullStatus === "ready" ? `/api/books/${book.id}/full-assets/cover-front.png` : book.previewAssets ? `/api/books/${book.id}/assets/${book.previewAssets.coverFront}` : null,
      paymentUnlocked: isPaymentUnlocked(book.paymentStatus),
      fullStatus: book.fullStatus,
      fullUnitsDone: book.fullUnitsDone,
      fullUnitsTotal: (book.story?.pages.length ?? 10) + 3,
    })),
  });
}
