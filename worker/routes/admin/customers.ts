import { requireAdmin, jsonResponse } from "./guard";
import { isPaymentUnlocked } from "../../auth";
import { PRICES_CENTS } from "../../pricing";

const DEFAULT_LIMIT = 200;

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

interface BookRow {
  format: string | null;
  payment_status: string;
  created_at: string;
}

interface LeadRow {
  id: string;
  email: string;
  created_at: string;
}

// Three distinct kinds of contact end up on this page:
// - "lead": left an email on the pricing page's subscription-interest form
//   (worker/routes/subscription-interest.ts) — no account, no session, just
//   an email in the standalone `subscription_interest` table.
// - "registered": has a real `users` row (signed up or OAuth) but no
//   payment-unlocked book order yet.
// - "customer": has at least one payment-unlocked order.
// This is deliberately computed here rather than stored as a column on
// `users` — it's fully derivable from existing order data, and a stored
// flag would just be another thing to keep in sync as orders change status.
export async function handleGetAdminCustomers(request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("pageSize")) || DEFAULT_LIMIT));

  const [{ results: users }, { results: leads }] = await Promise.all([
    env.DB.prepare(`SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT ?`).bind(limit).all<UserRow>(),
    env.DB.prepare(`SELECT id, email, created_at FROM subscription_interest ORDER BY created_at DESC LIMIT ?`).bind(limit).all<LeadRow>(),
  ]);

  const accountEmails = new Set(users.map((u) => u.email));

  const accountRows = await Promise.all(
    users.map(async (u) => {
      const { results: books } = await env.DB.prepare(`SELECT format, payment_status, created_at FROM books WHERE user_id = ? AND kind = 'book'`)
        .bind(u.id)
        .all<BookRow>();

      const qualifying = books.filter((b) => isPaymentUnlocked(b.payment_status));
      const lifetimeSpendCents = qualifying.reduce((sum, b) => sum + (b.format ? PRICES_CENTS[b.format] ?? 0 : 0), 0);
      const lastOrderAt = books.length ? [...books].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0].created_at : null;

      return {
        id: u.id,
        type: qualifying.length > 0 ? ("customer" as const) : ("registered" as const),
        email: u.email,
        name: u.name,
        createdAt: u.created_at,
        orderCount: qualifying.length,
        lifetimeSpendCents,
        lastOrderAt,
      };
    })
  );

  // A lead who has since created a real account is no longer "just a lead"
  // — their subscription_interest row would otherwise show up as a
  // duplicate, separate entry alongside their real account row.
  const leadRows = leads
    .filter((l) => !accountEmails.has(l.email))
    .map((l) => ({
      id: `lead:${l.id}`,
      type: "lead" as const,
      email: l.email,
      name: null,
      createdAt: l.created_at,
      orderCount: 0,
      lifetimeSpendCents: 0,
      lastOrderAt: null,
    }));

  const customers = [...accountRows, ...leadRows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return jsonResponse({ customers, total: customers.length });
}
