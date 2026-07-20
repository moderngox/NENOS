import { requireAdmin, jsonResponse } from "./guard";
import { STALE_LOCK_MS as FULL_STALE_LOCK_MS } from "../generate-next";
import { STALE_LOCK_MS as PDF_STALE_LOCK_MS } from "../build-pdf-next";

interface HealthRow {
  id: string;
  name: string;
  kind: string;
  full_status: string;
  full_units_done: number;
  pdf_status: string;
  pdf_units_done: number;
  pages: string | null;
  front_cover: string | null;
  updated_at: string;
}

export async function handleGetAdminGenerationHealth(request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const { results } = await env.DB.prepare(
    `SELECT id, name, kind, full_status, full_units_done, pdf_status, pdf_units_done, pages, front_cover, updated_at
     FROM books
     WHERE full_status IN ('generating', 'error') OR pdf_status IN ('generating', 'error')
     ORDER BY updated_at ASC`
  ).all<HealthRow>();

  const now = Date.now();
  const books = results.map((r) => {
    const pageCount = r.pages ? (JSON.parse(r.pages) as unknown[]).length : 10;
    const title = r.front_cover ? (JSON.parse(r.front_cover) as { title: string }).title : r.name;
    const staleMs = now - new Date(r.updated_at).getTime();
    const fullStuck = r.full_status === "generating" && staleMs > FULL_STALE_LOCK_MS;
    const pdfStuck = r.pdf_status === "generating" && staleMs > PDF_STALE_LOCK_MS;
    return {
      bookId: r.id,
      title,
      kind: r.kind,
      fullStatus: r.full_status,
      fullUnitsDone: r.full_units_done,
      fullUnitsTotal: pageCount + 4,
      pdfStatus: r.pdf_status,
      pdfUnitsDone: r.pdf_units_done,
      pdfUnitsTotal: 2 * (pageCount + 2) + 1,
      updatedAt: r.updated_at,
      stuck: fullStuck || pdfStuck || r.full_status === "error" || r.pdf_status === "error",
    };
  });

  return jsonResponse({ books });
}
