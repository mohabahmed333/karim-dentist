import type { PromptTurn } from "./buildAutoReplyPrompt";

export type HistoryRow = {
  id: string;
  body: string | null;
  direction: string;
  status: string;
  sender_kind: string | null;
  wa_timestamp: string;
};

/** Outbound states a patient has actually received. */
const DELIVERED_OUTBOUND = new Set(["sent", "delivered", "read"]);

/**
 * Turn stored messages into the conversation the model is shown.
 *
 * The rule is "only what the patient actually saw". A draft was never received,
 * and a failed send never arrived — replaying either as something the assistant
 * said gives the model a false transcript to build its next question on.
 *
 * Staff replies are labelled, because the model must be able to tell its own
 * words from a receptionist's. Ordering breaks timestamp ties by id: Meta
 * timestamps are second-resolution, so a question and its answer can share one.
 * Empty bodies are dropped before the cap, so a burst of media rows cannot
 * quietly shrink the window to a handful of real turns.
 */
export function buildHistoryTurns(rows: HistoryRow[], limit = 20): PromptTurn[] {
  return [...rows]
    .filter((m) => (m.body ?? "").trim())
    .filter(
      (m) => m.direction === "inbound" || DELIVERED_OUTBOUND.has(m.status),
    )
    .sort((a, b) =>
      a.wa_timestamp === b.wa_timestamp
        ? a.id.localeCompare(b.id)
        : a.wa_timestamp.localeCompare(b.wa_timestamp),
    )
    .slice(-limit)
    .map((m) => {
      if (m.direction === "inbound") {
        return { role: "user" as const, content: m.body ?? "" };
      }
      const body = m.body ?? "";
      return {
        role: "assistant" as const,
        content:
          m.sender_kind === "human"
            ? `[A member of clinic staff wrote]: ${body}`
            : body,
      };
    });
}
