import { getBook } from "../../db";
import { getUserById } from "../../users-db";
import { PRICES_CENTS } from "../../pricing";
import { requireAdmin, jsonResponse } from "./guard";
import { fetchCardInfo } from "../order-detail";

export async function handleGetAdminOrderDetail(bookId: string, request: Request, env: Env): Promise<Response> {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const book = await getBook(env.DB, bookId);
  if (!book) return jsonResponse({ error: "Order not found." }, 404);

  const customer = book.userId ? await getUserById(env.DB, book.userId) : null;

  const { card, stripeStatus } = book.stripePaymentIntentId
    ? await fetchCardInfo(env, book.stripePaymentIntentId)
    : { card: null, stripeStatus: null };

  const pageCount = book.story?.pages.length ?? 10;

  return jsonResponse({
    bookId: book.id,
    title: book.story?.frontCover.title ?? book.draft.name,
    childName: book.draft.name,
    customerEmail: customer?.email ?? null,
    customerName: customer?.name ?? null,
    coverUrl:
      book.fullStatus === "ready"
        ? `/api/books/${book.id}/full-assets/cover-front.png`
        : book.previewAssets
          ? `/api/books/${book.id}/assets/${book.previewAssets.coverFront}`
          : null,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    format: book.format,
    priceCents: book.format ? PRICES_CENTS[book.format] ?? null : null,
    paymentStatus: book.paymentStatus,
    stripeStatus,
    stripePaymentIntentId: book.stripePaymentIntentId,
    card,
    previewStatus: book.previewStatus,
    avatarStatus: book.avatarStatus,
    fullStatus: book.fullStatus,
    fullUnitsDone: book.fullUnitsDone,
    fullUnitsTotal: pageCount + 4,
    pdfStatus: book.pdfStatus,
    pdfUnitsDone: book.pdfUnitsDone,
    pdfUnitsTotal: 2 * (pageCount + 2) + 1,
  });
}
