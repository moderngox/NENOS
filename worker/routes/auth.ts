import { createSession, deleteSession, getSessionUser, hashPassword, isSecureRequest, sessionCookieHeader, clearSessionCookieHeader, verifyPassword } from "../auth";
import { createUser, getUserByEmail } from "../users-db";
import { getBooksForUser } from "../db";

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function handleSignup(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; name?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const name = body?.name?.trim() || null;

  if (!email || !isValidEmail(email)) return jsonResponse({ error: "A valid email is required." }, 400);
  if (!password || password.length < 8) return jsonResponse({ error: "Password must be at least 8 characters." }, 400);

  const existing = await getUserByEmail(env.DB, email);
  if (existing) return jsonResponse({ error: "An account with this email already exists." }, 409);

  const passwordHash = await hashPassword(password);
  const user = await createUser(env.DB, { email, name, passwordHash });
  const { token, expiresAt } = await createSession(env.DB, user.id);

  return jsonResponse(
    { user: { id: user.id, email: user.email, name: user.name, isAdmin: Boolean(user.is_admin) } },
    200,
    { "Set-Cookie": sessionCookieHeader(token, expiresAt, isSecureRequest(request)) }
  );
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) return jsonResponse({ error: "Email and password are required." }, 400);

  const user = await getUserByEmail(env.DB, email);
  if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
    return jsonResponse({ error: "Incorrect email or password." }, 401);
  }

  const { token, expiresAt } = await createSession(env.DB, user.id);
  return jsonResponse(
    { user: { id: user.id, email: user.email, name: user.name, isAdmin: Boolean(user.is_admin) } },
    200,
    { "Set-Cookie": sessionCookieHeader(token, expiresAt, isSecureRequest(request)) }
  );
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  await deleteSession(request, env);
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearSessionCookieHeader(isSecureRequest(request)) });
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);
  return jsonResponse({ user });
}

// Full, unconditional account wipe — every book/avatar this user owns (R2
// assets + D1 row), every session (all devices, not just this one), their
// OAuth links, and finally the user row itself. `sessions`/`oauth_identities`
// have a FOREIGN KEY on users(id) with no ON DELETE clause, so those must go
// before the users row or the last DELETE fails; `books.user_id` has no such
// constraint, so its order doesn't matter, but it's done first for clarity.
// The typed "DELETE" confirmation is primarily a frontend safeguard — this
// check is the server-side backstop against a stray/accidental call.
export async function handleDeleteAccount(request: Request, env: Env): Promise<Response> {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not signed in." }, 401);

  const body = (await request.json().catch(() => null)) as { confirmation?: string } | null;
  if (body?.confirmation?.trim().toUpperCase() !== "DELETE") {
    return jsonResponse({ error: 'Type "DELETE" to confirm.' }, 400);
  }

  const books = await getBooksForUser(env.DB, user.id);
  for (const book of books) {
    const { objects } = await env.PHOTOS.list({ prefix: `${book.id}/` });
    if (objects.length > 0) {
      await env.PHOTOS.delete(objects.map((o) => o.key));
    }
  }

  await env.DB.prepare(`DELETE FROM books WHERE user_id = ?`).bind(user.id).run();
  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(user.id).run();
  await env.DB.prepare(`DELETE FROM oauth_identities WHERE user_id = ?`).bind(user.id).run();
  await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(user.id).run();

  return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearSessionCookieHeader(isSecureRequest(request)) });
}
