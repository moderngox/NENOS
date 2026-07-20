import { requireAdmin, jsonResponse } from "./guard";
import { isPaymentUnlocked } from "../../auth";
import { PRICES_CENTS } from "../../pricing";

const DEFAULT_PAGE_SIZE = 50;

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

// One extra query per customer (books for that customer) rather than a
// single GROUP BY — lifetime spend depends on each book's `format`, which
// PRICES_CENTS only maps on the JS side, and pageSize is capped at 200, so
// this stays cheap for how few customers this app actually has.
export async function handleGetAdminCustomers(request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const [{ results: users }, totalRow] = await Promise.all([
    env.DB.prepare(`SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(pageSize, offset)
      .all<UserRow>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first<{ count: number }>(),
  ]);

  const customers = await Promise.all(
    users.map(async (u) => {
      const { results: books } = await env.DB.prepare(`SELECT format, payment_status, created_at FROM books WHERE user_id = ? AND kind = 'book'`)
        .bind(u.id)
        .all<BookRow>();

      const qualifying = books.filter((b) => isPaymentUnlocked(b.payment_status));
      const lifetimeSpendCents = qualifying.reduce((sum, b) => sum + (b.format ? PRICES_CENTS[b.format] ?? 0 : 0), 0);
      const lastOrderAt = books.length ? [...books].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0].created_at : null;

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.created_at,
        orderCount: qualifying.length,
        lifetimeSpendCents,
        lastOrderAt,
      };
    })
  );

  return jsonResponse({ customers, page, pageSize, total: totalRow?.count ?? 0 });
}
