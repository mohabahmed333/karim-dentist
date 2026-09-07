import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ActionDiff, ActionOutcome, ProposedAction } from "./schemas";

export type AdminDb = SupabaseClient<Database>;

export type ActionContext = {
  db: AdminDb;
  actorId: string;
  patientKey?: string | null;
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
