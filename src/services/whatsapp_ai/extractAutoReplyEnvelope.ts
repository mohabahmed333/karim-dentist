import { autoReplyEnvelopeSchema, type AutoReplyEnvelope } from "./schemas";

export type ExtractResult = {
  envelope: AutoReplyEnvelope;
  /** Why we fell back, if we did. Empty when the model's output was usable. */
  fallbackReason: string;
};

/** A safe envelope that always routes to a human. */
function handoffEnvelope(reason: string): AutoReplyEnvelope {
  return autoReplyEnvelopeSchema.parse({
    language: "en",
    intent: "other",
    confidence: 0,
    handoff: true,
    handoffReason: reason,
    reply: "A team member will reply shortly.",
  });
}

/** Pull the first balanced {...} out of prose, if the model wrapped its JSON. */
function firstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

function candidates(raw: string): string[] {
  const out = [raw.trim()];
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) out.push(fence[1].trim());
  const balanced = firstJsonObject(raw);
  if (balanced) out.push(balanced);
  return out;
}

/**
 * Parse the model's reply into a validated envelope.
 *
 * Never throws. Every failure — unparseable output, a schema violation, or an
 * action kind outside the bot's vocabulary — resolves to a handoff envelope,
 * so the patient gets a human rather than whatever the model actually emitted.
 * This mirrors extractClinicChat's drop-unknown behaviour, but stricter: here a
 * single bad action discards the whole turn, because a partially-understood
 * booking is worse than no booking.
 */
export function extractAutoReplyEnvelope(raw: string): ExtractResult {
  if (!raw?.trim()) {
    return { envelope: handoffEnvelope("empty"), fallbackReason: "empty" };
  }

  for (const candidate of candidates(raw)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      continue;
    }

    // An unknown action kind means the model is working from instructions we
    // did not give it. Hand off rather than salvaging the rest of the turn.
    const actions = (parsed as { actions?: unknown })?.actions;
    if (Array.isArray(actions)) {
      const known = new Set([
        "booking.book_slot",
        "booking.reschedule",
        "booking.cancel",
      ]);
      for (const action of actions) {
        const kind = (action as { kind?: unknown })?.kind;
        if (typeof kind !== "string" || !known.has(kind)) {
          return {
            envelope: handoffEnvelope("unknown_action"),
            fallbackReason: "unknown_action",
          };
        }
      }
    }

    const result = autoReplyEnvelopeSchema.safeParse(parsed);
    if (result.success) return { envelope: result.data, fallbackReason: "" };
    return {
      envelope: handoffEnvelope("schema"),
      fallbackReason: "schema",
    };
  }

  return { envelope: handoffEnvelope("unparseable"), fallbackReason: "unparseable" };
}
