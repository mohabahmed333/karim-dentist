import type { ProposalItem, ProposalStatus, PendingProposal } from "./types";
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";

type ServerSupabase = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/** Pure — no I/O. */
export function proposalTotal(items: ProposalItem[]): number {
  return items.reduce((sum, item) => sum + item.amountEgp, 0);
}

function mapItems(
  rows: { id: string; service_id: string; description: string; amount_egp: number }[],
): ProposalItem[] {
  return rows.map((row) => ({
    id: row.id,
    serviceId: row.service_id,
    description: row.description,
    amountEgp: row.amount_egp,
  }));
}

/** Every proposal still awaiting a decision, for this patient, newest first. */
export async function listPendingProposals(
  supabase: ServerSupabase,
  patientKey: string,
): Promise<PendingProposal[]> {
  const { data: proposals, error: proposalsError } = await supabase
    .from("treatment_proposals")
    .select("id, patient_key, doctor_id, status, created_at, reservation_id")
    .eq("patient_key", patientKey)
    .eq("status", "sent")
    .order("created_at", { ascending: false });
  if (proposalsError) throw proposalsError;
  if (!proposals || proposals.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("treatment_proposal_items")
    .select("id, proposal_id, service_id, description, amount_egp")
    .in(
      "proposal_id",
      proposals.map((p) => p.id),
    );
  if (itemsError) throw itemsError;

  return proposals.map((proposal) => {
    const proposalItems = mapItems(
      (items ?? []).filter((item) => item.proposal_id === proposal.id),
    );
    return {
      id: proposal.id,
      patientKey: proposal.patient_key,
      doctorId: proposal.doctor_id,
      status: proposal.status as ProposalStatus,
      createdAt: proposal.created_at,
      items: proposalItems,
      total: proposalTotal(proposalItems),
      reservationId: proposal.reservation_id,
    };
  });
}

/**
 * One proposal with its items, by id — the authoritative source for
 * accept/decline, so a decision is never driven by client-supplied item
 * data (see actions.ts).
 */
export async function getProposalWithItems(
  supabase: ServerSupabase,
  proposalId: string,
): Promise<PendingProposal | null> {
  const { data: proposal, error: proposalError } = await supabase
    .from("treatment_proposals")
    .select("id, patient_key, doctor_id, status, created_at, reservation_id")
    .eq("id", proposalId)
    .maybeSingle();
  if (proposalError) throw proposalError;
  if (!proposal) return null;

  const { data: items, error: itemsError } = await supabase
    .from("treatment_proposal_items")
    .select("id, proposal_id, service_id, description, amount_egp")
    .eq("proposal_id", proposalId);
  if (itemsError) throw itemsError;

  const proposalItems = mapItems(items ?? []);
  return {
    id: proposal.id,
    patientKey: proposal.patient_key,
    doctorId: proposal.doctor_id,
    status: proposal.status as ProposalStatus,
    createdAt: proposal.created_at,
    items: proposalItems,
    total: proposalTotal(proposalItems),
    reservationId: proposal.reservation_id,
  };
}

export type PendingProposalWithPatient = PendingProposal & {
  displayName: string;
  phone: string;
};

/** Pure — attaches each proposal's patient name/phone from the directory. */
export function attachPatientInfo(
  proposals: PendingProposal[],
  directory: PatientGroup[],
): PendingProposalWithPatient[] {
  const infoByKey = new Map(directory.map((g) => [g.patientKey, g]));
  return proposals.map((proposal) => ({
    ...proposal,
    displayName: infoByKey.get(proposal.patientKey)?.displayName ?? proposal.patientKey,
    phone: infoByKey.get(proposal.patientKey)?.phone ?? "",
  }));
}

/** Every pending proposal, clinic-wide, with the patient it belongs to. */
export async function listAllPendingProposals(
  supabase: ServerSupabase,
): Promise<PendingProposalWithPatient[]> {
  const { data: proposals, error: proposalsError } = await supabase
    .from("treatment_proposals")
    .select("id, patient_key, doctor_id, status, created_at, reservation_id")
    .eq("status", "sent")
    .order("created_at", { ascending: false });
  if (proposalsError) throw proposalsError;
  if (!proposals || proposals.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("treatment_proposal_items")
    .select("id, proposal_id, service_id, description, amount_egp")
    .in(
      "proposal_id",
      proposals.map((p) => p.id),
    );
  if (itemsError) throw itemsError;

  const pending: PendingProposal[] = proposals.map((proposal) => {
    const proposalItems = mapItems(
      (items ?? []).filter((item) => item.proposal_id === proposal.id),
    );
    return {
      id: proposal.id,
      patientKey: proposal.patient_key,
      doctorId: proposal.doctor_id,
      status: proposal.status as ProposalStatus,
      createdAt: proposal.created_at,
      items: proposalItems,
      total: proposalTotal(proposalItems),
      reservationId: proposal.reservation_id,
    };
  });

  const reservations = await listReservationsServer(supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  return attachPatientInfo(pending, directory);
}
