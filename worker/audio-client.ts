// Speech-to-text for the story-prompt mic option (see
// worker/routes/transcribe.ts) — same direct-fetch-no-SDK approach as
// image-client.ts and story-beats.ts.
const MODEL = "whisper-1";

export async function transcribeAudio(params: {
  apiKey: string;
  bytes: ArrayBuffer;
  filename: string;
  contentType: string;
  language?: string;
  timeoutMs?: number;
}): Promise<string> {
  const { apiKey, bytes, filename, contentType, language, timeoutMs = 30000 } = params;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    const form = new FormData();
    form.append("model", MODEL);
    form.append("file", new Blob([bytes], { type: contentType }), filename);
    // Whisper accepts an ISO-639-1 hint to skip language auto-detection —
    // both languages this app supports (fr/en) are valid values as-is.
    if (language) form.append("language", language);

    response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`OpenAI transcription request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI transcription API error ${response.status}: ${errorBody}`);
  }

  const json = (await response.json()) as { text?: string };
  if (typeof json.text !== "string") throw new Error("No text returned from OpenAI transcription API.");
  return json.text;
}
