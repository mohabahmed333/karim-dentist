const DETAIL_LIMIT = 200;

/** Groq's transcription response is `{ text: string, ... }` — never trust the shape blindly. */
export function parseTranscriptionResponse(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const text = (payload as { text?: unknown }).text;
  return typeof text === "string" ? text.trim() : "";
}

export function transcriptionErrorMessage(status: number, detail: string): string {
  return `Transcription failed (${status}): ${detail.slice(0, DETAIL_LIMIT)}`;
}
