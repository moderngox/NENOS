// Web Crypto primitives only — no bcrypt/argon2 dependency, matching this
// project's existing pattern of hand-rolling crypto with platform APIs
// (see worker/routes/stripe-webhook.ts's HMAC verification) rather than
// pulling in a library of uncertain Workers compatibility.
const PBKDF2_ITERATIONS = 100_000;
const SESSION_COOKIE = "nenos_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return `${toHex(salt.buffer)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits) === hashHex;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  await db
    .prepare(`INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`)
    .bind(token, userId, now.toISOString(), expiresAt)
    .run();
  return { token, expiresAt };
}

// Browsers silently refuse to store `Secure` cookies over a plain http://
// connection — `wrangler dev` serves local dev over http://localhost, so
// hardcoding `Secure` there means the cookie is never actually set (breaking
// login, and breaking OAuth's CSRF-state cookie in particular). Only add it
// when actually served over https.
export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

export function sessionCookieHeader(token: string, expiresAt: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Expires=${new Date(expiresAt).toUTCString()}`;
}

export function clearSessionCookieHeader(secure: boolean): string {
  return `${SESSION_COOKIE}=;${secure ? " Secure;" : ""} HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export async function getSessionUser(request: Request, env: Env): Promise<SessionUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT users.id as id, users.email as email, users.name as name, users.is_admin as is_admin, sessions.expires_at as expires_at
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = ?`
  )
    .bind(token)
    .first<{ id: string; email: string; name: string | null; is_admin: number; expires_at: string }>();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  return { id: row.id, email: row.email, name: row.name, isAdmin: Boolean(row.is_admin) };
}

export async function deleteSession(request: Request, env: Env): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(token).run();
}

// Books unlock (readable, generatable) once payment has been authorized —
// generation and eventual capture both happen after this point, so
// 'authorized', 'captured', and 'capture_failed' (capture attempted but
// failed — the book was already generated, so it stays reachable while the
// charge gets sorted out manually) are all treated as unlocked. Only the
// default 'unpaid' is not.
export function isPaymentUnlocked(paymentStatus: string): boolean {
  return paymentStatus === "authorized" || paymentStatus === "captured" || paymentStatus === "capture_failed" || paymentStatus === "paid";
}
