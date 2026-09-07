import type { Json } from "@/lib/supabase/database.types";
import { buildDiff } from "./diff";
import type { ActionContext, PreviewBundle } from "./adapterTypes";
import { getAdapter, isWriteAction } from "./registry";
import {
  createProposalInputSchema,
  type ActionDiff,
  type ActionOutcome,
  type CreateProposalInput,
  type ExecutionResult,
  type ProposedAction,
} from "./schemas";
import {
  isProposalExpired,
  orderActions,
  proposalExpiresAt,
  snapshotHash,
} from "./proposalUtils";

export async function previewActions(
  actions: ProposedAction[],
  ctx: ActionContext,
): Promise<PreviewBundle> {
  const ordered = orderActions(actions);
  const diffs: ActionDiff[] = [];
  const snapshots: Record<string, unknown> = {};

  for (const action of ordered) {
    const adapter = getAdapter(action.kind);
    const preview = await adapter.preview(action, ctx);
    Object.assign(snapshots, preview.snapshot);
    diffs.push(
      buildDiff({
        action,
        target: preview.target,
        before: preview.before,
        after: preview.after,
        warnings: preview.warnings,
      }),
    );
  }
  return { diffs, snapshots };
}

export async function createProposal(
  ctx: ActionContext,
  input: CreateProposalInput,
) {
  const parsed = createProposalInputSchema.parse(input);
  for (const action of parsed.actions) {
    if (!isWriteAction(action.kind) && parsed.actions.length === 1) {
      /* navigation-only proposals are unusual but allowed */
    }
  }
  const { diffs, snapshots } = await previewActions(parsed.actions, ctx);
  const hash = snapshotHash(snapshots);
  const expires = proposalExpiresAt();

  const { data, error } = await ctx.db
    .from("ai_action_proposals")
    .insert({
      created_by: ctx.actorId,
      source: parsed.source,
      patient_key: parsed.patientKey ?? ctx.patientKey ?? null,
      summary: parsed.summary,
      actions: parsed.actions as unknown as Json,
      diffs: diffs as unknown as Json,
      snapshot_hash: hash,
      expires_at: expires.toISOString(),
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;

  await ctx.db.from("ai_action_audit_events").insert({
    proposal_id: data.id,
    actor_id: ctx.actorId,
    action_kind: "proposal.create",
    target: parsed.summary || "proposal",
    outcome: "proposed",
    before_summary: null,
    after_summary: { actionCount: parsed.actions.length } as Json,
  });

  return { proposal: data, diffs, snapshotHash: hash };
}

export async function confirmProposal(
  ctx: ActionContext,
  proposalId: string,
): Promise<ExecutionResult> {
  const { data: proposal, error } = await ctx.db
    .from("ai_action_proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("created_by", ctx.actorId)
    .maybeSingle();
  if (error) throw error;
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "pending") {
    throw new Error(`Proposal is ${proposal.status}`);
  }
  if (isProposalExpired(proposal.expires_at)) {
    await ctx.db
      .from("ai_action_proposals")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", proposalId);
    await ctx.db.from("ai_action_audit_events").insert({
      proposal_id: proposalId,
      actor_id: ctx.actorId,
      action_kind: "proposal.confirm",
      target: proposalId,
      outcome: "stale",
      error_message: "Proposal expired",
    });
    throw new Error("Proposal expired — regenerate it");
  }

  const actions = proposal.actions as unknown as ProposedAction[];
  const { snapshots } = await previewActions(actions, {
    ...ctx,
    patientKey: proposal.patient_key ?? ctx.patientKey,
  });
  const hash = snapshotHash(snapshots);
  if (hash !== proposal.snapshot_hash) {
    await ctx.db.from("ai_action_audit_events").insert({
      proposal_id: proposalId,
      actor_id: ctx.actorId,
      action_kind: "proposal.confirm",
      target: proposalId,
      outcome: "stale",
      error_message: "Snapshot changed since preview",
    });
    throw new Error("Data changed since preview — regenerate proposal");
  }

  const outcomes: ActionOutcome[] = [];
  for (const action of orderActions(actions)) {
    try {
      const outcome = await getAdapter(action.kind).execute(action, {
        ...ctx,
        patientKey: proposal.patient_key ?? ctx.patientKey,
      });
      outcomes.push(outcome);
      await ctx.db.from("ai_action_audit_events").insert({
        proposal_id: proposalId,
        actor_id: ctx.actorId,
        action_kind: action.kind,
        target: action.label,
        outcome: outcome.ok ? "confirmed" : "failed",
        after_summary: (outcome.result ?? null) as Json,
        error_message: outcome.ok ? null : outcome.message ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      outcomes.push({
        actionId: action.id,
        kind: action.kind,
        ok: false,
        message,
      });
      await ctx.db.from("ai_action_audit_events").insert({
        proposal_id: proposalId,
        actor_id: ctx.actorId,
        action_kind: action.kind,
        target: action.label,
        outcome: "failed",
        error_message: message,
      });
    }
  }

  const ok = outcomes.every((o) => o.ok);
  const result: ExecutionResult = { proposalId, ok, outcomes };
  await ctx.db
    .from("ai_action_proposals")
    .update({
      status: ok ? "confirmed" : "failed",
      confirmed_at: new Date().toISOString(),
      result: result as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  return result;
}

export async function cancelProposal(ctx: ActionContext, proposalId: string) {
  const { error } = await ctx.db
    .from("ai_action_proposals")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("created_by", ctx.actorId)
    .eq("status", "pending");
  if (error) throw error;
  await ctx.db.from("ai_action_audit_events").insert({
    proposal_id: proposalId,
    actor_id: ctx.actorId,
    action_kind: "proposal.cancel",
    target: proposalId,
    outcome: "cancelled",
  });
}
