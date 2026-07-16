// Curated collection of example books shown on /exemples — static, baked-in
// demo content (see poc-imagegen/generate-lea-example.mjs), not tied to the
// D1/R2 book system used for real customer orders.
export interface ExampleBook {
  slug: string;
  basePath: string;
  coverUrl: string;
  pageCount: number;
}

export const exampleBooks: ExampleBook[] = [
  {
    slug: 'lea-dragon-etoiles',
    basePath: '/exemples/lea-dragon-etoiles',
    coverUrl: '/exemples/lea-dragon-etoiles/00-cover-front.png',
    pageCount: 10,
  },
];
