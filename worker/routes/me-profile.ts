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

// The "kid profile" shown at the top of the account dashboard — aggregated
// from every book actually committed to (payment authorized or further),
// not abandoned wizard drafts. getBooksForUser already orders by
// created_at DESC, so `qualifying[0]` is the most recent one.
export async function handleGetMyProfile(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);

  const books = await getBooksForUser(env.DB, user.id);
  const qualifying = books.filter((b) => isPaymentUnlocked(b.paymentStatus));

  if (qualifying.length === 0) {
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

  const latest = qualifying[0];
  const readyBooks = qualifying.filter((b) => b.fullStatus === "ready");

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

  const avatarSource: StoredBook | undefined = readyBooks[0];
  const avatarUrl = avatarSource ? `/api/books/${avatarSource.id}/full-assets/cover-front.png` : null;

  return jsonResponse({
    hasBooks: true,
    name: latest.draft.name,
    age: latest.draft.age,
    avatarUrl,
    favoriteUniverses,
    traits: latest.draft.traits,
    skinColor: latest.draft.skinColor,
    hairColor: latest.draft.hairColor,
    eyeColor: latest.draft.eyeColor,
    appearanceDetails: latest.draft.appearanceDetails,
    points: readyBooks.length * POINTS_PER_BOOK,
    booksGenerated: readyBooks.length,
    secondaryCharacters: secondaryCharacters.slice(0, 12),
  });
}
