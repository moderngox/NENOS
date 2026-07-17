import { getBook, markBookCaptured, markBookCaptureFailed } from "./db";
import { getUserById } from "./users-db";
import { generateNextUnit } from "./routes/generate-next";
import { buildPdfNextUnit } from "./routes/build-pdf-next";
import { sendEmail, bookReadyEmailHtml } from "./email";

// Bounds how much work one cron tick takes on — each unit is a real,
// billed, 3-4 minute OpenAI call, so this keeps a single scheduled
// invocation from trying to drive an unbounded number of books at once.
const MAX_BOOKS_PER_TICK = 5;
// PDF-build units do real synchronous CPU work (WASM image transcoding,
// pdf-lib assembly) rather than mostly-awaited network calls, so this stays
// deliberately small — processing many books' worth in one tick would risk
// re-creating the same CPU-budget problem this pipeline exists to avoid.
const MAX_PDF_BOOKS_PER_TICK = 3;

async function captureStripePayment(env: Env, paymentIntentId: string): Promise<boolean> {
  const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  return response.ok;
}

async function captureAndNotify(bookId: string, env: Env): Promise<void> {
  const book = await getBook(env.DB, bookId);
  if (!book || !book.stripePaymentIntentId) return;

  const captured = await captureStripePayment(env, book.stripePaymentIntentId);
  if (captured) {
    await markBookCaptured(env.DB, bookId);
  } else {
    // The book is already generated (real cost incurred) and stays
    // reachable — this just flags the charge itself needs manual
    // follow-up, a known gap with no admin UI yet.
    await markBookCaptureFailed(env.DB, bookId);
  }

  if (!book.userId) return;
  const user = await getUserById(env.DB, book.userId);
  if (!user) return;

  await sendEmail(env, {
    to: user.email,
    subject: "Your book is ready!",
    html: bookReadyEmailHtml({
      bookTitle: book.story?.frontCover.title ?? book.draft.name,
      readerUrl: `${env.APP_BASE_URL}/livre/${bookId}`,
    }),
  });
}

export async function handleScheduled(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT id FROM books WHERE payment_status = 'authorized' AND full_status != 'ready' ORDER BY updated_at ASC LIMIT ?`
  )
    .bind(MAX_BOOKS_PER_TICK)
    .all<{ id: string }>();

  for (const row of results) {
    const result = await generateNextUnit(row.id, env);
    if (result.ok && result.fullStatus === "ready") {
      await captureAndNotify(row.id, env);
    }
  }

  const { results: pdfRows } = await env.DB.prepare(
    `SELECT id FROM books WHERE full_status = 'ready' AND pdf_status != 'ready' ORDER BY updated_at ASC LIMIT ?`
  )
    .bind(MAX_PDF_BOOKS_PER_TICK)
    .all<{ id: string }>();

  for (const row of pdfRows) {
    await buildPdfNextUnit(row.id, env);
  }
}
