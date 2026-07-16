import { getBook } from "../db";
import { buildBookPdf } from "../pdf";
import { isPaymentUnlocked } from "../auth";

export async function handleGetPdf(bookId: string, env: Env): Promise<Response> {
  const book = await getBook(env.DB, bookId);
  if (!book) return new Response("Not found", { status: 404 });
  if (!isPaymentUnlocked(book.paymentStatus)) return new Response("This book hasn't been purchased yet.", { status: 403 });
  if (!book.story || book.fullStatus !== "ready") {
    return new Response("The book isn't ready yet.", { status: 409 });
  }

  const pageCount = book.story.pages.length;
  const [coverFrontObj, coverBackObj, ...pageObjs] = await Promise.all([
    env.PHOTOS.get(`${bookId}/full/cover-front.png`),
    env.PHOTOS.get(`${bookId}/full/cover-back.png`),
    ...Array.from({ length: pageCount }, (_, i) => env.PHOTOS.get(`${bookId}/full/page-${String(i + 1).padStart(2, "0")}.png`)),
  ]);

  if (!coverFrontObj || !coverBackObj || pageObjs.some((o) => !o)) {
    return new Response("Some book assets are missing.", { status: 500 });
  }

  const [coverFrontBytes, coverBackBytes, ...pageBytes] = await Promise.all([
    coverFrontObj.arrayBuffer(),
    coverBackObj.arrayBuffer(),
    ...pageObjs.map((o) => o!.arrayBuffer()),
  ]);

  const pdfBytes = await buildBookPdf({
    frontCover: book.story.frontCover,
    backCover: book.story.backCover,
    pages: book.story.pages,
    coverFrontBytes,
    coverBackBytes,
    pageBytes,
  });

  const safeName = (book.draft.name || "storybook").replace(/[^a-z0-9\-_]/gi, "_");

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
