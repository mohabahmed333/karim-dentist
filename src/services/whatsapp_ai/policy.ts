import { isWhatsappSessionOpen } from "@/services/whatsapp/sessionWindow";
import type {
  PolicyDecision,
  WhatsappAiSettings,
  WhatsappAiState,
} from "./types";

/** Message types the model can actually read. */
const READABLE_TYPES = new Set(["text", "interactive", "button"]);

export type PolicyInput = {
  settings: WhatsappAiSettings;
  state: WhatsappAiState | null;
  conversation: { status: string; last_inbound_at: string | null };
  inbound: { message_type: string; body: string };
  counts: { conversationLastHour: number; globalLastHour: number };
  lastHumanOutboundAt: string | null;
  hasAiKey: boolean;
  now?: Date;
};

function minutesSince(iso: string | null, now: Date): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - at) / 60_000;
}

function inFuture(iso: string | null, now: Date): boolean {
  if (!iso) return false;
  const at = Date.parse(iso);
  return Number.isFinite(at) && at > now.getTime();
}

/**
 * Decide whether the responder may reply, must draft, or must stay silent.
 *
 * Deliberately pure and evaluated before any model call: autonomy is never the
 * model's decision. The model describes what it thinks the patient wants; this
 * decides what may happen as a result.
 *
 * Order matters — the first matching rule wins, cheapest and most absolute
 * first.
 */
export function evaluateAutoReplyPolicy(input: PolicyInput): PolicyDecision {
  const now = input.now ?? new Date();
  const { settings, state } = input;

  // Absolute stops: no reply of any kind, not even a draft.
  if (!input.hasAiKey) return { allow: "none", reason: "no_ai_key" };
  if (settings.mode === "off") return { allow: "none", reason: "mode_off" };
  if (input.conversation.status !== "active") {
    return { allow: "none", reason: "conversation_closed" };
  }
  if (state && !state.autoreply_enabled) {
    return { allow: "none", reason: "conversation_disabled" };
  }
  if (state && inFuture(state.paused_until, now)) {
    return { allow: "none", reason: "paused" };
  }
  if (!input.inbound.body.trim() && READABLE_TYPES.has(input.inbound.message_type)) {
    return { allow: "none", reason: "empty_message" };
  }

  // A message the model cannot read must not be guessed at.
  if (!READABLE_TYPES.has(input.inbound.message_type)) {
    return settings.ack_media_enabled
      ? { allow: "draft", reason: "unreadable_message" }
      : { allow: "none", reason: "unreadable_message" };
  }

  // A human is mid-conversation: never talk over them, but a draft is useful.
  if (
    (state && inFuture(state.handoff_until, now)) ||
    minutesSince(input.lastHumanOutboundAt, now) < settings.human_handoff_minutes
  ) {
    return { allow: "draft", reason: "human_active" };
  }

  // Outside Meta's 24h window free text is a policy violation, not an error we
  // may retry — draft it and let staff choose an approved template.
  if (!isWhatsappSessionOpen(input.conversation.last_inbound_at, now)) {
    return { allow: "draft", reason: "session_closed" };
  }

  if (
    input.counts.conversationLastHour >=
    settings.max_replies_per_conversation_per_hour
  ) {
    return { allow: "draft", reason: "rate_limited_conversation" };
  }

  // Global overload should be quiet, not a flood of drafts across every thread.
  if (input.counts.globalLastHour >= settings.max_replies_global_per_hour) {
    return { allow: "none", reason: "rate_limited_global" };
  }

  if (settings.mode === "draft_only") {
    return { allow: "draft", reason: "mode_draft_only" };
  }

  return { allow: "auto" };
}
