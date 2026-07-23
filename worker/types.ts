export interface SecondaryCharacterDraft {
  id: string;
  role: string;
  name: string;
  age: number | null;
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  description: string;
  // Set server-side after uploading the matching secondaryPhoto_<id> form
  // field (if any) to R2 — never present in the client-submitted JSON.
  photoKey?: string | null;
}

// Shape submitted by the wizard (BookDraftContext), minus the photo File
// (sent as a separate multipart field, not embedded in this JSON).
export interface BookDraftInput {
  name: string;
  age: number;
  traits: string[];
  universe: string;
  style: string; // 'pixar' | 'comic'
  storyPrompt: string;
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  appearanceDetails: string;
  secondaryCharacters: SecondaryCharacterDraft[];
  language: string; // 'fr' | 'en' — the UI language at submit time, the story is written in this language
}

// One story beat: `scene` drives the illustration prompt, `text` is the
// narration composited onto its paired text page. Matches
// poc-imagegen/book.json's `pages[]` shape exactly.
export interface StoryBeat {
  page: number;
  scene: string;
  text: string;
}

export interface FrontCover {
  title: string;
  subtitle: string;
}

export interface BackCover {
  synopsis: string;
}

// Auto-extracted from the child's free-text storyPrompt (and the story
// GPT-4o itself just wrote), covering anyone/anything beyond the
// protagonist that a rich story idea names but that never gets registered
// via the wizard's human/animal-shaped secondaryCharacters step — a
// companion vehicle, an antagonist, a recurring prop. Without this, such
// entities get zero visual consistency treatment across the book's pages
// (see image-style-bible.ts's characterConsistencyBlock, which only ever
// knew about structured secondaryCharacters until this was added).
export type CastMemberKind = "companion" | "vehicle" | "antagonist" | "prop" | "other";
// "remote" = heard/communicated-with only (e.g. a voice on a radio) —
// must never be drawn as physically present in a scene.
export type CastMemberPresence = "physical" | "remote";

export interface CastMember {
  id: string;
  name: string; // must match how the story's "scene" text refers to them
  kind: CastMemberKind;
  visualDescription: string; // fixed, reused verbatim every time they appear — type/material/color/distinguishing features, no pose or action
  role: string; // one line, relationship to the protagonist
  presence: CastMemberPresence;
  isPrimaryVehicle: boolean; // at most one true per book — the protagonist's default ride, if any
}

export interface StoryBeatsResult {
  pages: StoryBeat[];
  frontCover: FrontCover;
  backCover: BackCover;
  castSheet: CastMember[];
}

export interface PreviewAssets {
  characterSheet: string;
  coverFront: string;
  page1: string;
}

export interface StoredBook {
  id: string;
  draft: BookDraftInput;
  photoKey: string | null;
  status: string;
  story: StoryBeatsResult | null;
  previewStatus: string;
  previewAssets: PreviewAssets | null;
  paymentStatus: string;
  fullStatus: string;
  fullUnitsDone: number;
  pdfStatus: string;
  pdfUnitsDone: number;
  userId: string | null;
  stripePaymentIntentId: string | null;
  // NULL means 'stripe' (implicitly, for every book created before PayPal
  // support shipped) — see worker/db.ts's mapRowToStoredBook.
  paymentProvider: string | null;
  paypalOrderId: string | null;
  paypalAuthorizationId: string | null;
  format: string | null;
  // 'book' — a real (potentially purchasable) storybook, the default.
  // 'avatar' — a free, standalone hero-avatar creation (name/age/traits/
  // photo/appearance/secondary characters only, no story, never paid);
  // see worker/routes/avatar.ts.
  kind: string;
  avatarStatus: string;
  createdAt: string;
  updatedAt: string;
}
