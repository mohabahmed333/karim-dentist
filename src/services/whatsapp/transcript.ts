/**
 * Voice-note transcripts from Kapso.
 *
 * Kapso transcribes inbound audio and reports it two ways: a structured
 * `kapso.transcript` object, and a "Transcript:" tail appended to
 * `kapso.content`. The structured field is preferred — the content string is
 * display text whose format is not a contract.
 *
 * Note `kapso.processing_status`, which is `pending` on arrival: a voice note
 * can reach the webhook before its transcript exists. That is why an absent
 * transcript has to be an ordinary, expected case rather than an error.
 */

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** The transcript text Kapso attached, if it has produced one yet. */
export function extractKapsoTranscript(kapso: unknown): string {
  const record = asRecord(kapso);
  if (!record) return "";

  const transcript = record.transcript;
  if (typeof transcript === "string") return transcript.trim();

  const nested = asRecord(transcript);
  const text = nested?.text;
  return typeof text === "string" ? text.trim() : "";
}

/**
 * Whisper marks non-speech audio with bracketed labels — `[outro jingle]`,
 * `[music]`, `[inaudible]`, `(silence)`. Production already contains one.
 *
 * A transcript made only of those carries no patient speech, so treating it as
 * a message would have the assistant answer something nobody said. Better to
 * fall back to the same handling as any other unreadable media.
 */
export function isSpeechTranscript(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Remove every bracketed or parenthesised marker and see what is left.
  const withoutMarkers = trimmed
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Punctuation alone is not speech either.
  return /[\p{L}\p{N}]/u.test(withoutMarkers);
}
