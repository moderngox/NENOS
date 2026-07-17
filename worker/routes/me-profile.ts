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
export async function handleGetMyProfile(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);

  const books = await getBooksForUser(env.DB, user.id);
  const qualifying = books.filter((b) => b.kind === "book" && isPaymentUnlocked(b.paymentStatus));
  const avatarBooks = books.filter((b) => b.kind === "avatar");

  if (qualifying.length === 0 && avatarBooks.length === 0) {
    return jsonResponse({
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
    });
  }

  // Whichever record — a paid book or a free avatar creation — was made
  // most recently defines the displayed name/age/traits/appearance.
  const profileSource = [...qualifying, ...avatarBooks].sort(byCreatedAtDesc)[0];

  const readyBooks = qualifying.filter((b) => b.fullStatus === "ready");
  const readyAvatarBooks = avatarBooks.filter((b) => b.avatarStatus === "ready");

  let avatarUrl: string | null = null;
  if (readyBooks.length > 0) {
    avatarUrl = `/api/books/${readyBooks[0].id}/full-assets/portrait.png`;
  } else if (readyAvatarBooks.length > 0) {
    avatarUrl = `/api/books/${readyAvatarBooks[0].id}/assets/portrait.png`;
  }

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

  return jsonResponse({
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
  });
}
