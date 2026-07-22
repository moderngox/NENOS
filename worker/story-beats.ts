import type { BookDraftInput, StoryBeatsResult, StoryBeat, CastMember, CastMemberKind, CastMemberPresence } from "./types";

const PAGE_COUNT = 22; // 22 story pages + front/back cover = 24 total.
const MODEL = "gpt-4o"; // vertical-slice choice; revisit against current OpenAI docs before shipping.

const UNIVERSE_LABELS: Record<string, string> = {
  space: "a cosmic setting: glowing nebulae, drifting dust, cinematic distant planets",
  pirates: "a pirate-adventure coastline: weathered wood, salt haze, warm lantern light, rolling sea",
  forest: "a magical forest: layered vegetation, dappled light, drifting magical particles",
};

const LANGUAGE_NAMES: Record<string, string> = {
  fr: "French",
  en: "English",
};

// The wizard uses "pirates" (plural); poc-imagegen's image-side palette map
// (style-bible.mjs) uses "pirate" (singular). Not needed in this module yet,
// but this is where that translation should happen once the image pipeline
// gets wired to these beats.
const UNIVERSE_ID_FOR_IMAGE_PIPELINE: Record<string, string> = {
  pirates: "pirate",
};
export function normalizeUniverseForImagePipeline(universe: string): string {
  return UNIVERSE_ID_FOR_IMAGE_PIPELINE[universe] ?? universe;
}

function buildPrompt(draft: BookDraftInput): string {
  const universeLabel = UNIVERSE_LABELS[draft.universe] ?? draft.universe;
  const secondary =
    draft.secondaryCharacters
      .map((c) => `${c.name} (${c.role}${c.description ? `, ${c.description}` : ""})`)
      .join("; ") || "none";
  const languageName = LANGUAGE_NAMES[draft.language] ?? LANGUAGE_NAMES.fr;

  return `You are a children's picture book writer. Write a ${PAGE_COUNT}-page story for a child named ${draft.name}, age ${draft.age}.

Setting: ${universeLabel}.
Personality traits to reflect in the story: ${draft.traits.join(", ") || "curious, kind"}.
Companion/secondary characters: ${secondary}.
The child's own idea for the story (may be written in ${languageName}): "${draft.storyPrompt}"

Write exactly ${PAGE_COUNT} story beats that adapt the child's idea into a complete, age-appropriate adventure with a clear beginning, a small challenge, and a warm resolution. Also write a book title, a short subtitle, and a 2-3 sentence back-cover synopsis.

Respond with ONLY a JSON object of this exact shape, no other text:
{
  "frontCover": { "title": "string", "subtitle": "string" },
  "backCover": { "synopsis": "string" },
  "pages": [
    { "page": 1, "scene": "a visual description of this page for an illustrator, no dialogue or text", "text": "1-3 sentences of narration for a young child" }
  ],
  "castSheet": [
    {
      "id": "string, short slug e.g. \\"nitro\\"",
      "name": "string, must exactly match how you refer to them in \\"scene\\" text",
      "kind": "companion | vehicle | antagonist | prop | other",
      "visualDescription": "string — a FIXED description (type/material/color/distinguishing features only, no pose or action) to reuse verbatim every time they appear, so an illustrator draws them identically on every page",
      "role": "string, one line, their relationship to ${draft.name}",
      "presence": "physical | remote",
      "isPrimaryVehicle": true or false
    }
  ]
}
The "pages" array must have exactly ${PAGE_COUNT} entries, numbered 1 to ${PAGE_COUNT} in order.

For "castSheet": extract every named entity besides ${draft.name} that appears in the story you just wrote or in the child's own idea above — companions, vehicles, antagonists, recurring props, anyone/anything that should look the same every time they appear. This also includes anyone the story only ever describes as communicating from off-scene (e.g. family "guiding by radio") — include them too, even without a strong visual description, specifically so they're marked "remote" and an illustrator knows never to draw them physically present. Give each one a fixed "visualDescription" that never changes from page to page. Set "presence" to "remote" for anyone explicitly never physically present in a scene (a voice on a radio, a phone call, etc.) — everyone else is "physical". Set "isPrimaryVehicle" to true on at most one entry, only if ${draft.name} is meant to ride inside/on it as their default way of getting around in this story. Do not duplicate anyone already listed above under "Companion/secondary characters" — skip those names here. If there's no such entity, return an empty array.

Language rules — these two fields are shown to the reader, everything else is not:
- "text" (every page's narration), "frontCover.title", "frontCover.subtitle" and "backCover.synopsis" MUST be written in ${languageName}, matching the app's current language.
- "scene", and every field inside "castSheet", must stay in English regardless of the story's language — these are internal instructions for a separate image-generation model, never shown to the reader, and English keeps that pipeline's prompts consistent. They describe what to draw, never dialogue or text.`;
}

