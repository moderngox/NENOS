import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLanguage } from './LanguageContext';

export interface SecondaryCharacter {
  id: string;
  role: string;
  name: string;
  age: number | null;
  photo: File | null;
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  description: string;
}

export const MAX_SECONDARY_CHARACTERS = 3;

export interface BookDraft {
  name: string;
  age: number | null;
  traits: string[];
  universe: string;
  style: string;
  storyPrompt: string;
  photo: File | null;
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  appearanceDetails: string;
  secondaryCharacters: SecondaryCharacter[];
}

const emptyDraft: BookDraft = {
  name: '',
  age: null,
  traits: [],
  universe: 'space',
  style: 'pixar',
  storyPrompt: '',
  photo: null,
  skinColor: null,
  hairColor: null,
  eyeColor: null,
  appearanceDetails: '',
  secondaryCharacters: [],
};

export interface StoryBeat {
  page: number;
  scene: string;
  text: string;
}

export interface BookStoryResult {
  bookId: string;
  pages: StoryBeat[];
  frontCover: { title: string; subtitle: string };
  backCover: { synopsis: string };
}

export interface PreviewAssetUrls {
  characterSheetUrl: string;
  coverFrontUrl: string;
  page1Url: string;
}

export type PreviewStatus = 'idle' | 'generating' | 'ready' | 'error';

export interface PreviewState {
  status: PreviewStatus;
  assets: PreviewAssetUrls | null;
  error: string | null;
}

const idlePreview: PreviewState = { status: 'idle', assets: null, error: null };

// --- sessionStorage persistence -------------------------------------------
// Survives reloads/back-forward within the same tab, cleared when the tab
// closes (unlike localStorage) — matches "don't lose my progress if I
// accidentally refresh" without indefinitely hoarding abandoned drafts.
//
// File objects (the main photo, each secondary character's photo) can't
// survive a JSON round-trip, so they're deliberately stripped before saving
// and always come back as null after a reload — the rest of the draft
// (name, traits, story prompt, appearance choices...) is what's actually
// tedious to retype, so that's what gets restored.
const STORAGE_KEY = 'nenos:book-draft-v1';

type SerializableSecondaryCharacter = Omit<SecondaryCharacter, 'photo'>;
type SerializableDraft = Omit<BookDraft, 'photo' | 'secondaryCharacters'> & {
  secondaryCharacters: SerializableSecondaryCharacter[];
};

interface PersistedState {
  draft: SerializableDraft;
  story: BookStoryResult | null;
  preview: PreviewState;
}

function toSerializableDraft(draft: BookDraft): SerializableDraft {
  const { photo: _photo, secondaryCharacters, ...rest } = draft;
  return {
    ...rest,
    secondaryCharacters: secondaryCharacters.map(({ photo: _characterPhoto, ...c }) => c),
  };
}

function fromSerializableDraft(input: SerializableDraft): BookDraft {
  return {
    ...emptyDraft,
    ...input,
    photo: null,
    secondaryCharacters: (input.secondaryCharacters ?? []).map((c) => ({ ...c, photo: null })),
  };
}

function loadPersisted(): { draft: BookDraft; story: BookStoryResult | null; preview: PreviewState } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { draft: emptyDraft, story: null, preview: idlePreview };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const draft = parsed.draft ? fromSerializableDraft(parsed.draft) : emptyDraft;
    // A 'generating' status mid-flight at reload time is stale from the
    // browser's point of view — downgrading to 'idle' lets the normal
    // idle -> generatePreview() flow pick back up (the endpoint itself is
    // safe to call again; see worker/routes/preview.ts).
    const preview = parsed.preview && parsed.preview.status !== 'generating' ? parsed.preview : idlePreview;
    return { draft, story: parsed.story ?? null, preview };
  } catch {
    return { draft: emptyDraft, story: null, preview: idlePreview };
  }
}

function persist(draft: BookDraft, story: BookStoryResult | null, preview: PreviewState) {
  try {
    const payload: PersistedState = { draft: toSerializableDraft(draft), story, preview };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage can be unavailable (private browsing) or full —
    // persistence is a nicety, not a hard requirement, so fail silently.
  }
}

function clearPersisted() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
// ---------------------------------------------------------------------------

interface BookDraftContextValue {
  draft: BookDraft;
  update: (patch: Partial<BookDraft>) => void;
  toggleTrait: (trait: string) => void;
  addCharacter: (character: SecondaryCharacter) => void;
  removeCharacter: (id: string) => void;
  reset: () => void;
  story: BookStoryResult | null;
  submit: () => Promise<BookStoryResult>;
  submitAvatar: () => Promise<{ bookId: string }>;
  preview: PreviewState;
  generatePreview: () => Promise<void>;
}

const BookDraftContext = createContext<BookDraftContextValue | null>(null);

const PREVIEW_POLL_INTERVAL_MS = 5000;
const PREVIEW_POLL_MAX_ATTEMPTS = 60; // ~5 minutes, generous given observed 1-4 min generation times

