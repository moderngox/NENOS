import { getSessionUser, type SessionUser } from "../../auth";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Every admin route starts with this — reuses the same session cookie a
// customer already has from logging in normally (no separate admin login).
// Real enforcement lives here, server-side, on every request; any
// client-side admin-link visibility check is UX only.
export async function requireAdmin(request: Request, env: Env): Promise<SessionUser | Response> {
  const user = await getSessionUser(request, env);
  if (!user || !user.isAdmin) return jsonResponse({ error: "Not authorized." }, 403);
  return user;
}

export { jsonResponse };
