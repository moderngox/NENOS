// EUR only for now — the UI shows a €/$ symbol per language but never
// actually converts currency; unifying on EUR for the real charge is a
// deliberate simplification. Amounts in cents. Shared between checkout.ts
// (creating the charge) and me-books.ts (displaying order history).
export const PRICES_CENTS: Record<string, number> = {
  print: 2490,
  digital: 1290,
};
