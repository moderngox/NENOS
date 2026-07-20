import { requireAdmin, jsonResponse } from "./guard";
import { PRICES_CENTS } from "../../pricing";

const DEFAULT_PAGE_SIZE = 50;

interface OrderRow {
  id: string;
  name: string;
  format: string | null;
  payment_status: string;
  full_status: string;
  full_units_done: number;
  pdf_status: string;
  pdf_units_done: number;
  pages: string | null;
  front_cover: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

// `statusClause` is picked from a fixed allowlist of literal SQL fragments —
// the raw `status` query-param value itself is never interpolated into the
// query — so this stays injection-safe despite the string concatenation.
function statusClauseFor(status: string | null): string {
  switch (status) {
    case "paid":
      return "AND b.payment_status IN ('authorized','captured','capture_failed')";
    case "unpaid":
      return "AND b.payment_status = 'unpaid'";
    case "error":
      return "AND (b.full_status = 'error' OR b.pdf_status = 'error')";
    case "generating":
      return "AND (b.full_status = 'generating' OR b.pdf_status = 'generating')";
    case "ready":
      return "AND b.full_status = 'ready'";
    default:
      return "";
  }
}

export async function handleGetAdminOrders(request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const url = new URL(request.url);
  const statusClause = statusClauseFor(url.searchParams.get("status"));
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const [{ results }, totalRow] = await Promise.all([
    env.DB.prepare(
      `SELECT b.id, b.name, b.format, b.payment_status, b.full_status, b.full_units_done, b.pdf_status, b.pdf_units_done, b.pages, b.front_cover, b.created_at,
              u.email as user_email, u.name as user_name
       FROM books b LEFT JOIN users u ON u.id = b.user_id
       WHERE b.kind = 'book' ${statusClause}
       ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
    )
      .bind(pageSize, offset)
      .all<OrderRow>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM books b WHERE b.kind = 'book' ${statusClause}`).first<{ count: number }>(),
  ]);

  const orders = results.map((r) => {
    const pageCount = r.pages ? (JSON.parse(r.pages) as unknown[]).length : 10;
    // The `name` column is the child's name, not the book title — the real
    // title only exists once `front_cover` (story beats) has generated.
    const title = r.front_cover ? (JSON.parse(r.front_cover) as { title: string }).title : r.name;
    return {
      bookId: r.id,
      title,
      customerEmail: r.user_email,
      customerName: r.user_name,
      format: r.format,
      priceCents: r.format ? PRICES_CENTS[r.format] ?? null : null,
      paymentStatus: r.payment_status,
      fullStatus: r.full_status,
      fullUnitsDone: r.full_units_done,
      fullUnitsTotal: pageCount + 4,
      pdfStatus: r.pdf_status,
      pdfUnitsDone: r.pdf_units_done,
      pdfUnitsTotal: 2 * (pageCount + 2) + 1,
      createdAt: r.created_at,
    };
  });

  return jsonResponse({ orders, page, pageSize, total: totalRow?.count ?? 0 });
}
