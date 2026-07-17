import { getBook } from "../db";
import { isPaymentUnlocked } from "../auth";

// The PDF itself is built ahead of time by the cron-driven pipeline (see
// build-pdf-next.ts) and stored in R2 — this route just streams that
// already-finished file, exactly like the static example book under
// public/exemples/. Building a whole book's PDF inside a single request
// used to happen here, but that's real synchronous CPU work (image
// decode/encode, pdf-lib assembly) that doesn't fit the Workers Free plan's
// 10ms-per-request budget — see build-pdf-next.ts for where that work
// actually happens now, spread across many small cron-tick-sized units.
export async function handleGetPdf(bookId: string, env: Env): Promise<Response> {
  const book = await getBook(env.DB, bookId);
  if (!book) return new Response("Not found", { status: 404 });
  if (!isPaymentUnlocked(book.paymentStatus)) return new Response("This book hasn't been purchased yet.", { status: 403 });
  if (book.pdfStatus !== "ready") {
    return new Response("The PDF is still being prepared — it finishes shortly after the book itself. Try again in a few minutes.", {
      status: 409,
    });
  }

  const object = await env.PHOTOS.get(`${bookId}/full/book.pdf`);
  if (!object) return new Response("PDF file is missing.", { status: 500 });

  const safeName = (book.draft.name || "storybook").replace(/[^a-z0-9\-_]/gi, "_");

  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
