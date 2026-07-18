// PNG -> JPEG transcoding for the paid PDF export. Workers has no
// Canvas/Image APIs and no native (libvips/ImageMagick) bindings, so this
// uses jSquash's pure-WASM codecs (decode via @jsquash/png, encode via
// @jsquash/jpeg) — the standard approach for image work at the edge.
//
// Why this exists: each generated page/cover is a multi-MB lossless PNG:
// assembling a ~10-page book's worth directly into a PDF pushed the Worker
// past its 128MB memory limit, silently killing the request with no
// response ("stuck" download, no error). Re-encoding to JPEG before
// embedding shrinks each image roughly 5-10x, and doing it one image at a
// time (see pdf.ts) keeps peak memory to about one image's worth instead of
// the whole book's.
//
// Decode and encode are exposed as two separate steps (rather than one
// combined pngToJpeg call) because doing both in a single request
// occasionally exceeded the Workers Free plan's CPU budget — a hard kill
// that bypasses the caller's try/catch, leaving PDF builds stuck retrying
// the same unit forever (see worker/routes/build-pdf-next.ts). Splitting
// the work roughly halves the CPU cost of any one request.
import { init as initPngDecode, decode as decodePng } from "@jsquash/png/decode.js";
import encodeJpeg, { init as initJpegEncode } from "@jsquash/jpeg/encode.js";
// Wrangler's bundler needs a literal relative path to resolve .wasm modules
// (a bare `@jsquash/...` specifier doesn't work for wasm the way it does for
// JS) — see jSquash's own Cloudflare Worker example.
// @jsquash/png ships a .d.ts for this file describing named wasm-bindgen
// exports (a different bundler's convention) — Wrangler's own CompiledWasm
// rule actually gives us the raw WebAssembly.Module to instantiate
// ourselves, which is the shape we actually get and need at runtime.
// @ts-expect-error - see comment above
import PNG_DECODE_WASM from "../node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm";
import JPEG_ENCODE_WASM from "../node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm";

// jSquash's codec glue constructs a DOM `ImageData` instance internally;
// Workers' runtime doesn't provide one. This minimal shape (data/width/height)
// is all the codecs actually read from it.
if (typeof (globalThis as { ImageData?: unknown }).ImageData === "undefined") {
  class WorkersImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
      if (dataOrWidth instanceof Uint8ClampedArray) {
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = height as number;
      } else {
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      }
    }
  }
  (globalThis as { ImageData?: unknown }).ImageData = WorkersImageData;
}

let initPromise: Promise<void> | null = null;
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = Promise.all([initPngDecode(PNG_DECODE_WASM), initJpegEncode(JPEG_ENCODE_WASM)]).then(() => undefined);
  }
  return initPromise;
}

// Packs decoded pixel data as [uint32 width][uint32 height][raw RGBA bytes]
// — a throwaway intermediate format, only ever written to and read back
// from R2's `full-raw/` prefix between the decode and encode units.
export async function decodePngToRaw(pngBytes: ArrayBuffer): Promise<ArrayBuffer> {
  await ensureInit();
  const imageData = await decodePng(pngBytes);
  const packed = new Uint8Array(8 + imageData.data.byteLength);
  new DataView(packed.buffer).setUint32(0, imageData.width, true);
  new DataView(packed.buffer).setUint32(4, imageData.height, true);
  packed.set(imageData.data, 8);
  return packed.buffer;
}

export async function encodeRawToJpeg(rawBytes: ArrayBuffer, quality = 82): Promise<ArrayBuffer> {
  await ensureInit();
  const view = new DataView(rawBytes);
  const width = view.getUint32(0, true);
  const height = view.getUint32(4, true);
  const data = new Uint8ClampedArray(rawBytes, 8);
  // Plain object matching the same minimal {data/width/height} shape the
  // codecs read (see the WorkersImageData note above) — avoids referencing
  // the global `ImageData` constructor, which isn't in scope under the
  // worker's own tsconfig (no DOM lib).
  return encodeJpeg({ data, width, height }, { quality });
}
