import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ActionDiff, ProposalStatus, ProposedAction } from "./schemas";

export type ProposalAuditEvent = {
  id: string;
  proposal_id: string | null;
  action_kind: string;
  target: string;
  outcome: "proposed" | "confirmed" | "cancelled" | "failed" | "stale";
  error_message: string | null;
  created_at: string;
};

export type ProposalLogRow = {
  id: string;
  status: ProposalStatus;
  source: "clinic-chat" | "treatment-chat";
  patient_key: string | null;
  summary: string;
  actions: ProposedAction[];
  diffs: ActionDiff[];
  created_at: string;
  confirmed_at: string | null;
  auditEvents: ProposalAuditEvent[];
};

const DEFAULT_LIMIT = 20;

/**
 * Read-only history for the /admin/ai-actions log: what the AI proposed,
 * its diffs, and how each action actually resolved (from the audit trail
 * `createProposal`/`confirmProposal`/`cancelProposal` already write).
 *
 * Cursor pagination on `created_at` (newest first) rather than offsets —
 * fetches one row past `limit` to know whether another page exists.
 */
export async function listAiActionProposals(
  db: SupabaseClient<Database>,
  opts: { status?: ProposalStatus; cursor?: string; limit?: number },
): Promise<{ rows: ProposalLogRow[]; nextCursor: string | null }> {
  const limit = opts.limit ?? DEFAULT_LIMIT;

  let query = db
    .from("ai_action_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.cursor) query = query.lt("created_at", opts.cursor);

  const { data, error } = await query;
  if (error) throw error;

  const proposals = data ?? [];
  const hasMore = proposals.length > limit;
  const page = hasMore ? proposals.slice(0, limit) : proposals;
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  const ids = page.map((p) => p.id);
  const eventsByProposal = new Map<string, ProposalAuditEvent[]>();
  if (ids.length > 0) {
    const { data: events, error: eventsError } = await db
      .from("ai_action_audit_events")
      .select("id, proposal_id, action_kind, target, outcome, error_message, created_at")
      .in("proposal_id", ids);
    if (eventsError) throw eventsError;
    for (const event of events ?? []) {
      if (!event.proposal_id) continue;
      const list = eventsByProposal.get(event.proposal_id) ?? [];
      list.push(event);
      eventsByProposal.set(event.proposal_id, list);
    }
  }

  const rows: ProposalLogRow[] = page.map((p) => ({
    id: p.id,
    status: p.status,
    source: p.source,
    patient_key: p.patient_key,
    summary: p.summary,
    actions: (p.actions ?? []) as unknown as ProposedAction[],
    diffs: (p.diffs ?? []) as unknown as ActionDiff[],
    created_at: p.created_at,
    confirmed_at: p.confirmed_at,
    auditEvents: eventsByProposal.get(p.id) ?? [],
  }));

  return { rows, nextCursor };
}
