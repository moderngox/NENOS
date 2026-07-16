// Ported from poc-imagegen/style-bible.mjs — same Kiddoverse Style Bible
// prompt fragments, kept in sync by hand. Duplicated deliberately rather
// than imported cross-project: poc-imagegen stays a standalone Node
// validation prototype, this is the real (Workers-compatible) copy.
import type { SecondaryCharacterDraft } from "./types";

export const STYLE_CORE = `Painterly, stylized 3D animated-feature illustration, in the visual language of a premium modern animated film while remaining an original style. Crisp silhouettes. High-frequency detail only at focal points, soft brush transitions elsewhere. Premium material rendering for skin, cloth, wood, foliage, water and metal. Cinematic lighting built from a key light, a rim light, bounce light, volumetric light and atmospheric haze, using golden hour, moonlight or cinematic daylight. Rich saturated color with warm highlights and cool shadows and readable contrast — never flat, never desaturated. Camera language: wide establishing or medium emotional framing, clear foreground/midground/background separation, occasional low or Dutch angle for energy. Where appropriate: particles, fireflies, sparkles, glowing flora, energy ribbons, subtle bloom. Animal characters (if present) are expressive, readable, stylized-realistic, with unique silhouettes. The result should look like a single frame from a premium animated feature, adapted into a luxury children's picture book.`;

export const NEGATIVE_QUALITY = `Do not alter the character's identity, proportions, hairstyle or clothing from the reference. No anatomical drift. No duplicated, missing or malformed limbs or fingers. No extra fingers. No warped or asymmetrical faces. No AI artifacts or texture smearing. Do not age the character up or down. Do not render any text, letters, numbers, logos or watermarks inside the image.`;

export const CHARACTER_DESIGN_RULES = `Character design rules: large expressive eyes, appealing proportions, rounded facial forms, rich detailed skin shading, stylized (not photorealistic) anatomy, one consistent hairstyle, one consistent outfit throughout.`;

const UNIVERSES: Record<string, string> = {
  jungle: "a lush jungle: richer layered foliage, god rays through the canopy, soft mist, scattered flowers",
  forest: "a magical forest: layered vegetation, dappled light, drifting magical particles",
  ocean: "an underwater/ocean world: translucent water, drifting foam, soft caustic reflections",
  space: "a cosmic setting: glowing nebulae, drifting dust, cinematic distant planets",
  pirate: "a pirate-adventure coastline: weathered wood, salt haze, warm lantern light, rolling sea",
  city: "a stylized city: warm street light, soft atmospheric haze, layered rooftops and signage",
};

export function universeDescription(key: string): string {
  return UNIVERSES[key] ?? `the story's original setting, enhanced with richer atmosphere, light and texture without changing what it is`;
}

function traitsPhrase(c: SecondaryCharacterDraft): string {
  return [c.skinColor, c.hairColor, c.eyeColor].filter(Boolean).join(", ");
}

// photoRefIndex maps a secondary character's id to its position (1-based) in
// the attached reference images, when a real photo was uploaded for them —
// image #1 is always the main character sheet, so a secondary character's
// photo (if any) is #2, #3, etc., in the order generateImage() receives them.
function secondaryCharacterBlock(secondaryCharacters: SecondaryCharacterDraft[], photoRefIndex: Map<string, number> = new Map()): string {
  if (!secondaryCharacters.length) return "";
  const descriptions = secondaryCharacters.map((c) => {
    const traits = traitsPhrase(c);
    const refIndex = photoRefIndex.get(c.id);
    const photoNote = refIndex ? ` — use attached reference image #${refIndex} for their real likeness, reinterpreted in the Kiddoverse style, not copied photorealistically` : "";
    const traitsNote = traits ? ` (${traits})` : "";
    return `${c.name} (${c.description || c.role}${traitsNote})${photoNote}`;
  });
  return `\nSecondary characters that may appear in this story, each a distinct individual — never a variation, disguise or second copy of the main child protagonist: ${descriptions.join("; ")}. Keep every secondary character's species, coloring and design exactly as described, identical on every page it appears.\n`;
}

export function buildCharacterSheetPrompt(params: {
  name: string;
  age: number;
  universe: string;
  traits: string;
  hasPhoto: boolean;
}): string {
  const { name, age, universe, traits, hasPhoto } = params;
  const likeness = hasPhoto
    ? `Base the child's likeness — skin tone, hair type and color, face shape — on the attached reference photo, reinterpreted in the Kiddoverse illustrated style. Do not copy the photo photorealistically: stylize it fully into the animated look described below.`
    : `No reference photo is attached; build the character purely from the trait description below, fully in the Kiddoverse illustrated style.`;

  return `Generate a full character reference turnaround sheet for a children's storybook protagonist, in the Kiddoverse premium animated style, on a plain neutral studio background. Show three views of the same character at the same scale: front view, three-quarter view, and side view, full body, with consistent lighting across all three.

Character: ${name}, age ${age}. Traits: ${traits}. Story setting: ${universe}.

${likeness}

${CHARACTER_DESIGN_RULES}

${STYLE_CORE}

${NEGATIVE_QUALITY}`;
}

export function buildPagePrompt(params: {
  sceneDescription: string;
  universe: string;
  pageNumber: number;
  pageCount: number;
  secondaryCharacters?: SecondaryCharacterDraft[];
  photoRefIndex?: Map<string, number>;
}): string {
  const { sceneDescription, universe, pageNumber, pageCount, secondaryCharacters = [], photoRefIndex } = params;
  return `Generate ONE single storybook page illustration, using the attached character reference sheet (image #1) as the exact identity, proportions, hairstyle and outfit for the main child protagonist — do not redesign the character in any way. There is exactly one instance of the protagonist in the scene, unless the scene explicitly describes a mirror or water reflection. This is page ${pageNumber} of ${pageCount} of the storybook; keep composition and story logic consistent with a single continuous book.

Environment: ${universeDescription(universe)}.

Scene for this page: ${sceneDescription}.
${secondaryCharacterBlock(secondaryCharacters, photoRefIndex)}
Leave a clear, uncluttered safe zone (upper third or a solid-color corner, whichever composition allows) for narration text and a page-number badge to be added afterward in a separate layout step — do not render any text, letters, numbers or speech bubbles inside the image itself.

${STYLE_CORE}

${NEGATIVE_QUALITY}`;
}

export function buildFrontCoverPrompt(params: {
  universe: string;
  secondaryCharacters?: SecondaryCharacterDraft[];
  photoRefIndex?: Map<string, number>;
  scene?: string;
}): string {
  const { universe, secondaryCharacters = [], photoRefIndex, scene } = params;
  const defaultScene = `The main protagonist stands in a bold, welcoming hero pose that introduces the story, together with their companion character(s) if any.`;
  return `Generate a single full-bleed children's storybook FRONT COVER illustration, using the attached character reference sheet (image #1) as the exact identity, proportions, hairstyle and outfit for the main child protagonist — do not redesign the character in any way. There is exactly one instance of the protagonist.

Environment: ${universeDescription(universe)}.

Scene: ${scene || defaultScene}.
${secondaryCharacterBlock(secondaryCharacters, photoRefIndex)}
This is a COVER illustration, not an interior story page: make it one bold, striking, iconic image rather than a busy scene. Compose with a clear, open area — typically the upper third of the frame (open sky, canopy gap, or soft atmospheric haze) — reserved for a large title logotype to be added afterward as a separate typography layer. Do not render any text, letters, numbers, logos or watermarks inside the image itself.

${STYLE_CORE}

${NEGATIVE_QUALITY}`;
}
