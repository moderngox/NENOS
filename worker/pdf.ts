import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import baloo2Bytes from "./fonts/Baloo2[wght].ttf";
import poppinsMediumBytes from "./fonts/Poppins-Medium.ttf";
import poppinsSemiBoldBytes from "./fonts/Poppins-SemiBold.ttf";
import { pngToJpeg } from "./image-compress";

export interface BookPdfInput {
  frontCover: { title: string; subtitle: string };
  backCover: { synopsis: string };
  pages: { text: string }[];
  // Fetched one at a time (not pre-loaded) so only one source PNG is ever
  // live in memory at once — see image-compress.ts for why.
  getCoverFrontBytes: () => Promise<ArrayBuffer>;
  getCoverBackBytes: () => Promise<ArrayBuffer>;
  getPageBytes: (pageIndex: number) => Promise<ArrayBuffer>;
}

// Matches the source images' 1024x1536 (2:3) aspect ratio exactly.
const PAGE_WIDTH = 512;
const PAGE_HEIGHT = 768;
const MARGIN = 30;

// The image prompts reserve a "safe zone" for text, but its exact location
// in a given generated image isn't guaranteed (same reasoning the web reader
// uses to put narration in a panel rather than overlaid) — so text here is
// always anchored to a fixed band instead of guessing where in the art it's
// safe to sit.
function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function drawFullBleedImage(pdfDoc: PDFDocument, page: PDFPage, pngBytes: ArrayBuffer) {
  const jpegBytes = await pngToJpeg(pngBytes);
  const image = await pdfDoc.embedJpg(jpegBytes);
  page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
}

function drawBottomBand(page: PDFPage, heightRatio: number): number {
  const bandHeight = PAGE_HEIGHT * heightRatio;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: bandHeight,
    color: rgb(0.99, 0.98, 0.95),
    opacity: 0.94,
  });
  return bandHeight;
}

function drawWrappedText(
  page: PDFPage,
  lines: string[],
  opts: { font: PDFFont; size: number; startY: number; color: ReturnType<typeof rgb>; lineHeight?: number }
) {
  const lineHeight = opts.lineHeight ?? opts.size * 1.45;
  let y = opts.startY;
  for (const line of lines) {
    page.drawText(line, { x: MARGIN, y, size: opts.size, font: opts.font, color: opts.color });
    y -= lineHeight;
  }
}

export async function buildBookPdf(input: BookPdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const titleFont = await pdfDoc.embedFont(baloo2Bytes);
  const bodyFont = await pdfDoc.embedFont(poppinsMediumBytes);
  const boldFont = await pdfDoc.embedFont(poppinsSemiBoldBytes);

  const ink = rgb(0.13, 0.13, 0.16);
  const white = rgb(1, 1, 1);

  // Front cover
  {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawFullBleedImage(pdfDoc, page, await input.getCoverFrontBytes());

    const titleSize = 28;
    const titleLines = wrapText(titleFont, input.frontCover.title, titleSize, PAGE_WIDTH - MARGIN * 2);
    const subtitleLines = input.frontCover.subtitle
      ? wrapText(boldFont, input.frontCover.subtitle, 13, PAGE_WIDTH - MARGIN * 2)
      : [];
    const scrimHeight = 50 + titleLines.length * titleSize * 1.15 + subtitleLines.length * 13 * 1.3 + 20;

    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - scrimHeight,
      width: PAGE_WIDTH,
      height: scrimHeight,
      color: rgb(0, 0, 0),
      opacity: 0.42,
    });

    let ty = PAGE_HEIGHT - 46;
    drawWrappedText(page, titleLines, { font: titleFont, size: titleSize, startY: ty, color: white, lineHeight: titleSize * 1.15 });
    ty -= titleLines.length * titleSize * 1.15 + 8;
    if (subtitleLines.length) {
      drawWrappedText(page, subtitleLines, { font: boldFont, size: 13, startY: ty, color: white, lineHeight: 13 * 1.3 });
    }
  }

  // Interior pages
  for (let i = 0; i < input.pages.length; i++) {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawFullBleedImage(pdfDoc, page, await input.getPageBytes(i));

    const textSize = 12.5;
    const lineHeight = textSize * 1.5;
    const lines = wrapText(bodyFont, input.pages[i].text, textSize, PAGE_WIDTH - MARGIN * 2);
    const bandHeight = drawBottomBand(page, 0.16 + Math.max(0, lines.length - 2) * 0.035);

    const blockHeight = lines.length * lineHeight;
    const startY = (bandHeight - blockHeight) / 2 + blockHeight - textSize;
    drawWrappedText(page, lines, { font: bodyFont, size: textSize, startY, color: ink, lineHeight });

    page.drawText(String(i + 1), {
      x: PAGE_WIDTH - MARGIN - 10,
      y: bandHeight - 20,
      size: 11,
      font: boldFont,
      color: rgb(0.55, 0.55, 0.6),
    });
  }

  // Back cover
  {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    await drawFullBleedImage(pdfDoc, page, await input.getCoverBackBytes());

    const textSize = 12.5;
    const lineHeight = textSize * 1.5;
    const lines = wrapText(bodyFont, input.backCover.synopsis, textSize, PAGE_WIDTH - MARGIN * 2);
    const bandHeight = drawBottomBand(page, 0.32);
    const blockHeight = lines.length * lineHeight;
    const startY = (bandHeight - blockHeight) / 2 + blockHeight - textSize;
    drawWrappedText(page, lines, { font: bodyFont, size: textSize, startY, color: ink, lineHeight });
  }

  return pdfDoc.save();
}