export function BookDraftProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [draft, setDraft] = useState<BookDraft>(() => loadPersisted().draft);
  const [story, setStory] = useState<BookStoryResult | null>(() => loadPersisted().story);
  const [preview, setPreview] = useState<PreviewState>(() => loadPersisted().preview);

  useEffect(() => {
    persist(draft, story, preview);
  }, [draft, story, preview]);

  const value = useMemo<BookDraftContextValue>(
    () => ({
      draft,
      story,
      preview,
      update: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
      toggleTrait: (trait) =>
        setDraft((prev) => ({
          ...prev,
          traits: prev.traits.includes(trait)
            ? prev.traits.filter((t) => t !== trait)
            : [...prev.traits, trait],
        })),
      addCharacter: (character) =>
        setDraft((prev) => ({
          ...prev,
          secondaryCharacters: [...prev.secondaryCharacters, character].slice(0, MAX_SECONDARY_CHARACTERS),
        })),
      removeCharacter: (id) =>
        setDraft((prev) => ({
          ...prev,
          secondaryCharacters: prev.secondaryCharacters.filter((c) => c.id !== id),
        })),
      reset: () => {
        setDraft(emptyDraft);
        setStory(null);
        setPreview(idlePreview);
        clearPersisted();
      },
      submit: async () => {
        const payload = {
          name: draft.name,
          age: draft.age,
          traits: draft.traits,
          universe: draft.universe,
          style: draft.style,
          storyPrompt: draft.storyPrompt,
          skinColor: draft.skinColor,
          hairColor: draft.hairColor,
          eyeColor: draft.eyeColor,
          appearanceDetails: draft.appearanceDetails,
          language: lang,
          // `id` lets the backend match each character to its uploaded photo
          // field (secondaryPhoto_<id>) below.
          secondaryCharacters: draft.secondaryCharacters.map((c) => ({
            id: c.id,
            role: c.role,
            name: c.name,
            age: c.age,
            skinColor: c.skinColor,
            hairColor: c.hairColor,
            eyeColor: c.eyeColor,
            description: c.description,
          })),
        };

        const form = new FormData();
        form.append('draft', JSON.stringify(payload));
        if (draft.photo) form.append('photo', draft.photo);
        for (const c of draft.secondaryCharacters) {
          if (c.photo) form.append(`secondaryPhoto_${c.id}`, c.photo);
        }

        const response = await fetch('/api/books', { method: 'POST', body: form });
        const body = (await response.json().catch(() => null)) as (BookStoryResult & { error?: string }) | null;

        if (!response.ok || !body) {
          throw new Error(body?.error ?? `Request failed with status ${response.status}`);
        }

        setStory(body);
        return body;
      },
      // Free, standalone hero-avatar creation (see worker/routes/avatar.ts)
      // — same draft fields as a book, minus the story prompt. Doesn't
      // touch `story`/`preview` state; the avatar's own ready-page tracks
      // its status independently via the returned bookId.
      submitAvatar: async () => {
        const payload = {
          name: draft.name,
          age: draft.age,
          traits: draft.traits,
          universe: draft.universe,
          style: draft.style,
          skinColor: draft.skinColor,
          hairColor: draft.hairColor,
          eyeColor: draft.eyeColor,
          appearanceDetails: draft.appearanceDetails,
          language: lang,
          secondaryCharacters: draft.secondaryCharacters.map((c) => ({
            id: c.id,
            role: c.role,
            name: c.name,
            age: c.age,
            skinColor: c.skinColor,
            hairColor: c.hairColor,
            eyeColor: c.eyeColor,
            description: c.description,
          })),
        };

        const form = new FormData();
        form.append('draft', JSON.stringify(payload));
        if (draft.photo) form.append('photo', draft.photo);
        for (const c of draft.secondaryCharacters) {
          if (c.photo) form.append(`secondaryPhoto_${c.id}`, c.photo);
        }

        const response = await fetch('/api/avatars', { method: 'POST', body: form });
        const body = (await response.json().catch(() => null)) as { bookId?: string; error?: string } | null;

        if (!response.ok || !body?.bookId) {
          throw new Error(body?.error ?? `Request failed with status ${response.status}`);
        }

        return { bookId: body.bookId };
      },
      generatePreview: async () => {
        if (!story) throw new Error('No story to preview yet.');
        if (preview.status === 'generating' || preview.status === 'ready') return;

        setPreview({ status: 'generating', assets: null, error: null });

        // The endpoint is safe to call again if a previous attempt was
        // interrupted client-side (e.g. by a reload) — it reports back
        // "still generating" (202) instead of starting a duplicate,
        // costly generation run. Poll on that response instead of failing.
        for (let attempt = 0; attempt < PREVIEW_POLL_MAX_ATTEMPTS; attempt++) {
          try {
            const response = await fetch(`/api/books/${story.bookId}/preview`, { method: 'POST' });
            const body = (await response.json().catch(() => null)) as
              | { previewStatus?: string; assets?: PreviewAssetUrls; error?: string }
              | null;

            if (response.status === 202 || body?.previewStatus === 'generating') {
              await new Promise((resolve) => setTimeout(resolve, PREVIEW_POLL_INTERVAL_MS));
              continue;
            }
            if (!response.ok || !body?.assets) {
              throw new Error(body?.error ?? `Request failed with status ${response.status}`);
            }
            setPreview({ status: 'ready', assets: body.assets, error: null });
            return;
          } catch (err) {
            setPreview({ status: 'error', assets: null, error: err instanceof Error ? err.message : String(err) });
            return;
          }
        }
        setPreview({ status: 'error', assets: null, error: 'Generation is taking longer than expected.' });
      },
    }),
    [draft, story, preview, lang],
  );

  return <BookDraftContext.Provider value={value}>{children}</BookDraftContext.Provider>;
}

export function useBookDraft() {
  const ctx = useContext(BookDraftContext);
  if (!ctx) throw new Error('useBookDraft must be used within BookDraftProvider');
  return ctx;
}
