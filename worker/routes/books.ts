import type { BookDraftInput, SecondaryCharacterDraft } from "../types";
import { insertDraftBook, updateBookBeats } from "../db";
import { generateStoryBeats } from "../story-beats";

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

function parseDraft(raw: unknown): BookDraftInput {
  if (!raw || typeof raw !== "object") throw new Error('Missing or invalid "draft" field.');
  const d = raw as Record<string, unknown>;

  const missing = ["name", "age", "universe", "storyPrompt"].filter((key) => !d[key]);
  if (missing.length > 0) throw new Error(`Missing required draft field(s): ${missing.join(", ")}.`);

  return {
    name: String(d.name),
    age: Number(d.age),
    traits: Array.isArray(d.traits) ? d.traits.map(String) : [],
    universe: String(d.universe),
    style: d.style === "comic" ? "comic" : "pixar",
    storyPrompt: String(d.storyPrompt),
    skinColor: typeof d.skinColor === "string" ? d.skinColor : null,
    hairColor: typeof d.hairColor === "string" ? d.hairColor : null,
    eyeColor: typeof d.eyeColor === "string" ? d.eyeColor : null,
    appearanceDetails: typeof d.appearanceDetails === "string" ? d.appearanceDetails : "",
    secondaryCharacters: parseSecondaryCharacters(d.secondaryCharacters),
    language: d.language === "en" ? "en" : "fr",
  };
}

export async function handleCreateBook(request: Request, env: Env): Promise<Response> {
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
    draft = parseDraft(JSON.parse(draftRaw));
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
    await insertDraftBook(env.DB, bookId, draft, photoKey);
  } catch (err) {
    return jsonResponse({ error: `Failed to store draft: ${(err as Error).message}` }, 500);
  }

  try {
    const beats = await generateStoryBeats(env.OPENAI_API_KEY, draft);
    await updateBookBeats(env.DB, bookId, beats);
    return jsonResponse({ bookId, ...beats });
  } catch (err) {
    // Draft is already persisted (status stays "draft"), so this is retryable
    // without re-uploading the photo — worth a dedicated retry endpoint later.
    return jsonResponse({ bookId, error: `Story-beat generation failed: ${(err as Error).message}` }, 502);
  }
}
