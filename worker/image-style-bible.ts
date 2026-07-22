// Ported from poc-imagegen/style-bible.mjs — same Kiddoverse Style Bible
// prompt fragments, kept in sync by hand. Duplicated deliberately rather
// than imported cross-project: poc-imagegen stays a standalone Node
// validation prototype, this is the real (Workers-compatible) copy.
import type { CastMember, SecondaryCharacterDraft } from "./types";

export const STYLE_CORE = `Painterly, stylized 3D animated-feature illustration, in the visual language of a premium modern animated film while remaining an original style. Crisp silhouettes. High-frequency detail only at focal points, soft brush transitions elsewhere. Premium material rendering for skin, cloth, wood, foliage, water and metal. Cinematic lighting built from a key light, a rim light, bounce light, volumetric light and atmospheric haze, using golden hour, moonlight or cinematic daylight. Rich saturated color with warm highlights and cool shadows and readable contrast — never flat, never desaturated. Camera language: wide establishing or medium emotional framing, clear foreground/midground/background separation, occasional low or Dutch angle for energy. Where appropriate: particles, fireflies, sparkles, glowing flora, energy ribbons, subtle bloom. Animal characters (if present) are expressive, readable, stylized-realistic, with unique silhouettes. The result should look like a single frame from a premium animated feature, adapted into a luxury children's picture book.`;

export const NEGATIVE_QUALITY = `Do not alter the character's identity, proportions, hairstyle or clothing from the reference. No anatomical drift. No duplicated, missing or malformed limbs or fingers. No extra fingers. No warped or asymmetrical faces. No AI artifacts or texture smearing. Do not age the character up or down. Do not render any text, letters, numbers, logos or watermarks inside the image.`;

export const CHARACTER_DESIGN_RULES = `Character design rules: large expressive eyes, appealing proportions, rounded facial forms, rich detailed skin shading, stylized (not photorealistic) anatomy, one consistent hairstyle, one consistent outfit throughout.`;

// Ported from poc-imagegen/style-bible-starlight-comic.mjs. Layered on top of
// STYLE_CORE/CHARACTER_DESIGN_RULES (kept identical across styles so the
// character's identity stays consistent) — only the environment/atmosphere
// color grading changes for the "comic" graphic style.
export const COMIC_ATMOSPHERE = `Color grading: deep midnight indigo/navy base, vivid magenta-pink and purple mid-tones, warm gold/orange glow reserved for light sources (city windows, magical creatures, stardust, horizon). High contrast, saturated, poster-like — punchier than a calm cinematic grade, but never muddy. Where appropriate, a subtle halftone comic-print dot-pattern overlay in background/atmospheric areas only (skyline silhouettes, sky gradients, haze) — never over the main character's face or skin, which stays smoothly painterly. Stardust and sparkle particles trail behind magical motion.`;

// Ported from poc-imagegen/style-bible-manhwa.mjs. Unlike the "comic"
// variant, this one changes the character's own line rendering (bold ink
// outlines, chiaroscuro lighting, screentone shading) — not just the
// environment — so it replaces STYLE_CORE/CHARACTER_DESIGN_RULES entirely
// rather than layering on top of them.
export const MANHWA_STYLE_CORE = `Bold Korean webtoon/manhwa-inspired ink illustration. Clean, confident black linework defining every silhouette and major interior form, variable line weight — heavier outer contour, finer interior detail. Dramatic single-source directional lighting producing a graphic, sharply-edged core shadow (chiaroscuro), not soft ambient cinematic falloff. Cross-hatching and fine parallel line texture for shadow mid-tones. Glossy, rounded specular highlights on hair strands and in the eyes, anime-influenced. Rich, slightly desaturated color palette overall, with more vivid saturation reserved for the character against a cooler, textured background. Subtle halftone/screentone dot-pattern shading in background and shadow areas. High contrast, graphic, poster-like. Camera language favors bold, graphic compositions — dramatic close-ups, low angles, or dynamic diagonals.`;

export const MANHWA_CHARACTER_RULES = `Character design rules: large expressive eyes with sharp glossy catch-light highlights, confident ink-drawn eyebrows, appealing stylized (not photorealistic) proportions, clean bold ink outline around the entire figure, one consistent hairstyle rendered with confident flowing linework, one consistent outfit throughout.`;

function styleCore(style: string): string {
  return style === "manhwa" ? MANHWA_STYLE_CORE : STYLE_CORE;
}

function styleCharacterRules(style: string): string {
  return style === "manhwa" ? MANHWA_CHARACTER_RULES : CHARACTER_DESIGN_RULES;
}

