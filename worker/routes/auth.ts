import { createSession, deleteSession, getSessionUser, hashPassword, isSecureRequest, sessionCookieHeader, clearSessionCookieHeader, verifyPassword } from "../auth";
import { createUser, getUserByEmail } from "../users-db";

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
    { user: { id: user.id, email: user.email, name: user.name } },
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
    { user: { id: user.id, email: user.email, name: user.name } },
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
