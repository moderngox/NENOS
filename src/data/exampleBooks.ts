import type { Lang } from '../i18n/strings';

// Curated collection of example books shown on /exemples. Most are static,
// baked-in demo content (see poc-imagegen/generate-lea-example.mjs), not
// tied to the D1/R2 book system used for real customer orders — but a
// `bookId` entry means it's a real customer order instead (shown publicly
// with that customer's explicit consent), served through the same
// /api/books/:id routes and reader (BookReader.tsx at /livre/:bookId) as any
// other order, rather than the static-file reader used for the rest.
export interface ExampleBook {
  slug: string;
  bookId?: string;
  basePath?: string;
  coverUrl: string;
  pageCount: number;
  title: string;
  subtitle: string;
  styleLabel: string;
  universeLabel: string;
}

// A function of `lang` rather than a plain constant because the two real
// customer books were each generated in a single fixed language (their
// author's choice) and shouldn't be retranslated — only the style/universe
// labels localize with the site language, same as everywhere else.
export function getExampleBooks(lang: Lang): ExampleBook[] {
  return [
    {
      slug: 'lea-dragon-etoiles',
      basePath: '/exemples/lea-dragon-etoiles',
      coverUrl: '/exemples/lea-dragon-etoiles/00-cover-front.png',
      pageCount: 10,
      title: lang === 'fr' ? 'Léa et le Dragon des Étoiles' : 'Lea and the Dragon of the Stars',
      subtitle: lang === 'fr' ? 'Une aventure sous les étoiles' : 'An adventure under the stars',
      styleLabel: lang === 'fr' ? 'Comic à effet demi-ton' : 'Halftone comic',
      universeLabel: lang === 'fr' ? 'Ciel étoilé nocturne' : 'Starry night sky',
    },
    {
      slug: 'reves-cosmiques-de-ced',
      bookId: '72a6db48-699c-4f04-9d1f-dcb065570e93',
      coverUrl: '/api/books/72a6db48-699c-4f04-9d1f-dcb065570e93/full-assets/cover-front.png',
      pageCount: 10,
      title: 'Rêves Cosmiques de Ced',
      subtitle: 'Un Voyage à Travers les Étoiles',
      styleLabel: lang === 'fr' ? 'Animation premium' : 'Premium animation',
      universeLabel: lang === 'fr' ? 'Espace' : 'Space',
    },
    {
      slug: 'yaiza-cosmic-adventure',
      bookId: '2ffca42e-1cc8-4710-b450-94fc21629357',
      coverUrl: '/api/books/2ffca42e-1cc8-4710-b450-94fc21629357/full-assets/cover-front.png',
      pageCount: 10,
      title: "Yaiza's Cosmic Adventure",
      subtitle: 'A Journey Among the Stars',
      styleLabel: lang === 'fr' ? 'Comic demi-ton' : 'Halftone comic',
      universeLabel: lang === 'fr' ? 'Espace' : 'Space',
    },
  ];
}
