import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface SecondaryCharacter {
  id: string;
  role: string;
  name: string;
  age: number | null;
  photo: File | null;
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
  hairColor: null,
  eyeColor: null,
  appearanceDetails: '',
  secondaryCharacters: [],
};

interface BookDraftContextValue {
  draft: BookDraft;
  update: (patch: Partial<BookDraft>) => void;
  toggleTrait: (trait: string) => void;
  addCharacter: (character: SecondaryCharacter) => void;
  removeCharacter: (id: string) => void;
  reset: () => void;
}

const BookDraftContext = createContext<BookDraftContextValue | null>(null);

export function BookDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookDraft>(emptyDraft);

  const value = useMemo<BookDraftContextValue>(
    () => ({
      draft,
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
      reset: () => setDraft(emptyDraft),
    }),
    [draft],
  );

  return <BookDraftContext.Provider value={value}>{children}</BookDraftContext.Provider>;
}

export function useBookDraft() {
  const ctx = useContext(BookDraftContext);
  if (!ctx) throw new Error('useBookDraft must be used within BookDraftProvider');
  return ctx;
}
