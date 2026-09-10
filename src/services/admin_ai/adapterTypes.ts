import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ActionDiff, ActionOutcome, ProposedAction } from "./schemas";

export type AdminDb = SupabaseClient<Database>;

/**
 * Sends a WhatsApp message on the clinic's behalf. Injected so the whatsapp.*
 * adapters can be tested without Kapso credentials or a network call; the
 * registry supplies the real implementation at runtime.
 */
export type WhatsappSendFn = (input: {
  conversationId: string;
  sentBy: string | null;
  text?: string;
  template?: {
    name: string;
    language: string;
    body?: { type: "text"; text: string; parameterName?: string }[];
  };
}) => Promise<{ id: string }>;

export type ActionContext = {
  db: AdminDb;
  actorId: string;
  patientKey?: string | null;
  sendWhatsapp?: WhatsappSendFn;
};

export type ActionAdapter = {
  kind: ProposedAction["kind"];
  /** Immediate UI/nav actions skip proposal confirm. */
  write: boolean;
  preview: (
    action: ProposedAction,
    ctx: ActionContext,
  ) => Promise<{
    target: string;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    snapshot: Record<string, unknown>;
    warnings?: string[];
  }>;
  execute: (
    action: ProposedAction,
    ctx: ActionContext,
  ) => Promise<ActionOutcome>;
};

export type PreviewBundle = {
  diffs: ActionDiff[];
  snapshots: Record<string, unknown>;
};
