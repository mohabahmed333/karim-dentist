/** Turns and characters of chat history sent to the model per request. */
export const MODEL_TURNS = 16;
export const MODEL_TURN_CHARS = 2000;

export type TranscriptTurn = {
  role: "user" | "assistant";
  content: string;
  /** Uploaded image URLs for this turn — folded into content, not sent as a separate field. */
  imageUrls?: string[];
};

/**
 * The slice of a Clinic Assist thread the model should read.
 *
 * The seeded welcome is UI chrome, not conversation, so it is left out (in
 * either language — a thread keeps the wording it was created with). Long
 * messages are trimmed rather than sent whole: the route rejects nothing, but
 * a pasted note should not crowd the clinic context out of the prompt.
 *
 * Uploaded image URLs are appended after trimming, in a form the model can
 * quote back verbatim as `file_url` on `imaging.attach`/`cms.set_media` —
 * without this an attached image could be shown in the bubble but never
 * reach the model at all, so those actions could only ever invent a URL.
 */
export function modelTranscript(
  messages: readonly TranscriptTurn[],
  welcomeTexts: readonly string[],
): { role: "user" | "assistant"; content: string }[] {
  const welcome = new Set(welcomeTexts.map((text) => text.trim()));
  return messages
    .filter(
      (m) =>
        m.content.trim() &&
        !(m.role === "assistant" && welcome.has(m.content.trim())),
    )
    .slice(-MODEL_TURNS)
    .map((m) => {
      const text =
        m.content.length > MODEL_TURN_CHARS
          ? `${m.content.slice(0, MODEL_TURN_CHARS)}…`
          : m.content;
      if (!m.imageUrls?.length) return { role: m.role, content: text };
      return {
        role: m.role,
        content: `${text}\n\n[Attached image URLs — use these exact values as file_url; never invent one]\n${m.imageUrls.join("\n")}`,
      };
    });
}
