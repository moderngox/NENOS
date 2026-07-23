import { getBook, updateFullProgress, updatePdfProgress, updateBookBeats } from "../../db";
import { getUserById } from "../../users-db";
import { sendEmail, bookReadyEmailHtml } from "../../email";
import { generateStoryBeats } from "../../story-beats";
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

// Rewrites the story from scratch — a fresh GPT-4o completion against the
// same stored draft, which also produces a fresh castSheet (see
// worker/story-beats.ts) for books generated before that existed — then
// resets both full and PDF progress to "none"/0 so the existing cron/
// client-poll pipeline (generate-next.ts, build-pdf-next.ts) regenerates
// every image and rebuilds the PDF against the new story. Real OpenAI cost
// (one chat completion, then up to ~26 image generations) — deliberately
// admin-only, not exposed to customers.
export async function handleRegenerateBook(bookId: string, request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);
  if (book.kind !== "book") return jsonResponse({ error: "Only full books can be regenerated." }, 409);

  let beats;
  try {
    beats = await generateStoryBeats(env.OPENAI_API_KEY, book.draft);
  } catch (err) {
    return jsonResponse({ error: `Story regeneration failed: ${(err as Error).message}` }, 502);
  }

  await updateBookBeats(env.DB, bookId, beats);
  await updateFullProgress(env.DB, bookId, "none", 0);
  await updatePdfProgress(env.DB, bookId, "none", 0);

  return jsonResponse({ ok: true, message: "Regeneration queued — a fresh story and all images will rebuild over the next few minutes." });
}
