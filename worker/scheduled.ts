import { getBook, markBookCaptured, markBookCaptureFailed } from "./db";
import { getUserById } from "./users-db";
import { generateNextUnit } from "./routes/generate-next";
import { buildPdfNextUnit } from "./routes/build-pdf-next";
import { sendEmail, bookReadyEmailHtml, adminBookReadyEmailHtml, ADMIN_EMAIL } from "./email";
import { capturePayPalAuthorization } from "./paypal";

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
  if (!book) return;

  // NULL payment_provider means 'stripe' (every book created before PayPal
  // support existed) — see worker/db.ts's mapRowToStoredBook.
  const isPayPal = book.paymentProvider === "paypal";
  const providerId = isPayPal ? book.paypalAuthorizationId : book.stripePaymentIntentId;
  if (!providerId) return;

  // Admin "regenerate entire book" (worker/routes/admin/actions.ts) resets
  // full_status on a book that's already `captured` — the customer was
  // already charged once, so this must not call the provider's capture
  // endpoint a second time (both Stripe's PaymentIntent and PayPal's
  // authorization can only be captured once; a second call errors and
  // would wrongly flip a successful charge to capture_failed). Only
  // genuinely uncaptured states attempt a capture.
  let captured: boolean;
  if (book.paymentStatus === "captured") {
    captured = true;
  } else {
    captured = isPayPal ? await capturePayPalAuthorization(env, providerId) : await captureStripePayment(env, providerId);
    if (captured) {
      await markBookCaptured(env.DB, bookId);
    } else {
      // The book is already generated (real cost incurred) and stays
      // reachable — this just flags the charge itself needs manual
      // follow-up. Surfaced to the admin dashboard's order detail page and
      // via the admin "book ready" email below (captureSucceeded: false).
      await markBookCaptureFailed(env.DB, bookId);
    }
  }

  const bookTitle = book.story?.frontCover.title ?? book.draft.name;
  const adminOrderUrl = `${env.APP_BASE_URL}/admin/orders/${bookId}`;

  if (!book.userId) return;
  const user = await getUserById(env.DB, book.userId);
  if (!user) return;

  await sendEmail(env, {
    to: user.email,
    subject: "Your book is ready!",
    html: bookReadyEmailHtml({
      bookTitle,
      readerUrl: `${env.APP_BASE_URL}/livre/${bookId}`,
    }),
  });

  await sendEmail(env, {
    to: ADMIN_EMAIL,
    subject: captured ? "Book ready" : "Book ready — capture FAILED",
    html: adminBookReadyEmailHtml({
      bookTitle,
      customerEmail: user.email,
      captureSucceeded: captured,
      adminOrderUrl,
    }),
  });
}

export async function handleScheduled(env: Env): Promise<void> {
  // Ordinarily a 'captured'/'capture_failed' book already has
  // full_status='ready' (capture only ever happens once generation
  // finishes, right below) — including them here only matters for the one
  // case that isn't true: an admin "regenerate entire book" action
  // deliberately resets full_status back to 'none' on an already-paid book.
  const { results } = await env.DB.prepare(
    `SELECT id FROM books WHERE payment_status IN ('authorized', 'captured', 'capture_failed') AND full_status != 'ready' ORDER BY updated_at ASC LIMIT ?`
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
