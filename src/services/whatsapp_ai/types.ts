import type { Database } from "@/lib/supabase/database.types";

export type WhatsappAiSettings =
  Database["public"]["Tables"]["whatsapp_ai_settings"]["Row"];
export type WhatsappAiState =
  Database["public"]["Tables"]["whatsapp_ai_state"]["Row"];
export type WhatsappAiJob =
  Database["public"]["Tables"]["whatsapp_ai_jobs"]["Row"];

export type AutoReplyMode = WhatsappAiSettings["mode"];

/** Why the responder did not auto-send. Persisted for tuning. */
export type SkipReason =
  | "no_ai_key"
  | "mode_off"
  | "mode_draft_only"
  | "conversation_closed"
  | "conversation_disabled"
  | "paused"
  | "human_active"
  | "unreadable_message"
  | "session_closed"
  | "rate_limited_conversation"
  | "rate_limited_global"
  | "empty_message";

export type PolicyDecision =
  | { allow: "auto" }
  | { allow: "draft"; reason: SkipReason }
  | { allow: "none"; reason: SkipReason };

export const DEFAULT_AI_SETTINGS: WhatsappAiSettings = {
  id: "00000000-0000-4000-8000-0000000000a1",
  mode: "off",
  max_replies_per_conversation_per_hour: 6,
  max_replies_global_per_hour: 120,
  human_handoff_minutes: 30,
  allow_booking_writes: false,
  ack_media_enabled: false,
  full_conversation: true,
  updated_at: new Date(0).toISOString(),
};
