"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { createProposalSchema } from "./schemas";
import { insertProposal, decideProposal, createTreatmentsFromProposal } from "./mutations";
import { enqueueTreatmentProposalNotification } from "./notify";
import { getProposalWithItems } from "./queries";

export async function saveTreatmentProposal(
  patientKey: string,
  patientPhone: string,
  patientName: string,
  input: unknown,
): Promise<{ id: string }> {
  const auth = await requirePermission("patients.treatments.edit");
  if (auth.error) throw new Error("Forbidden");

  const parsed = createProposalSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { id } = await insertProposal(auth.supabase, patientKey, parsed.data);

  const { data: doctor } = await auth.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", parsed.data.doctorId)
    .maybeSingle();

  await enqueueTreatmentProposalNotification(auth.supabase, {
    proposalId: id,
    patientPhone,
    patientName,
    doctorName: doctor?.display_name ?? "Your doctor",
    items: parsed.data.items,
  });

  return { id };
}

/**
 * Re-reads the proposal and its items from the database rather than trusting
 * anything the client sends beyond the id + decision — the amounts that
 * become real charges must come from what was actually proposed, not from
 * whatever a client happens to still have in memory.
 */
export async function decideTreatmentProposal(
  proposalId: string,
  decision: "accepted" | "declined",
): Promise<void> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const proposal = await getProposalWithItems(auth.supabase, proposalId);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "sent") throw new Error("Proposal already decided");

  await decideProposal(auth.supabase, proposalId, decision, auth.session.user.id);

  if (decision === "accepted") {
    await createTreatmentsFromProposal(
      auth.supabase,
      proposal.patientKey,
      proposal.doctorId,
      proposal.items,
      proposal.reservationId,
    );
  }
}
