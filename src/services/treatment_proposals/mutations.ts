import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { CreateProposalValues } from "./schemas";
import type { ProposalItem } from "./types";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export async function insertProposal(
  supabase: ServerSupabase,
  patientKey: string,
  input: CreateProposalValues,
): Promise<{ id: string }> {
  const { data: proposal, error: proposalError } = await supabase
    .from("treatment_proposals")
    .insert({ patient_key: patientKey, doctor_id: input.doctorId })
    .select("id")
    .single();
  if (proposalError) throw proposalError;

  const { error: itemsError } = await supabase.from("treatment_proposal_items").insert(
    input.items.map((item) => ({
      proposal_id: proposal.id,
      service_id: item.serviceId,
      description: item.description,
      amount_egp: item.amountEgp,
    })),
  );
  if (itemsError) throw itemsError;

  return { id: proposal.id };
}

export async function decideProposal(
  supabase: ServerSupabase,
  proposalId: string,
  decision: "accepted" | "declined",
  decidedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from("treatment_proposals")
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: decidedBy,
    })
    .eq("id", proposalId);
  if (error) throw error;
}

/**
 * Turns each accepted item into a real, billable treatment. `tooth_name` is
 * required by patient_treatments and there's no tooth-level detail at
 * proposal time, so it's set to the service description — the doctor can
 * refine it later during actual charting.
 */
export async function createTreatmentsFromProposal(
  supabase: ServerSupabase,
  patientKey: string,
  doctorId: string,
  items: ProposalItem[],
): Promise<void> {
  const { error } = await supabase.from("patient_treatments").insert(
    items.map((item) => ({
      patient_key: patientKey,
      tooth_name: item.description,
      doctor_id: doctorId,
      service_id: item.serviceId,
      fee_amount: item.amountEgp,
      status: "open" as const,
    })),
  );
  if (error) throw error;
}
