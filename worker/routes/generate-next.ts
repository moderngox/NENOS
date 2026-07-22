import { getBook, updateFullProgress } from "../db";
import { isPaymentUnlocked } from "../auth";
import { generateImage } from "../image-client";
import { buildBackCoverPrompt, buildCharacterSheetPrompt, buildFrontCoverPrompt, buildPagePrompt, buildPortraitPrompt } from "../image-style-bible";
import { normalizeUniverseForImagePipeline } from "../story-beats";
import { loadSecondaryCharacterPhotos, mimeForKey, traitsSummary } from "./preview";

// Paid product: relock a fresh high-quality character sheet and regenerate
// every other asset from it (not just the pages the free preview skipped)
// so the customer never sees a mix of low- and high-quality art. Stored
// under a distinct `full/` R2 prefix, separate from the sneak-peek assets.
//
// Story pages specifically use PAGE_QUALITY ("medium") rather than
// FULL_QUALITY — at 22 pages per book, pages are the overwhelming majority
// of a book's image-generation cost, while the character sheet, portrait,
// and both covers (a customer's first impression and the profile picture)
// stay at "high". "Medium" is still a clear step up from the free preview's
// "low" tier.
const FULL_QUALITY = "high";
const PAGE_QUALITY = "medium";
const CHARACTER_SIZE = "1024x1024";
const PAGE_SIZE = "1024x1536";
// High-quality edits with reference images observed taking 170-210s in
// testing — comfortably past image-client.ts's 180s default, which caused
// spurious timeouts (and wasted retries against a real, billed API) on
// otherwise-successful generations. Generous margin, well under Workers'
// request limits.
const FULL_TIMEOUT_MS = 280000;
// A "generating" lock older than this is treated as abandoned (the request
// that set it crashed, timed out at the platform level, or otherwise never
// reached the completion/error handler that would have released it) rather
// than genuinely in flight — otherwise a single crashed request strands the
// book at this status forever, since the cron's own idempotency check would
// keep confirming "still generating" without ever retrying. Comfortably
// longer than FULL_TIMEOUT_MS plus overhead.
export const STALE_LOCK_MS = 10 * 60 * 1000;

type Unit =
  | { kind: "character-sheet"; filename: string }
  | { kind: "portrait"; filename: string }
  | { kind: "cover-front"; filename: string }
  | { kind: "page"; filename: string; pageIndex: number }
  | { kind: "cover-back"; filename: string };

function buildPlan(pageCount: number): Unit[] {
  const plan: Unit[] = [
    { kind: "character-sheet", filename: "character-sheet.png" },
    // A dedicated close-up portrait for the account profile avatar — the
    // character sheet is a full-body 3-view turnaround and the cover is a
    // full scene, neither crops well into a circle (see image-style-bible's
    // buildPortraitPrompt for why this needed its own generation).
    { kind: "portrait", filename: "portrait.png" },
    { kind: "cover-front", filename: "cover-front.png" },
  ];
  for (let i = 0; i < pageCount; i++) {
    plan.push({ kind: "page", filename: `page-${String(i + 1).padStart(2, "0")}.png`, pageIndex: i });
  }
  plan.push({ kind: "cover-back", filename: "cover-back.png" });
  return plan;
}

export type GenerateNextResult =
  | { ok: true; fullStatus: string; done: number; total: number }
  | { ok: false; status: number; error: string };

