import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import {
  parseTranscriptionResponse,
  transcriptionErrorMessage,
} from "@/services/ai_transcribe/parseTranscription";

/**
 * Speech-to-text for dictating into an admin chat composer.
 *
 * Deliberately Groq-only rather than going through the ai_chat provider
 * chain: transcription is a different API shape (multipart audio in, not a
 * chat-completions JSON body) and Groq is the only one of the four chained
 * providers whose OpenAI-compatible surface includes it. A missing
 * GROQ_API_KEY simply disables voice input rather than falling back —
 * there's nothing else in the chain to fall back to.
 */
const DEFAULT_MODEL = "whisper-large-v3-turbo";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // Groq's own limit on this endpoint.

export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice input needs GROQ_API_KEY in .env.local" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Recording is too long" }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name || "recording.webm");
  upstream.append("model", process.env.GROQ_TRANSCRIBE_MODEL?.trim() || DEFAULT_MODEL);
  upstream.append("response_format", "json");

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription request failed" },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json(
      { error: transcriptionErrorMessage(response.status, detail) },
      { status: 502 },
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  const text = parseTranscriptionResponse(payload);
  return NextResponse.json({ text });
}
