import { getBook, updateBookPreview } from "../db";
import { generateImage, type ImageInput } from "../image-client";
import { buildCharacterSheetPrompt, buildFrontCoverPrompt, buildPagePrompt } from "../image-style-bible";
import { normalizeUniverseForImagePipeline } from "../story-beats";
import type { PreviewAssets, SecondaryCharacterDraft } from "../types";

const PREVIEW_QUALITY = "low"; // cheap by design — this triggers on every wizard completion, paid or not.
const CHARACTER_SIZE = "1024x1024";
const PAGE_SIZE = "1024x1536";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function mimeForKey(key: string): string {
  const ext = key.toLowerCase().split(".").pop();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

// image #1 is always the main character sheet; secondary characters with a
// real uploaded photo get appended as additional reference images (#2, #3,
// ...) so the model can use their real likeness instead of text alone.
export async function loadSecondaryCharacterPhotos(
  env: Env,
  secondaryCharacters: SecondaryCharacterDraft[]
): Promise<{ images: ImageInput[]; photoRefIndex: Map<string, number> }> {
  const images: ImageInput[] = [];
  const photoRefIndex = new Map<string, number>();

  for (const character of secondaryCharacters) {
    if (!character.photoKey) continue;
    const object = await env.PHOTOS.get(character.photoKey);
    if (!object) continue;
    images.push({
      bytes: await object.arrayBuffer(),
      filename: character.photoKey.split("/").pop() ?? "photo.jpg",
      contentType: object.httpMetadata?.contentType || mimeForKey(character.photoKey),
    });
    // +2: slot #1 is the character sheet, images[] here is 0-indexed.
    photoRefIndex.set(character.id, images.length + 1);
  }

  return { images, photoRefIndex };
}

export function traitsSummary(draft: {
  traits: string[];
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  appearanceDetails: string;
}): string {
  return (
    [draft.traits.join(", "), draft.skinColor, draft.hairColor, draft.eyeColor, draft.appearanceDetails].filter(Boolean).join(", ") ||
    "no specific traits given"
  );
}

export async function handleGeneratePreview(bookId: string, env: Env): Promise<Response> {
  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Book not found." }, 404);
  if (!book.story) return jsonResponse({ error: "Story beats aren't ready yet — call POST /api/books first." }, 400);

  // Idempotent: a page refresh on Revelation shouldn't re-trigger (and re-pay for) generation.
  if (book.previewStatus === "ready" && book.previewAssets) {
    return jsonResponse({ previewStatus: "ready", assets: assetUrls(bookId, book.previewAssets) });
  }
  // A previous call already kicked off generation (possibly interrupted
  // client-side by a reload, but still running server-side) — report back
  // instead of starting a second, duplicate, paid generation run.
  if (book.previewStatus === "generating") {
    return jsonResponse({ previewStatus: "generating" }, 202);
  }

  await updateBookPreview(env.DB, bookId, "generating", null);

  const universe = normalizeUniverseForImagePipeline(book.draft.universe);
  const traits = traitsSummary(book.draft);

  try {
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

    const characterSheetBytes = await generateImage({
      apiKey: env.OPENAI_API_KEY,
      prompt: buildCharacterSheetPrompt({
        name: book.draft.name,
        age: book.draft.age,
        universe,
        traits,
        hasPhoto: Boolean(photoInput),
      }),
      images: photoInput ? [photoInput] : [],
      size: CHARACTER_SIZE,
      quality: PREVIEW_QUALITY,
    });
    await env.PHOTOS.put(`${bookId}/character-sheet.png`, characterSheetBytes, {
      httpMetadata: { contentType: "image/png" },
    });

    const characterSheetInput = { bytes: characterSheetBytes, filename: "character-sheet.png", contentType: "image/png" };
    const { images: secondaryPhotoInputs, photoRefIndex } = await loadSecondaryCharacterPhotos(env, book.draft.secondaryCharacters);
    const referenceImages = [characterSheetInput, ...secondaryPhotoInputs];

    const coverBytes = await generateImage({
      apiKey: env.OPENAI_API_KEY,
      prompt: buildFrontCoverPrompt({ universe, style: book.draft.style, secondaryCharacters: book.draft.secondaryCharacters, photoRefIndex }),
      images: referenceImages,
      size: PAGE_SIZE,
      quality: PREVIEW_QUALITY,
    });
    await env.PHOTOS.put(`${bookId}/cover-front.png`, coverBytes, { httpMetadata: { contentType: "image/png" } });

    const firstBeat = book.story.pages[0];
    const page1Bytes = await generateImage({
      apiKey: env.OPENAI_API_KEY,
      prompt: buildPagePrompt({
        sceneDescription: firstBeat.scene,
        universe,
        pageNumber: 1,
        pageCount: book.story.pages.length,
        style: book.draft.style,
        secondaryCharacters: book.draft.secondaryCharacters,
        photoRefIndex,
      }),
      images: referenceImages,
      size: PAGE_SIZE,
      quality: PREVIEW_QUALITY,
    });
    await env.PHOTOS.put(`${bookId}/page-01.png`, page1Bytes, { httpMetadata: { contentType: "image/png" } });

    const assets: PreviewAssets = {
      characterSheet: "character-sheet.png",
      coverFront: "cover-front.png",
      page1: "page-01.png",
    };
    await updateBookPreview(env.DB, bookId, "ready", assets);
    return jsonResponse({ previewStatus: "ready", assets: assetUrls(bookId, assets) });
  } catch (err) {
    await updateBookPreview(env.DB, bookId, "error", null);
    return jsonResponse({ error: `Preview generation failed: ${(err as Error).message}` }, 502);
  }
}

function assetUrls(bookId: string, assets: PreviewAssets) {
  const base = `/api/books/${bookId}/assets`;
  return {
    characterSheetUrl: `${base}/${assets.characterSheet}`,
    coverFrontUrl: `${base}/${assets.coverFront}`,
    page1Url: `${base}/${assets.page1}`,
  };
}
