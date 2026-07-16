import { createSession, sessionCookieHeader } from "../auth";
import { createUser, findUserByOAuthIdentity, getUserByEmail, linkOAuthIdentity } from "../users-db";

type Provider = "google" | "facebook";

const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_RETURN_TO_COOKIE = "oauth_return_to";
const DEFAULT_RETURN_TO = "/paiement";

function shortLivedCookie(name: string, value: string): string {
  // 10 minutes is plenty to complete a provider's login dialog; HttpOnly +
  // SameSite=Lax since the callback is a top-level GET redirect from the
  // provider's domain (Lax still sends the cookie on that navigation).
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`;
}

function clearShortLivedCookie(name: string): string {
  return `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function redirect(location: string, cookiesToSet: string[] = []): Response {
  const headers = new Headers({ Location: location });
  for (const cookie of cookiesToSet) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

interface ProviderProfile {
  providerUserId: string;
  email: string | null;
  name: string | null;
}

function providerConfigured(provider: Provider, env: Env): boolean {
  return provider === "google" ? Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) : Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
}

function authorizeUrl(provider: Provider, env: Env, redirectUri: string, state: string): string {
  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    state,
    scope: "email",
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

async function exchangeCodeForProfile(provider: Provider, env: Env, code: string, redirectUri: string): Promise<ProviderProfile> {
  if (provider === "google") {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenBody = (await tokenResponse.json().catch(() => null)) as { access_token?: string; error?: string } | null;
    if (!tokenResponse.ok || !tokenBody?.access_token) {
      throw new Error(`Google token exchange failed: ${tokenBody?.error ?? tokenResponse.status}`);
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });
    const profile = (await profileResponse.json().catch(() => null)) as { sub?: string; email?: string; name?: string } | null;
    if (!profileResponse.ok || !profile?.sub) throw new Error("Failed to fetch Google profile.");

    return { providerUserId: profile.sub, email: profile.email ?? null, name: profile.name ?? null };
  }

  const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", env.FACEBOOK_APP_ID);
  tokenUrl.searchParams.set("client_secret", env.FACEBOOK_APP_SECRET);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);
  const tokenResponse = await fetch(tokenUrl.toString());
  const tokenBody = (await tokenResponse.json().catch(() => null)) as { access_token?: string; error?: { message?: string } } | null;
  if (!tokenResponse.ok || !tokenBody?.access_token) {
    throw new Error(`Facebook token exchange failed: ${tokenBody?.error?.message ?? tokenResponse.status}`);
  }

  const profileUrl = new URL("https://graph.facebook.com/me");
  profileUrl.searchParams.set("fields", "id,name,email");
  profileUrl.searchParams.set("access_token", tokenBody.access_token);
  const profileResponse = await fetch(profileUrl.toString());
  const profile = (await profileResponse.json().catch(() => null)) as { id?: string; email?: string; name?: string } | null;
  if (!profileResponse.ok || !profile?.id) throw new Error("Failed to fetch Facebook profile.");

  return { providerUserId: profile.id, email: profile.email ?? null, name: profile.name ?? null };
}

export async function handleOAuthStart(provider: Provider, request: Request, env: Env): Promise<Response> {
  if (!providerConfigured(provider, env)) {
    return new Response(
      `Sign in with ${provider === "google" ? "Google" : "Facebook"} isn't configured yet on this deployment.`,
      { status: 501 }
    );
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || DEFAULT_RETURN_TO;
  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/api/auth/${provider}/callback`;

  const headers = new Headers({ Location: authorizeUrl(provider, env, redirectUri, state) });
  headers.append("Set-Cookie", shortLivedCookie(OAUTH_STATE_COOKIE, state));
  headers.append("Set-Cookie", shortLivedCookie(OAUTH_RETURN_TO_COOKIE, returnTo));
  return new Response(null, { status: 302, headers });
}

export async function handleOAuthCallback(provider: Provider, request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(request, OAUTH_STATE_COOKIE);
  const returnTo = readCookie(request, OAUTH_RETURN_TO_COOKIE) || DEFAULT_RETURN_TO;

  const clearCookies = [clearShortLivedCookie(OAUTH_STATE_COOKIE), clearShortLivedCookie(OAUTH_RETURN_TO_COOKIE)];

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect(`${returnTo}?authError=invalid_state`, clearCookies);
  }

  try {
    const redirectUri = `${url.origin}/api/auth/${provider}/callback`;
    const profile = await exchangeCodeForProfile(provider, env, code, redirectUri);

    if (!profile.email) {
      return redirect(`${returnTo}?authError=no_email`, clearCookies);
    }

    let user = await findUserByOAuthIdentity(env.DB, provider, profile.providerUserId);
    if (!user) {
      user = await getUserByEmail(env.DB, profile.email);
      if (user) {
        await linkOAuthIdentity(env.DB, user.id, provider, profile.providerUserId);
      } else {
        user = await createUser(env.DB, { email: profile.email, name: profile.name, passwordHash: null });
        await linkOAuthIdentity(env.DB, user.id, provider, profile.providerUserId);
      }
    }

    const { token, expiresAt } = await createSession(env.DB, user.id);
    return redirect(returnTo, [sessionCookieHeader(token, expiresAt), ...clearCookies]);
  } catch (err) {
    return redirect(`${returnTo}?authError=${encodeURIComponent((err as Error).message)}`, clearCookies);
  }
}