// Comic's atmosphere layers on top of STYLE_CORE; manhwa's equivalent
// treatment is already fully baked into MANHWA_STYLE_CORE above.
function atmosphereForStyle(style: string): string {
  return style === "comic" ? `\n${COMIC_ATMOSPHERE}\n` : "";
}

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
//
// Merges two sources of "cast beyond the protagonist" into one consistency
// paragraph, rather than stacking two separate blocks (controls prompt
// length and avoids two instructions about the same entity conflicting):
// - `secondaryCharacters`: wizard-entered, human/animal-shaped, may have an
//   uploaded reference photo.
// - `castSheet`: auto-extracted by generateStoryBeats() from the parent's
//   free-text story idea — covers anything the wizard's secondary-character
//   step has no slot for (a living car, a masked antagonist, a recurring
//   prop) that would otherwise get no consistency treatment at all. See
//   worker/story-beats.ts and worker/types.ts's CastMember.
// A structured `secondaryCharacters` entry wins over a same-named castSheet
// entry (the parent's own data takes precedence over the AI's guess).
function characterConsistencyBlock(
  secondaryCharacters: SecondaryCharacterDraft[],
  castSheet: CastMember[] = [],
  photoRefIndex: Map<string, number> = new Map()
): string {
  // Build one deduped name -> descriptor map first, so the primary-vehicle
  // anchor and remote-presence clause below reuse whichever descriptor won
  // (the parent's own structured entry, not the AI's guess) rather than
  // each re-deciding precedence independently and risking disagreement.
  const entries = new Map<string, string>(); // lowercased name -> "Name (descriptor)"
  for (const c of secondaryCharacters) {
    const traits = traitsPhrase(c);
    const refIndex = photoRefIndex.get(c.id);
    const photoNote = refIndex ? ` — use attached reference image #${refIndex} for their real likeness, reinterpreted in the Kiddoverse style, not copied photorealistically` : "";
    const traitsNote = traits ? ` (${traits})` : "";
    entries.set(c.name.trim().toLowerCase(), `${c.name} (${c.description || c.role}${traitsNote})${photoNote}`);
  }
  for (const m of castSheet) {
    const key = m.name.trim().toLowerCase();
    if (entries.has(key)) continue; // structured entry already wins
    entries.set(key, `${m.name} (${m.visualDescription})`);
  }

  let block = "";
  if (entries.size > 0) {
    block += `\nCast members that may appear in this story beyond the main child protagonist, each a distinct individual — never a variation, disguise or second copy of the protagonist or of each other: ${[...entries.values()].join("; ")}. Keep every cast member's species/type, coloring and design exactly as described, identical on every page they appear.\n`;
  }

  const remoteMembers = castSheet.filter((m) => m.presence === "remote");
  if (remoteMembers.length > 0) {
    const names = remoteMembers.map((m) => m.name).join(", ");
    block += `\nNone of the following are ever physically present in any scene, only heard or communicated with remotely (e.g. by radio): ${names}. If a scene mentions them, show their effect only (a radio, a speaker, a screen) — never draw their body.\n`;
  }

  const primaryVehicle = castSheet.find((m) => m.isPrimaryVehicle);
  if (primaryVehicle) {
    const descriptor = entries.get(primaryVehicle.name.trim().toLowerCase()) ?? `${primaryVehicle.name} (${primaryVehicle.visualDescription})`;
    block += `\nUnless the scene description explicitly places the protagonist elsewhere, the protagonist should be shown riding inside/on ${descriptor} — do not depict the protagonist floating, flying or unsupported in the environment without ${primaryVehicle.name} visibly present.\n`;
  }

  return block;
}

export function buildCharacterSheetPrompt(params: {
  name: string;
  age: number;
  universe: string;
  traits: string;
  hasPhoto: boolean;
  style?: string;
}): string {
  const { name, age, universe, traits, hasPhoto, style = "pixar" } = params;
  const likeness = hasPhoto
    ? `Base the child's likeness — skin tone, hair type and color, face shape — on the attached reference photo, reinterpreted in the style described below. Do not copy the photo photorealistically: stylize it fully into the illustrated look described below.`
    : `No reference photo is attached; build the character purely from the trait description below, fully in the style described below.`;

  return `Generate a full character reference turnaround sheet for a children's storybook protagonist, on a plain neutral studio background. Show three views of the same character at the same scale: front view, three-quarter view, and side view, full body, with consistent lighting across all three.

Character: ${name}, age ${age}. Traits: ${traits}. Story setting: ${universe}.

${likeness}

${styleCharacterRules(style)}

${styleCore(style)}

${NEGATIVE_QUALITY}`;
}

