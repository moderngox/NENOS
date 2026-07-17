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

  // Fetched one image at a time (inside pdf.ts, as each page is drawn)
  // rather than all up front — holding a whole book's worth of full-quality
  // PNGs in memory simultaneously was enough to exceed the Worker's memory
  // limit and silently kill the request (see image-compress.ts).
  async function getFullAssetBytes(filename: string): Promise<ArrayBuffer> {
    const object = await env.PHOTOS.get(`${bookId}/full/${filename}`);
    if (!object) throw new Error(`Missing book asset: ${filename}`);
    return object.arrayBuffer();
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await buildBookPdf({
      frontCover: book.story.frontCover,
      backCover: book.story.backCover,
      pages: book.story.pages,
      getCoverFrontBytes: () => getFullAssetBytes("cover-front.png"),
      getCoverBackBytes: () => getFullAssetBytes("cover-back.png"),
      getPageBytes: (i) => getFullAssetBytes(`page-${String(i + 1).padStart(2, "0")}.png`),
    });
  } catch (err) {
    return new Response(`Failed to build PDF: ${(err as Error).message}`, { status: 500 });
  }

  const safeName = (book.draft.name || "storybook").replace(/[^a-z0-9\-_]/gi, "_");

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
