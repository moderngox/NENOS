import { requireAdmin, jsonResponse } from "./guard";
import { STALE_LOCK_MS as FULL_STALE_LOCK_MS } from "../generate-next";
import { STALE_LOCK_MS as PDF_STALE_LOCK_MS } from "../build-pdf-next";

// "Stuck" counts are computed in JS (fetch the small `generating` set, then
// compare timestamps) rather than in SQL — matches how generate-next.ts and
// build-pdf-next.ts themselves already determine staleness, and this app's
// whole `books` table is tiny (low hundreds of rows at most), so there's no
// real cost to it.
export async function handleGetAdminOverview(request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const [ordersToday, inGeneration, generatingFull, generatingPdf, erroredFull, erroredPdf] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) as count FROM books WHERE kind = 'book' AND created_at LIKE date('now') || '%'`).first<{
      count: number;
    }>(),
    env.DB.prepare(
      `SELECT COUNT(*) as count FROM books WHERE payment_status IN ('authorized','captured','capture_failed') AND full_status != 'ready'`
    ).first<{ count: number }>(),
    env.DB.prepare(`SELECT updated_at FROM books WHERE full_status = 'generating'`).all<{ updated_at: string }>(),
    env.DB.prepare(`SELECT updated_at FROM books WHERE pdf_status = 'generating'`).all<{ updated_at: string }>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM books WHERE full_status = 'error'`).first<{ count: number }>(),
    env.DB.prepare(`SELECT COUNT(*) as count FROM books WHERE pdf_status = 'error'`).first<{ count: number }>(),
  ]);

  const now = Date.now();
  const stuckFull = (generatingFull.results ?? []).filter((r) => now - new Date(r.updated_at).getTime() > FULL_STALE_LOCK_MS).length;
  const stuckPdf = (generatingPdf.results ?? []).filter((r) => now - new Date(r.updated_at).getTime() > PDF_STALE_LOCK_MS).length;

  return jsonResponse({
    ordersToday: ordersToday?.count ?? 0,
    inGeneration: inGeneration?.count ?? 0,
    stuck: stuckFull + stuckPdf,
    errored: (erroredFull?.count ?? 0) + (erroredPdf?.count ?? 0),
  });
}
