import type { BookDraftInput, SecondaryCharacterDraft } from "../types";
import { insertDraftBook, getBook, updateAvatarStatus, stampBookUser } from "../db";
import { getSessionUser } from "../auth";
import { generateImage } from "../image-client";
import { buildCharacterSheetPrompt, buildPortraitPrompt } from "../image-style-bible";
import { normalizeUniverseForImagePipeline } from "../story-beats";
import { mimeForKey, traitsSummary } from "./preview";

// Free tier, same as the sneak-peek preview for real books — this flow
// exists specifically to be a no-cost, no-payment alternative to buying a
// book (see worker/db.ts's `kind` column).
const AVATAR_QUALITY = "low";
const CHARACTER_SIZE = "1024x1024";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseSecondaryCharacters(raw: unknown): SecondaryCharacterDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c, i) => ({
    id: typeof c?.id === "string" ? c.id : String(i),
    role: typeof c?.role === "string" ? c.role : "",
    name: typeof c?.name === "string" ? c.name : "",
    age: typeof c?.age === "number" ? c.age : null,
    skinColor: typeof c?.skinColor === "string" ? c.skinColor : null,
    hairColor: typeof c?.hairColor === "string" ? c.hairColor : null,
    eyeColor: typeof c?.eyeColor === "string" ? c.eyeColor : null,
    description: typeof c?.description === "string" ? c.description : "",
  }));
}

// Lighter than books.ts's parseDraft — no storyPrompt, since an avatar-only
// creation never has a story.
function parseAvatarDraft(raw: unknown): BookDraftInput {
  if (!raw || typeof raw !== "object") throw new Error('Missing or invalid "draft" field.');
  const d = raw as Record<string, unknown>;

  const missing = ["name", "age", "universe"].filter((key) => !d[key]);
  if (missing.length > 0) throw new Error(`Missing required draft field(s): ${missing.join(", ")}.`);

  return {
    name: String(d.name),
    age: Number(d.age),
    traits: Array.isArray(d.traits) ? d.traits.map(String) : [],
    universe: String(d.universe),
    style: d.style === "comic" || d.style === "manhwa" ? d.style : "pixar",
    storyPrompt: "",
    skinColor: typeof d.skinColor === "string" ? d.skinColor : null,
    hairColor: typeof d.hairColor === "string" ? d.hairColor : null,
    eyeColor: typeof d.eyeColor === "string" ? d.eyeColor : null,
    appearanceDetails: typeof d.appearanceDetails === "string" ? d.appearanceDetails : "",
    secondaryCharacters: parseSecondaryCharacters(d.secondaryCharacters),
    language: d.language === "en" ? "en" : "fr",
  };
}

export async function handleCreateAvatar(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "Expected multipart/form-data body." }, 400);
  }

  const draftRaw = form.get("draft");
  const photo = form.get("photo");

  if (typeof draftRaw !== "string") {
    return jsonResponse({ error: 'Missing "draft" form field (expected a JSON string).' }, 400);
  }

  let draft: BookDraftInput;
  try {
    draft = parseAvatarDraft(JSON.parse(draftRaw));
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 400);
  }

  const bookId = crypto.randomUUID();

  let photoKey: string | null = null;
  if (photo instanceof File) {
    photoKey = `${bookId}/${photo.name || "photo"}`;
    await env.PHOTOS.put(photoKey, await photo.arrayBuffer(), {
      httpMetadata: { contentType: photo.type || "application/octet-stream" },
    });
  }

  for (const character of draft.secondaryCharacters) {
    const secondaryPhoto = form.get(`secondaryPhoto_${character.id}`);
    if (secondaryPhoto instanceof File) {
      const key = `${bookId}/secondary-${character.id}/${secondaryPhoto.name || "photo"}`;
      await env.PHOTOS.put(key, await secondaryPhoto.arrayBuffer(), {
        httpMetadata: { contentType: secondaryPhoto.type || "application/octet-stream" },
      });
      character.photoKey = key;
    }
  }

  try {
    await insertDraftBook(env.DB, bookId, draft, photoKey, "avatar");
  } catch (err) {
    return jsonResponse({ error: `Failed to store draft: ${(err as Error).message}` }, 500);
  }

  return jsonResponse({ bookId });
}

export async function handleGenerateAvatar(bookId: string, env: Env): Promise<Response> {
  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Not found." }, 404);
  if (book.kind !== "avatar") return jsonResponse({ error: "Not an avatar creation." }, 400);

  // Idempotent, same pattern as the sneak-peek preview: a page refresh or a
  // second in-flight call reports back instead of re-generating.
  if (book.avatarStatus === "ready") {
    return jsonResponse({ avatarStatus: "ready" });
  }
  if (book.avatarStatus === "generating") {
    return jsonResponse({ avatarStatus: "generating" }, 202);
  }

  await updateAvatarStatus(env.DB, bookId, "generating");

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
        style: book.draft.style,
      }),
      images: photoInput ? [photoInput] : [],
      size: CHARACTER_SIZE,
      quality: AVATAR_QUALITY,
    });
    await env.PHOTOS.put(`${bookId}/character-sheet.png`, characterSheetBytes, { httpMetadata: { contentType: "image/png" } });

    const characterSheetInput = { bytes: characterSheetBytes, filename: "character-sheet.png", contentType: "image/png" };
    const portraitBytes = await generateImage({
      apiKey: env.OPENAI_API_KEY,
      prompt: buildPortraitPrompt({ style: book.draft.style }),
      images: [characterSheetInput],
      size: CHARACTER_SIZE,
      quality: AVATAR_QUALITY,
    });
    await env.PHOTOS.put(`${bookId}/portrait.png`, portraitBytes, { httpMetadata: { contentType: "image/png" } });

    await updateAvatarStatus(env.DB, bookId, "ready");
    return jsonResponse({ avatarStatus: "ready" });
  } catch (err) {
    await updateAvatarStatus(env.DB, bookId, "error");
    return jsonResponse({ error: `Avatar generation failed: ${(err as Error).message}` }, 502);
  }
}

export async function handleGetAvatarStatus(bookId: string, env: Env): Promise<Response> {
  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Not found." }, 404);
  if (book.kind !== "avatar") return jsonResponse({ error: "Not an avatar creation." }, 400);

  return jsonResponse({
    bookId,
    name: book.draft.name,
    avatarStatus: book.avatarStatus,
    portraitUrl: book.avatarStatus === "ready" ? `/api/books/${bookId}/assets/portrait.png` : null,
  });
}

// The login-at-the-end moment: the draft and its generated images already
// exist server-side the instant the wizard finishes (no account needed to
// trigger generation, mirroring the free sneak-peek preview for real
// books) — logging in here just links it to "their" profile, the same way
// checkout.ts's stampBookUser does for a real order.
export async function handleClaimAvatar(bookId: string, request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "You need to be signed in to save this to your profile." }, 401);

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Not found." }, 404);
  if (book.kind !== "avatar") return jsonResponse({ error: "Not an avatar creation." }, 400);

  await stampBookUser(env.DB, bookId, user.id);
  return jsonResponse({ ok: true });
}
