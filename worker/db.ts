import type { BookDraftInput, PreviewAssets, StoredBook, StoryBeatsResult } from "./types";

// Low-traffic D1 databases occasionally hit a transient
// "D1_ERROR: D1 DB storage operation exceeded timeout which caused object
// to be reset" on the first write after a period of inactivity — the
// underlying storage object waking back up, not a real failure. A bare
// retry has reliably succeeded immediately every time this has been seen in
// practice, so this wraps the write instead of surfacing a scary error to
// whoever happens to make the first request in a while.
async function withD1Retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 400): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function insertDraftBook(
  db: D1Database,
  bookId: string,
  draft: BookDraftInput,
  photoKey: string | null,
  kind: string = "book"
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await withD1Retry(() =>
      db
        .prepare(
          `INSERT INTO books (
            id, name, age, traits, universe, style, story_prompt,
            appearance_details, skin_color, hair_color, eye_color, secondary_characters,
            language, photo_key, status, kind, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          bookId,
          draft.name,
          draft.age,
          JSON.stringify(draft.traits),
          draft.universe,
          draft.style,
          draft.storyPrompt,
          draft.appearanceDetails,
          draft.skinColor,
          draft.hairColor,
          draft.eyeColor,
          JSON.stringify(draft.secondaryCharacters),
          draft.language,
          photoKey,
          "draft",
          kind,
          now,
          now
        )
        .run()
    );
  } catch (err) {
    // Confirmed in production: the "object reset" timeout can be reported
    // back to the caller *after* the write actually landed. A retry then
    // collides on this fresh bookId's primary key — that collision means
    // the draft already exists, i.e. the outcome we wanted, not a new
    // failure.
    if ((err as Error).message?.includes("UNIQUE constraint failed")) return;
    throw err;
  }
}

export async function updateBookBeats(db: D1Database, bookId: string, beats: StoryBeatsResult): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE books SET pages = ?, front_cover = ?, back_cover = ?, cast_sheet = ?, status = ?, updated_at = ? WHERE id = ?`
    )
    .bind(
      JSON.stringify(beats.pages),
      JSON.stringify(beats.frontCover),
      JSON.stringify(beats.backCover),
      JSON.stringify(beats.castSheet),
      "beats_ready",
      now,
      bookId
    )
    .run();
}

interface BookRow {
  id: string;
  name: string;
  age: number;
  traits: string;
  universe: string;
  style: string;
  story_prompt: string;
  appearance_details: string;
  skin_color: string | null;
  hair_color: string | null;
  eye_color: string | null;
  secondary_characters: string;
  language: string;
  photo_key: string | null;
  status: string;
  pages: string | null;
  front_cover: string | null;
  back_cover: string | null;
  cast_sheet: string | null;
  preview_status: string;
  preview_assets: string | null;
  payment_status: string;
  full_status: string;
  full_units_done: number;
  pdf_status: string;
  pdf_units_done: number;
  user_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_provider: string | null;
  paypal_order_id: string | null;
  paypal_authorization_id: string | null;
  format: string | null;
  kind: string;
  avatar_status: string;
  created_at: string;
  updated_at: string;
}

function mapRowToStoredBook(row: BookRow): StoredBook {
  const draft: BookDraftInput = {
    name: row.name,
    age: row.age,
    traits: JSON.parse(row.traits),
    universe: row.universe,
    style: row.style,
    storyPrompt: row.story_prompt,
    skinColor: row.skin_color,
    hairColor: row.hair_color,
    eyeColor: row.eye_color,
    appearanceDetails: row.appearance_details,
    secondaryCharacters: JSON.parse(row.secondary_characters),
    language: row.language,
  };

  const story: StoryBeatsResult | null =
    row.pages && row.front_cover && row.back_cover
      ? {
          pages: JSON.parse(row.pages),
          frontCover: JSON.parse(row.front_cover),
          backCover: JSON.parse(row.back_cover),
          // Nullable for any book whose beats were generated before this
          // column existed (pre-migration rows, or in-flight generations
          // across the deploy) — never let a missing cast sheet break
          // reading an otherwise-normal book.
          castSheet: row.cast_sheet ? JSON.parse(row.cast_sheet) : [],
        }
      : null;

  return {
    id: row.id,
    draft,
    photoKey: row.photo_key,
    status: row.status,
    story,
    previewStatus: row.preview_status,
    previewAssets: row.preview_assets ? JSON.parse(row.preview_assets) : null,
    paymentStatus: row.payment_status,
    fullStatus: row.full_status,
    fullUnitsDone: row.full_units_done,
    pdfStatus: row.pdf_status,
    pdfUnitsDone: row.pdf_units_done,
    userId: row.user_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    // NULL on any book created before PayPal support shipped — treated as
    // implicitly 'stripe' by every reader of this field (worker/scheduled.ts,
    // order-detail routes), never requiring a data backfill.
    paymentProvider: row.payment_provider,
    paypalOrderId: row.paypal_order_id,
    paypalAuthorizationId: row.paypal_authorization_id,
    format: row.format,
    kind: row.kind,
    avatarStatus: row.avatar_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBook(db: D1Database, bookId: string): Promise<StoredBook | null> {
  const row = await db.prepare(`SELECT * FROM books WHERE id = ?`).bind(bookId).first<BookRow>();
  if (!row) return null;
  return mapRowToStoredBook(row);
}

export async function getBooksForUser(db: D1Database, userId: string): Promise<StoredBook[]> {
  const { results } = await db
    .prepare(`SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId)
    .all<BookRow>();

  return results.map(mapRowToStoredBook);
}

export async function stampBookUser(db: D1Database, bookId: string, userId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare(`UPDATE books SET user_id = ?, updated_at = ? WHERE id = ?`).bind(userId, now, bookId).run();
}

export async function updateBookPreview(
  db: D1Database,
  bookId: string,
  status: string,
  assets: PreviewAssets | null
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET preview_status = ?, preview_assets = ?, updated_at = ? WHERE id = ?`)
    .bind(status, assets ? JSON.stringify(assets) : null, now, bookId)
    .run();
}

export async function markBookCheckoutStarted(
  db: D1Database,
  bookId: string,
  format: string,
  stripeSessionId: string
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET format = ?, stripe_session_id = ?, updated_at = ? WHERE id = ?`)
    .bind(format, stripeSessionId, now, bookId)
    .run();
}

// Parallel to markBookCheckoutStarted, for the PayPal checkout path
// (worker/routes/checkout.ts's handleCreatePayPalCheckout) — sets
// payment_provider so downstream code (worker/scheduled.ts's
// captureAndNotify, order-detail card/payment-method display) knows which
// provider's API to call for this book.
export async function markBookPayPalCheckoutStarted(
  db: D1Database,
  bookId: string,
  format: string,
  paypalOrderId: string
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET format = ?, payment_provider = 'paypal', paypal_order_id = ?, updated_at = ? WHERE id = ?`)
    .bind(format, paypalOrderId, now, bookId)
    .run();
}

// Checkout completed — the card is authorized (held), not yet charged.
// Generation is unlocked from this point (see auth.ts's isPaymentUnlocked);
// the actual charge happens later, once the book is ready (see db.ts's
// markBookCaptured, triggered from worker/scheduled.ts).
export async function markBookAuthorized(db: D1Database, bookId: string, paymentIntentId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET payment_status = 'authorized', stripe_payment_intent_id = ?, updated_at = ? WHERE id = ?`)
    .bind(paymentIntentId, now, bookId)
    .run();
}

// Parallel to markBookAuthorized, for the PayPal return-URL handler
// (worker/routes/paypal-checkout.ts) — called right after the server-side
// PayPal "authorize" call succeeds, the PayPal equivalent of Stripe's
// webhook-confirmed authorization.
export async function markBookPayPalAuthorized(db: D1Database, bookId: string, authorizationId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET payment_status = 'authorized', payment_provider = 'paypal', paypal_authorization_id = ?, updated_at = ? WHERE id = ?`)
    .bind(authorizationId, now, bookId)
    .run();
}

export async function markBookCaptured(db: D1Database, bookId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare(`UPDATE books SET payment_status = 'captured', updated_at = ? WHERE id = ?`).bind(now, bookId).run();
}

// The book was already generated (real cost already incurred) so it stays
// reachable — this status just flags that the charge itself needs manual
// follow-up (no admin UI for this yet, a known gap).
export async function markBookCaptureFailed(db: D1Database, bookId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare(`UPDATE books SET payment_status = 'capture_failed', updated_at = ? WHERE id = ?`).bind(now, bookId).run();
}

export async function updateFullProgress(
  db: D1Database,
  bookId: string,
  status: string,
  unitsDone: number
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET full_status = ?, full_units_done = ?, updated_at = ? WHERE id = ?`)
    .bind(status, unitsDone, now, bookId)
    .run();
}

export async function updateAvatarStatus(db: D1Database, bookId: string, status: string): Promise<void> {
  const now = new Date().toISOString();
  await db.prepare(`UPDATE books SET avatar_status = ?, updated_at = ? WHERE id = ?`).bind(status, now, bookId).run();
}

export async function updatePdfProgress(
  db: D1Database,
  bookId: string,
  status: string,
  unitsDone: number
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET pdf_status = ?, pdf_units_done = ?, updated_at = ? WHERE id = ?`)
    .bind(status, unitsDone, now, bookId)
    .run();
}
