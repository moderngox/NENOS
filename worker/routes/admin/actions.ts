import { getBook, updateFullProgress, updatePdfProgress } from "../../db";
import { getUserById } from "../../users-db";
import { sendEmail, bookReadyEmailHtml } from "../../email";
import { STALE_LOCK_MS as FULL_STALE_LOCK_MS } from "../generate-next";
import { STALE_LOCK_MS as PDF_STALE_LOCK_MS } from "../build-pdf-next";
import { requireAdmin, jsonResponse } from "./guard";

function isStale(updatedAt: string, staleMs: number): boolean {
  return Date.now() - new Date(updatedAt).getTime() > staleMs;
}

// Resets the status back to "none" at the same unitsDone rather than
// re-running the (3-4 minute, OpenAI-billed) generation inline — the next
// cron tick or the customer's own open reader page picks it back up exactly
// like any other already-idempotent unit.
export async function handleRetryGeneration(bookId: string, request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);

  const retryable = book.fullStatus === "error" || (book.fullStatus === "generating" && isStale(book.updatedAt, FULL_STALE_LOCK_MS));
  if (!retryable) return jsonResponse({ error: "This book's generation isn't currently stuck." }, 409);

  await updateFullProgress(env.DB, bookId, "none", book.fullUnitsDone);
  return jsonResponse({ ok: true, message: "Retry queued — resumes within about a minute." });
}

export async function handleRetryPdf(bookId: string, request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);

  const retryable = book.pdfStatus === "error" || (book.pdfStatus === "generating" && isStale(book.updatedAt, PDF_STALE_LOCK_MS));
  if (!retryable) return jsonResponse({ error: "This book's PDF build isn't currently stuck." }, 409);

  await updatePdfProgress(env.DB, bookId, "none", book.pdfUnitsDone);
  return jsonResponse({ ok: true, message: "Retry queued — resumes within about a minute." });
}

export async function handleResendReadyEmail(bookId: string, request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);
  if (book.fullStatus !== "ready") return jsonResponse({ error: "This book isn't ready yet." }, 409);
  if (!book.userId) return jsonResponse({ error: "This book has no owning customer to email." }, 409);

  const user = await getUserById(env.DB, book.userId);
  if (!user) return jsonResponse({ error: "Customer account not found." }, 404);

  await sendEmail(env, {
    to: user.email,
    subject: "Your book is ready!",
    html: bookReadyEmailHtml({
      bookTitle: book.story?.frontCover.title ?? book.draft.name,
      readerUrl: `${env.APP_BASE_URL}/livre/${bookId}`,
    }),
  });

  return jsonResponse({ ok: true, message: "Email resent." });
}
