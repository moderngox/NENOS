import { getBook, updatePdfProgress } from "../db";
import { isPaymentUnlocked } from "../auth";
import { decodePngToRaw, encodeRawToJpeg } from "../image-compress";
import { buildBookPdf } from "../pdf";

// Same lock-staleness reasoning as generate-next.ts's STALE_LOCK_MS — a
// crashed unit shouldn't strand the book at "generating" forever. These
// units are far cheaper than an image generation call, so a much shorter
// window is enough.
const STALE_LOCK_MS = 5 * 60 * 1000;

type Unit = { kind: "decode" | "encode"; filename: string } | { kind: "assemble" };

// Mirrors generate-next.ts's image plan (minus the character sheet, which
// isn't part of the book PDF), plus one final "assemble" unit. Each image's
// PNG->JPEG transcode is itself split into a "decode" and "encode" step
// (round-tripping the raw pixels through R2's `full-raw/` prefix) rather
// than one combined unit — doing both in a single request occasionally
// exceeded the Workers Free plan's CPU budget on some images (a hard kill
// the caller's try/catch can't see, leaving the book stuck retrying the
// same unit forever). Splitting roughly halves the CPU cost of any one
// request. The final "assemble" unit (embedding already-small JPEGs into a
// PDF) is cheap by comparison.
function buildPlan(pageCount: number): Unit[] {
  const filenames = ["cover-front.png", ...Array.from({ length: pageCount }, (_, i) => `page-${String(i + 1).padStart(2, "0")}.png`), "cover-back.png"];
  const plan: Unit[] = [];
  for (const filename of filenames) {
    plan.push({ kind: "decode", filename });
    plan.push({ kind: "encode", filename });
  }
  plan.push({ kind: "assemble" });
  return plan;
}

export type BuildPdfNextResult =
  | { ok: true; pdfStatus: string; done: number; total: number }
  | { ok: false; status: number; error: string };

// The single unit of work behind the cron-driven PDF build — pulled out as a
// plain function (matching generate-next.ts's generateNextUnit shape) so
// worker/scheduled.ts can call it once per book per tick.
export async function buildPdfNextUnit(bookId: string, env: Env): Promise<BuildPdfNextResult> {
  const book = await getBook(env.DB, bookId);
  if (!book) return { ok: false, status: 404, error: "Book not found." };
  if (!isPaymentUnlocked(book.paymentStatus)) return { ok: false, status: 403, error: "This book hasn't been purchased yet." };
  if (!book.story || book.fullStatus !== "ready") {
    return { ok: false, status: 409, error: "The book's images aren't ready yet." };
  }

  const plan = buildPlan(book.story.pages.length);
  const total = plan.length;

  if (book.pdfStatus === "ready" || book.pdfUnitsDone >= total) {
    return { ok: true, pdfStatus: "ready", done: total, total };
  }
  if (book.pdfStatus === "generating" && Date.now() - new Date(book.updatedAt).getTime() < STALE_LOCK_MS) {
    return { ok: true, pdfStatus: "generating", done: book.pdfUnitsDone, total };
  }

  const unit = plan[book.pdfUnitsDone];
  await updatePdfProgress(env.DB, bookId, "generating", book.pdfUnitsDone);

  try {
    if (unit.kind === "decode") {
      const object = await env.PHOTOS.get(`${bookId}/full/${unit.filename}`);
      if (!object) throw new Error(`Missing source image: ${unit.filename}`);
      const pngBytes = await object.arrayBuffer();
      const rawBytes = await decodePngToRaw(pngBytes);
      await env.PHOTOS.put(`${bookId}/full-raw/${unit.filename}.raw`, rawBytes);
    } else if (unit.kind === "encode") {
      const object = await env.PHOTOS.get(`${bookId}/full-raw/${unit.filename}.raw`);
      if (!object) throw new Error(`Missing decoded pixels: ${unit.filename}`);
      const rawBytes = await object.arrayBuffer();
      const jpegBytes = await encodeRawToJpeg(rawBytes);
      const jpegFilename = unit.filename.replace(/\.png$/, ".jpg");
      await env.PHOTOS.put(`${bookId}/full-jpeg/${jpegFilename}`, jpegBytes, { httpMetadata: { contentType: "image/jpeg" } });
      await env.PHOTOS.delete(`${bookId}/full-raw/${unit.filename}.raw`);
    } else {
      async function getCompressedBytes(filename: string): Promise<ArrayBuffer> {
        const object = await env.PHOTOS.get(`${bookId}/full-jpeg/${filename}`);
        if (!object) throw new Error(`Missing compressed image: ${filename}`);
        return object.arrayBuffer();
      }

      const pdfBytes = await buildBookPdf({
        frontCover: book.story.frontCover,
        backCover: book.story.backCover,
        pages: book.story.pages,
        getCoverFrontBytes: () => getCompressedBytes("cover-front.jpg"),
        getCoverBackBytes: () => getCompressedBytes("cover-back.jpg"),
        getPageBytes: (i) => getCompressedBytes(`page-${String(i + 1).padStart(2, "0")}.jpg`),
      });
      await env.PHOTOS.put(`${bookId}/full/book.pdf`, pdfBytes, { httpMetadata: { contentType: "application/pdf" } });
    }

    const done = book.pdfUnitsDone + 1;
    const status = done >= total ? "ready" : "none";
    await updatePdfProgress(env.DB, bookId, status, done);
    return { ok: true, pdfStatus: status, done, total };
  } catch (err) {
    await updatePdfProgress(env.DB, bookId, "error", book.pdfUnitsDone);
    return { ok: false, status: 502, error: `PDF build failed: ${(err as Error).message}` };
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Lets a client that already has the reader/account page open (like
// generate-next.ts's client-side polling for image generation) nudge PDF
// assembly forward instead of waiting solely on the once-a-minute cron.
export async function handleBuildPdfNext(bookId: string, env: Env): Promise<Response> {
  const result = await buildPdfNextUnit(bookId, env);
  if (!result.ok) return jsonResponse({ error: result.error }, result.status);
  if (result.pdfStatus === "generating") return jsonResponse(result, 202);
  return jsonResponse(result);
}