function validateBeats(parsed: unknown): StoryBeatsResult {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Story-beat response was not a JSON object.");
  }
  const obj = parsed as Record<string, unknown>;
  const pages = obj.pages;
  if (!Array.isArray(pages) || pages.length !== PAGE_COUNT) {
    throw new Error(`Expected exactly ${PAGE_COUNT} pages, got ${Array.isArray(pages) ? pages.length : "none"}.`);
  }
  pages.forEach((p, i) => {
    if (typeof (p as Record<string, unknown>)?.scene !== "string" || typeof (p as Record<string, unknown>)?.text !== "string") {
      throw new Error(`Page ${i + 1} is missing "scene" or "text".`);
    }
  });
  const frontCover = obj.frontCover as Record<string, unknown> | undefined;
  const backCover = obj.backCover as Record<string, unknown> | undefined;
  if (typeof frontCover?.title !== "string" || typeof backCover?.synopsis !== "string") {
    throw new Error('Missing frontCover.title or backCover.synopsis.');
  }

  const validPages: StoryBeat[] = pages.map((p, i) => {
    const page = p as Record<string, unknown>;
    return { page: i + 1, scene: page.scene as string, text: page.text as string };
  });

  return {
    pages: validPages,
    frontCover: { title: frontCover.title, subtitle: typeof frontCover.subtitle === "string" ? frontCover.subtitle : "" },
    backCover: { synopsis: backCover.synopsis },
    castSheet: validateCastSheet(obj.castSheet),
  };
}

const CAST_MEMBER_KINDS: CastMemberKind[] = ["companion", "vehicle", "antagonist", "prop", "other"];
const CAST_MEMBER_PRESENCES: CastMemberPresence[] = ["physical", "remote"];

// A new, purely additive field on an otherwise reliable, already-billed
// story-generation call — a missing or malformed castSheet (or one bad
// entry in it) must never fail the whole request. Skip what doesn't
// parse, default to [] rather than throwing.
function validateCastSheet(raw: unknown): CastMember[] {
  if (!Array.isArray(raw)) return [];
  const members: CastMember[] = [];
  raw.forEach((entry, i) => {
    if (!entry || typeof entry !== "object") return;
    const e = entry as Record<string, unknown>;
    if (typeof e.name !== "string" || !e.name.trim()) return;
    if (typeof e.visualDescription !== "string" || !e.visualDescription.trim()) return;
    members.push({
      id: typeof e.id === "string" && e.id.trim() ? e.id.trim() : `cast-${i}`,
      name: e.name.trim(),
      kind: CAST_MEMBER_KINDS.includes(e.kind as CastMemberKind) ? (e.kind as CastMemberKind) : "other",
      visualDescription: e.visualDescription.trim(),
      role: typeof e.role === "string" ? e.role.trim() : "",
      presence: CAST_MEMBER_PRESENCES.includes(e.presence as CastMemberPresence) ? (e.presence as CastMemberPresence) : "physical",
      isPrimaryVehicle: e.isPrimaryVehicle === true,
    });
  });
  // At most one primary vehicle, however many the model claimed — keep the first.
  let seenPrimaryVehicle = false;
  return members.map((m) => {
    if (!m.isPrimaryVehicle) return m;
    if (seenPrimaryVehicle) return { ...m, isPrimaryVehicle: false };
    seenPrimaryVehicle = true;
    return m;
  });
}

export async function generateStoryBeats(apiKey: string, draft: BookDraftInput): Promise<StoryBeatsResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildPrompt(draft) }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI chat completions error ${response.status}: ${body}`);
  }

  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned from OpenAI chat completions.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Story-beat response was not valid JSON.");
  }

  return validateBeats(parsed);
}
