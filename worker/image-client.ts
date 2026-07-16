// Ported from poc-imagegen/openai-client.mjs — same gpt-image-2 edits/
// generations logic and timeout-via-AbortController fix, adapted to take
// image bytes directly (R2 objects, not file paths — no `node:fs` in Workers).
const MODEL = "gpt-image-2";

export interface ImageInput {
  bytes: ArrayBuffer;
  filename: string;
  contentType: string;
}

export async function generateImage(params: {
  apiKey: string;
  prompt: string;
  images?: ImageInput[];
  size?: string;
  quality?: string;
  timeoutMs?: number;
}): Promise<ArrayBuffer> {
  const { apiKey, prompt, images = [], size = "1024x1024", quality = "high", timeoutMs = 180000 } = params;
  const useEdits = images.length > 0;
  const url = useEdits ? "https://api.openai.com/v1/images/edits" : "https://api.openai.com/v1/images/generations";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    if (useEdits) {
      const form = new FormData();
      form.append("model", MODEL);
      form.append("prompt", prompt);
      form.append("size", size);
      form.append("quality", quality);
      for (const image of images) {
        form.append("image[]", new Blob([image.bytes], { type: image.contentType }), image.filename);
      }
      response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      });
    } else {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, prompt, size, quality }),
        signal: controller.signal,
      });
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `OpenAI images API request timed out after ${timeoutMs}ms (no response — likely a stalled connection, not a slow generation).`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI images API error ${response.status}: ${errorBody}`);
  }

  const json = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned from OpenAI images API.");

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