// A dedicated close-up portrait, used as the account/profile avatar —
// distinct from the character sheet (a full-body 3-view turnaround, no
// single clean face-forward crop) and the front cover (a full scene, not a
// close shot). Composed specifically to look good cropped into a circle.
export function buildPortraitPrompt(params: { style?: string }): string {
  const { style = "pixar" } = params;
  return `Generate a single close-up bust portrait of the main child protagonist, using the attached character reference sheet (image #1) as the exact identity, proportions, hairstyle and outfit — do not redesign the character in any way. Head-and-shoulders framing, facing camera or a gentle three-quarter angle, warm confident expression, centered in frame with even margins on all sides. Plain neutral softly-lit studio background (no environment, no props, no other characters) so the portrait reads cleanly when cropped into a circle.

${styleCharacterRules(style)}

${styleCore(style)}

${NEGATIVE_QUALITY}`;
}

export function buildPagePrompt(params: {
  sceneDescription: string;
  universe: string;
  pageNumber: number;
  pageCount: number;
  style?: string;
  secondaryCharacters?: SecondaryCharacterDraft[];
  castSheet?: CastMember[];
  photoRefIndex?: Map<string, number>;
}): string {
  const { sceneDescription, universe, pageNumber, pageCount, style = "pixar", secondaryCharacters = [], castSheet = [], photoRefIndex } = params;
  return `Generate ONE single storybook page illustration, using the attached character reference sheet (image #1) as the exact identity, proportions, hairstyle and outfit for the main child protagonist — do not redesign the character in any way. There is exactly one instance of the protagonist in the scene, unless the scene explicitly describes a mirror or water reflection. This is page ${pageNumber} of ${pageCount} of the storybook; keep composition and story logic consistent with a single continuous book.

Environment: ${universeDescription(universe)}.

Scene for this page: ${sceneDescription}.
${characterConsistencyBlock(secondaryCharacters, castSheet, photoRefIndex)}
Leave a clear, uncluttered safe zone (upper third or a solid-color corner, whichever composition allows) for narration text and a page-number badge to be added afterward in a separate layout step — do not render any text, letters, numbers or speech bubbles inside the image itself.
${atmosphereForStyle(style)}
${styleCore(style)}

${NEGATIVE_QUALITY}`;
}

export function buildFrontCoverPrompt(params: {
  universe: string;
  style?: string;
  secondaryCharacters?: SecondaryCharacterDraft[];
  castSheet?: CastMember[];
  photoRefIndex?: Map<string, number>;
  scene?: string;
}): string {
  const { universe, style = "pixar", secondaryCharacters = [], castSheet = [], photoRefIndex, scene } = params;
  const defaultScene = `The main protagonist stands in a bold, welcoming hero pose that introduces the story, together with their companion character(s) if any.`;
  return `Generate a single full-bleed children's storybook FRONT COVER illustration, using the attached character reference sheet (image #1) as the exact identity, proportions, hairstyle and outfit for the main child protagonist — do not redesign the character in any way. There is exactly one instance of the protagonist.

Environment: ${universeDescription(universe)}.

Scene: ${scene || defaultScene}.
${characterConsistencyBlock(secondaryCharacters, castSheet, photoRefIndex)}
This is a COVER illustration, not an interior story page: make it one bold, striking, iconic image rather than a busy scene. Compose with a clear, open area — typically the upper third of the frame (open sky, canopy gap, or soft atmospheric haze) — reserved for a large title logotype to be added afterward as a separate typography layer. Do not render any text, letters, numbers, logos or watermarks inside the image itself.
${atmosphereForStyle(style)}
${styleCore(style)}

${NEGATIVE_QUALITY}`;
}

export function buildBackCoverPrompt(params: { universe: string; style?: string; scene?: string }): string {
  const { universe, style = "pixar", scene } = params;
  const defaultScene = `A calm, wide establishing view of the same world as the front cover, evoking the story without repeating its central moment. The protagonist may appear small and distant, or be omitted entirely — this is a quiet backdrop, not a character portrait.`;
  return `Generate a single children's storybook BACK COVER illustration.

Environment: ${universeDescription(universe)}.

Scene: ${scene || defaultScene}.

Leave a large, uncluttered, softly lit area (plain sky, calm water, or soft out-of-focus foliage) reserved for a paragraph of synopsis text to be added afterward as a separate typography layer. Do not render any text, letters, numbers, logos, barcodes or watermarks inside the image itself.
${atmosphereForStyle(style)}
${styleCore(style)}

${NEGATIVE_QUALITY}`;
}
