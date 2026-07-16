import type { BookDraftInput, PreviewAssets, StoredBook, StoryBeatsResult } from "./types";

export async function insertDraftBook(
  db: D1Database,
  bookId: string,
  draft: BookDraftInput,
  photoKey: string | null
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO books (
        id, name, age, traits, universe, story_prompt,
        appearance_details, skin_color, hair_color, eye_color, secondary_characters,
        language, photo_key, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      bookId,
      draft.name,
      draft.age,
      JSON.stringify(draft.traits),
      draft.universe,
      draft.storyPrompt,
      draft.appearanceDetails,
      draft.skinColor,
      draft.hairColor,
      draft.eyeColor,
      JSON.stringify(draft.secondaryCharacters),
      draft.language,
      photoKey,
      "draft",
      now,
      now
    )
    .run();
}

export async function updateBookBeats(db: D1Database, bookId: string, beats: StoryBeatsResult): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE books SET pages = ?, front_cover = ?, back_cover = ?, status = ?, updated_at = ? WHERE id = ?`
    )
    .bind(
      JSON.stringify(beats.pages),
      JSON.stringify(beats.frontCover),
      JSON.stringify(beats.backCover),
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
  preview_status: string;
  preview_assets: string | null;
}

export async function getBook(db: D1Database, bookId: string): Promise<StoredBook | null> {
  const row = await db.prepare(`SELECT * FROM books WHERE id = ?`).bind(bookId).first<BookRow>();
  if (!row) return null;

  const draft: BookDraftInput = {
    name: row.name,
    age: row.age,
    traits: JSON.parse(row.traits),
    universe: row.universe,
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
      ? { pages: JSON.parse(row.pages), frontCover: JSON.parse(row.front_cover), backCover: JSON.parse(row.back_cover) }
      : null;

  return {
    id: row.id,
    draft,
    photoKey: row.photo_key,
    status: row.status,
    story,
    previewStatus: row.preview_status,
    previewAssets: row.preview_assets ? JSON.parse(row.preview_assets) : null,
  };
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

export async function markBookPaid(db: D1Database, bookId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE books SET payment_status = 'paid', updated_at = ? WHERE id = ?`)
    .bind(now, bookId)
    .run();
  // TODO: this is the hook point for triggering full-book generation
  // (remaining 9 pages + back cover, quality: high) — deferred, see plan.
}
