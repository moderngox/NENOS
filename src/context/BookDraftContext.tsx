import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
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

interface BookDraftContextValue {
  draft: BookDraft;
  update: (patch: Partial<BookDraft>) => void;
  toggleTrait: (trait: string) => void;
  addCharacter: (character: SecondaryCharacter) => void;
  removeCharacter: (id: string) => void;
  reset: () => void;
  story: BookStoryResult | null;
  submit: () => Promise<BookStoryResult>;
  preview: PreviewState;
  generatePreview: () => Promise<void>;
}

const BookDraftContext = createContext<BookDraftContextValue | null>(null);

export function BookDraftProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [draft, setDraft] = useState<BookDraft>(emptyDraft);
  const [story, setStory] = useState<BookStoryResult | null>(null);
  const [preview, setPreview] = useState<PreviewState>(idlePreview);

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
      },
      submit: async () => {
        const payload = {
          name: draft.name,
          age: draft.age,
          traits: draft.traits,
          universe: draft.universe,
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
      generatePreview: async () => {
        if (!story) throw new Error('No story to preview yet.');
        if (preview.status === 'generating' || preview.status === 'ready') return;

        setPreview({ status: 'generating', assets: null, error: null });
        try {
          const response = await fetch(`/api/books/${story.bookId}/preview`, { method: 'POST' });
          const body = (await response.json().catch(() => null)) as
            | { assets?: PreviewAssetUrls; error?: string }
            | null;

          if (!response.ok || !body?.assets) {
            throw new Error(body?.error ?? `Request failed with status ${response.status}`);
          }
          setPreview({ status: 'ready', assets: body.assets, error: null });
        } catch (err) {
          setPreview({ status: 'error', assets: null, error: err instanceof Error ? err.message : String(err) });
        }
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
