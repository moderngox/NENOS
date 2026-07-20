import { getBooksForUser } from "../db";
import { getSessionUser, isPaymentUnlocked } from "../auth";
import type { StoredBook } from "../types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const POINTS_PER_BOOK = 100;

function byCreatedAtDesc(a: StoredBook, b: StoredBook): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

// The "kid profile" shown at the top of the account dashboard. Two kinds of
// records feed it:
// - `kind: "book"` + payment-unlocked — a real, committed order. Universes,
//   companions and points are scoped to these only (matches the product
//   spec: rewards/stats are earned by actually generating books).
// - `kind: "avatar"` — a free, standalone hero-avatar creation (see
//   worker/routes/avatar.ts). These never carry payment/points, but still
//   populate name/age/traits/avatar for a brand-new user who hasn't bought
//   a book yet, so the blank state doesn't linger unnecessarily.
export interface KidProfileResponse {
  hasBooks: boolean;
  name: string | null;
  age: number | null;
  avatarUrl: string | null;
  favoriteUniverses: string[];
  traits: string[];
  skinColor: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  appearanceDetails: string;
  points: number;
  booksGenerated: number;
  secondaryCharacters: { name: string; role: string }[];
}

// Pulled out from handleGetMyProfile so worker/routes/admin/customer-detail.ts
// can build the exact same "kid profile" card for an arbitrary customer
// (looked up by userId, no session involved) instead of only "me".
export async function buildKidProfile(db: D1Database, userId: string): Promise<KidProfileResponse> {
  const books = await getBooksForUser(db, userId);
  const qualifying = books.filter((b) => b.kind === "book" && isPaymentUnlocked(b.paymentStatus));
  const avatarBooks = books.filter((b) => b.kind === "avatar");

  if (qualifying.length === 0 && avatarBooks.length === 0) {
    return {
      hasBooks: false,
      name: null,
      age: null,
      avatarUrl: null,
      favoriteUniverses: [],
      traits: [],
      skinColor: null,
      hairColor: null,
      eyeColor: null,
      appearanceDetails: "",
      points: 0,
      booksGenerated: 0,
      secondaryCharacters: [],
    };
  }

  // Whichever record — a paid book or a free avatar creation — was made
  // most recently defines the displayed name/age/traits/appearance.
  const profileSource = [...qualifying, ...avatarBooks].sort(byCreatedAtDesc)[0];

  const readyBooks = qualifying.filter((b) => b.fullStatus === "ready");
  const readyAvatarBooks = avatarBooks.filter((b) => b.avatarStatus === "ready");

  // Whichever ready portrait is the most recent wins — a paid book generated
  // before the portrait unit existed has no portrait.png, so blindly
  // preferring "paid over free" would point at a missing asset instead of a
  // perfectly good newer avatar-only portrait.
  const portraitSource = [...readyBooks, ...readyAvatarBooks].sort(byCreatedAtDesc)[0];
  const avatarUrl = portraitSource
    ? portraitSource.kind === "book"
      ? `/api/books/${portraitSource.id}/full-assets/portrait.png`
      : `/api/books/${portraitSource.id}/assets/portrait.png`
    : null;

  const universeCounts = new Map<string, number>();
  for (const b of qualifying) {
    universeCounts.set(b.draft.universe, (universeCounts.get(b.draft.universe) ?? 0) + 1);
  }
  const favoriteUniverses = Array.from(universeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const secondaryCharacters: { name: string; role: string }[] = [];
  const seenNames = new Set<string>();
  for (const b of qualifying) {
    for (const c of b.draft.secondaryCharacters) {
      const key = c.name.trim().toLowerCase();
      if (!key || seenNames.has(key)) continue;
      seenNames.add(key);
      secondaryCharacters.push({ name: c.name, role: c.role });
    }
  }

  return {
    hasBooks: true,
    name: profileSource.draft.name,
    age: profileSource.draft.age,
    avatarUrl,
    favoriteUniverses,
    traits: profileSource.draft.traits,
    skinColor: profileSource.draft.skinColor,
    hairColor: profileSource.draft.hairColor,
    eyeColor: profileSource.draft.eyeColor,
    appearanceDetails: profileSource.draft.appearanceDetails,
    points: readyBooks.length * POINTS_PER_BOOK,
    booksGenerated: readyBooks.length,
    secondaryCharacters: secondaryCharacters.slice(0, 12),
  };
}

export async function handleGetMyProfile(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);
  return jsonResponse(await buildKidProfile(env.DB, user.id));
}
