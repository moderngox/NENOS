import { transcribeAudio } from "../audio-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Generous headroom over what a real recording needs — the client caps
// recording length itself (see StepStoryPrompt.tsx's RECORDING_MAX_MS), this
// is just a defensive backstop against a malformed or spoofed upload.
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

// No bookId — this runs before a book draft necessarily exists yet (the
// story-prompt step is filled in before submission), so it's a standalone
// speech-to-text utility, not tied to any particular book record.
export async function handleTranscribe(request: Request, env: Env): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "Expected multipart/form-data body." }, 400);
  }

  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return jsonResponse({ error: 'Missing "audio" file field.' }, 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return jsonResponse({ error: "Audio file too large." }, 400);
  }

  const language = form.get("language");

  try {
    const text = await transcribeAudio({
      apiKey: env.OPENAI_API_KEY,
      bytes: await audio.arrayBuffer(),
      filename: audio.name || "recording.webm",
      contentType: audio.type || "audio/webm",
      language: typeof language === "string" && language ? language : undefined,
    });
    return jsonResponse({ text });
  } catch (err) {
    return jsonResponse({ error: `Transcription failed: ${(err as Error).message}` }, 502);
  }
}
