function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lightweight lead capture for the subscription plan on the pricing page —
// there's no real recurring-billing product yet (Stripe Subscriptions,
// weekly generation quota, monthly hardcover fulfillment all still need to
// be designed), so this just records interest to notify at launch.
export async function handleSubscriptionInterest(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return jsonResponse({ error: "A valid email is required." }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`INSERT INTO subscription_interest (id, email, created_at) VALUES (?, ?, ?)`).bind(id, email, now).run();
  } catch {
    // UNIQUE(email) conflict — already registered, treat as success rather
    // than surfacing a confusing error for someone re-submitting the form.
  }

  return jsonResponse({ ok: true });
}
