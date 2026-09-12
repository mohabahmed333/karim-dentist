import { z } from "zod";
import type { ProposedAction } from "@/services/admin_ai/schemas";
import { parseProposedActions } from "./parseProposedActions";
import { parseLooseJsonObject } from "./parseLooseJson";

const chipSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(80),
  payload: z.record(z.string(), z.string()).optional(),
});

type Chip = z.infer<typeof chipSchema>;

export type ClinicChatPayload = {
  /** Empty when nothing readable came back — the caller supplies wording. */
  reply: string;
  suggestedActions: Chip[];
  proposedActions: ProposedAction[];
  /** Proposed actions rejected by the schema (unknown kind, bad payload). */
  dropped: number;
};

type Envelope = {
  reply?: unknown;
  suggestedActions?: unknown;
  proposedActions?: unknown;
};

/**
 * Read the model's answer.
 *
 * JSON mode returns a bare object; older prompts wrapped it in a ```json fence
 * after some prose. Both are accepted (via `parseLooseJsonObject`, shared with
 * the tool-call recogniser). When nothing parses, prose is still shown, but
 * anything JSON-shaped is cut off — staff should never read a half-written
 * `{"reply": …` in a chat bubble.
 */
export function extractClinicChatPayload(
  raw: string,
  defaults: Chip[] = [],
): ClinicChatPayload {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const envelope = parseLooseJsonObject(trimmed) as Envelope | null;

  if (envelope) {
    const chips = z.array(chipSchema).safeParse(envelope.suggestedActions);
    const proposed = parseProposedActions(envelope.proposedActions);
    const prose = fence ? trimmed.replace(fence[0], "").trim() : "";
    const reply =
      typeof envelope.reply === "string" && envelope.reply.trim()
        ? envelope.reply.trim()
        : prose;
    return {
      reply,
      suggestedActions: chips.success ? chips.data : defaults,
      proposedActions: proposed.actions,
      dropped: proposed.dropped,
    };
  }

  const withoutFences = trimmed.replace(/```[\s\S]*?(?:```|$)/g, "").trim();
  const jsonStart = withoutFences.search(/[[{]\s*"/);
  return {
    reply: (jsonStart >= 0 ? withoutFences.slice(0, jsonStart) : withoutFences).trim(),
    suggestedActions: defaults,
    proposedActions: [],
    dropped: 0,
  };
}
