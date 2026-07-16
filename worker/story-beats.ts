import type { BookDraftInput, StoryBeatsResult, StoryBeat } from "./types";

const PAGE_COUNT = 10;
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
  ]
}
The "pages" array must have exactly ${PAGE_COUNT} entries, numbered 1 to ${PAGE_COUNT} in order.

Language rules — these two fields are shown to the reader, everything else is not:
- "text" (every page's narration), "frontCover.title", "frontCover.subtitle" and "backCover.synopsis" MUST be written in ${languageName}, matching the app's current language.
- "scene" must stay in English regardless of the story's language — it's an internal instruction for a separate image-generation model, never shown to the reader, and English keeps that pipeline's prompts consistent. It describes what to draw, never dialogue or text.`;
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
  };
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
