/** Turns and characters of chat history sent to the model per request. */
export const MODEL_TURNS = 16;
export const MODEL_TURN_CHARS = 2000;

export type TranscriptTurn = { role: "user" | "assistant"; content: string };

/**
 * The slice of a Clinic Assist thread the model should read.
 *
 * The seeded welcome is UI chrome, not conversation, so it is left out (in
 * either language — a thread keeps the wording it was created with). Long
 * messages are trimmed rather than sent whole: the route rejects nothing, but
 * a pasted note should not crowd the clinic context out of the prompt.
 */
export function modelTranscript(
  messages: readonly TranscriptTurn[],
  welcomeTexts: readonly string[],
): TranscriptTurn[] {
  const welcome = new Set(welcomeTexts.map((text) => text.trim()));
  return messages
    .filter(
      (m) =>
        m.content.trim() &&
        !(m.role === "assistant" && welcome.has(m.content.trim())),
    )
    .slice(-MODEL_TURNS)
    .map((m) => ({
      role: m.role,
      content:
        m.content.length > MODEL_TURN_CHARS
          ? `${m.content.slice(0, MODEL_TURN_CHARS)}…`
          : m.content,
    }));
}