// The single unit of work behind POST /api/books/:id/generate-next — pulled
// out as a plain function (no Response/JSON concerns) so worker/scheduled.ts's
// cron handler can drive the exact same logic without going through HTTP.
export async function generateNextUnit(bookId: string, env: Env): Promise<GenerateNextResult> {
  const book = await getBook(env.DB, bookId);
  if (!book) return { ok: false, status: 404, error: "Book not found." };
  if (!isPaymentUnlocked(book.paymentStatus)) return { ok: false, status: 403, error: "This book hasn't been purchased yet." };
  if (!book.story) return { ok: false, status: 400, error: "Story beats aren't ready yet." };

  const plan = buildPlan(book.story.pages.length);
  const total = plan.length;

  if (book.fullStatus === "ready" || book.fullUnitsDone >= total) {
    return { ok: true, fullStatus: "ready", done: total, total };
  }
  // Same idempotency pattern as the sneak peek: a second in-flight call
  // (e.g. two open reader tabs, or a cron tick overlapping client polling)
  // reports back instead of racing a duplicate, costly high-quality
  // generation for the same unit — unless the lock is stale (see
  // STALE_LOCK_MS), in which case we treat it as abandoned and retry.
  if (book.fullStatus === "generating" && Date.now() - new Date(book.updatedAt).getTime() < STALE_LOCK_MS) {
    return { ok: true, fullStatus: "generating", done: book.fullUnitsDone, total };
  }

  const unit = plan[book.fullUnitsDone];
  await updateFullProgress(env.DB, bookId, "generating", book.fullUnitsDone);

  const universe = normalizeUniverseForImagePipeline(book.draft.universe);

  try {
    if (unit.kind === "character-sheet") {
      const traits = traitsSummary(book.draft);
      let photoInput: { bytes: ArrayBuffer; filename: string; contentType: string } | undefined;
      if (book.photoKey) {
        const object = await env.PHOTOS.get(book.photoKey);
        if (object) {
          photoInput = {
            bytes: await object.arrayBuffer(),
            filename: book.photoKey.split("/").pop() ?? "photo.jpg",
            contentType: object.httpMetadata?.contentType || mimeForKey(book.photoKey),
          };
        }
      }

      const bytes = await generateImage({
        apiKey: env.OPENAI_API_KEY,
        prompt: buildCharacterSheetPrompt({
          name: book.draft.name,
          age: book.draft.age,
          universe,
          traits,
          hasPhoto: Boolean(photoInput),
          style: book.draft.style,
        }),
        images: photoInput ? [photoInput] : [],
        size: CHARACTER_SIZE,
        quality: FULL_QUALITY,
        timeoutMs: FULL_TIMEOUT_MS,
      });
      await env.PHOTOS.put(`${bookId}/full/${unit.filename}`, bytes, { httpMetadata: { contentType: "image/png" } });
    } else {
      const characterSheetObject = await env.PHOTOS.get(`${bookId}/full/character-sheet.png`);
      if (!characterSheetObject) {
        throw new Error("Character sheet must be generated before any other unit.");
      }
      const characterSheetInput = {
        bytes: await characterSheetObject.arrayBuffer(),
        filename: "character-sheet.png",
        contentType: "image/png",
      };
      const { images: secondaryPhotoInputs, photoRefIndex } = await loadSecondaryCharacterPhotos(env, book.draft.secondaryCharacters);
      const referenceImages = [characterSheetInput, ...secondaryPhotoInputs];

      let bytes: ArrayBuffer;
      if (unit.kind === "portrait") {
        bytes = await generateImage({
          apiKey: env.OPENAI_API_KEY,
          prompt: buildPortraitPrompt({ style: book.draft.style }),
          images: referenceImages,
          size: CHARACTER_SIZE,
          quality: FULL_QUALITY,
          timeoutMs: FULL_TIMEOUT_MS,
        });
      } else if (unit.kind === "cover-front") {
        bytes = await generateImage({
          apiKey: env.OPENAI_API_KEY,
          prompt: buildFrontCoverPrompt({
            universe,
            style: book.draft.style,
            secondaryCharacters: book.draft.secondaryCharacters,
            castSheet: book.story.castSheet,
            photoRefIndex,
          }),
          images: referenceImages,
          size: PAGE_SIZE,
          quality: FULL_QUALITY,
          timeoutMs: FULL_TIMEOUT_MS,
        });
      } else if (unit.kind === "cover-back") {
        bytes = await generateImage({
          apiKey: env.OPENAI_API_KEY,
          prompt: buildBackCoverPrompt({ universe, style: book.draft.style }),
          images: referenceImages,
          size: PAGE_SIZE,
          quality: FULL_QUALITY,
          timeoutMs: FULL_TIMEOUT_MS,
        });
      } else {
        const beat = book.story.pages[unit.pageIndex];
        bytes = await generateImage({
          apiKey: env.OPENAI_API_KEY,
          prompt: buildPagePrompt({
            sceneDescription: beat.scene,
            universe,
            pageNumber: unit.pageIndex + 1,
            pageCount: book.story.pages.length,
            style: book.draft.style,
            secondaryCharacters: book.draft.secondaryCharacters,
            castSheet: book.story.castSheet,
            photoRefIndex,
          }),
          images: referenceImages,
          size: PAGE_SIZE,
          quality: PAGE_QUALITY,
          timeoutMs: FULL_TIMEOUT_MS,
        });
      }
      await env.PHOTOS.put(`${bookId}/full/${unit.filename}`, bytes, { httpMetadata: { contentType: "image/png" } });
    }

    const done = book.fullUnitsDone + 1;
    // Release the "generating" lock as soon as this unit finishes — "none"
    // means "not currently in flight", not "hasn't started", so the next
    // caller (client poll or cron tick) is free to proceed to the next unit.
    const status = done >= total ? "ready" : "none";
    await updateFullProgress(env.DB, bookId, status, done);
    return { ok: true, fullStatus: status, done, total };
  } catch (err) {
    await updateFullProgress(env.DB, bookId, "error", book.fullUnitsDone);
    return { ok: false, status: 502, error: `Full-book generation failed: ${(err as Error).message}` };
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGenerateNext(bookId: string, env: Env): Promise<Response> {
  const result = await generateNextUnit(bookId, env);
  if (!result.ok) return jsonResponse({ error: result.error }, result.status);
  if (result.fullStatus === "generating") return jsonResponse(result, 202);
  return jsonResponse(result);
}
