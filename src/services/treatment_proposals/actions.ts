"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { listDoctors } from "@/services/profiles";
import { listAllServiceDoctorMappings } from "@/services/service_doctors/queries";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import type {
  PriceableDoctor,
  PriceableService,
} from "@/services/service_doctors/pricing";
import { createProposalSchema } from "./schemas";
import { insertProposal, decideProposal, createTreatmentsFromProposal } from "./mutations";
import { enqueueTreatmentProposalNotification } from "./notify";
import { getProposalWithItems } from "./queries";
import { addBillingEntry } from "@/services/patient_billing/mutations";
import { sendBillingPaymentRequest } from "@/services/billing_payments/notify";
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { assignBillingDoctor } from "@/services/reservations/mutations";

export type BillingFormOptions = {
  services: PriceableService[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
};

/**
 * Everything the "Bill patient" dialog needs to render its pickers.
 *
 * Fetched on demand rather than threaded as props: the dialog opens from the
 * overview drawer and the bookings drawer too, and neither of those pages
 * loads the service catalog or the doctor list today. Patient-agnostic — the
 * caller already knows which patient it is billing.
 */
export async function loadBillingFormOptions(): Promise<BillingFormOptions> {
  const auth = await requirePermission("patients.treatments.edit");
  if (auth.error) throw new Error("Forbidden");

  const [servicesRes, doctors, serviceDoctorMappings] = await Promise.all([
    auth.supabase
      .from("services")
      // price_min_egp is the fallback rung for a doctor with no fee of their
      // own — without it the amount field can only be prefilled for services
      // priced at a single figure.
      .select("id, title, title_ar, price_label, price_min_egp")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    listDoctors(auth.supabase),
    listAllServiceDoctorMappings(auth.supabase),
  ]);
  if (servicesRes.error) throw servicesRes.error;

  return {
    services: servicesRes.data ?? [],
    doctors: doctors.map((d) => ({ id: d.id, display_name: d.display_name })),
    serviceDoctorMappings,
  };
}

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

  // Billing a visit is also the moment its doctor is known. Writing it back
  // means the dialog pre-selects them next time, and the visit lands on that
  // doctor's My Day instead of belonging to nobody.
  if (parsed.data.reservationId) {
    await assignBillingDoctor(
      auth.supabase,
      parsed.data.reservationId,
      parsed.data.doctorId,
    );
  }

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

/**
 * Settle a pending proposal: always accepts it (same as decideTreatmentProposal),
 * then either records an immediate cash payment or sends a WhatsApp payment
 * request that settles the ledger later once verified/confirmed.
 */
export async function settleTreatmentProposal(
  proposalId: string,
  method: "cash" | "whatsapp_request",
): Promise<
  | { ok: true; via?: "text" | "queued" }
  | { ok: false; error: string }
> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const proposal = await getProposalWithItems(auth.supabase, proposalId);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "sent") throw new Error("Proposal already decided");

  await decideProposal(auth.supabase, proposalId, "accepted", auth.session.user.id);
  await createTreatmentsFromProposal(
    auth.supabase,
    proposal.patientKey,
    proposal.doctorId,
    proposal.items,
    proposal.reservationId,
  );

  const description = proposal.items.map((item) => item.description).join(", ") || "Treatment";

  if (method === "cash") {
    await addBillingEntry(auth.supabase, proposal.patientKey, auth.session.user.id, {
      kind: "payment",
      amount_egp: proposal.total,
      description,
      method: "cash",
      reservation_id: proposal.reservationId,
    });
    return { ok: true };
  }

  const reservations = await listReservationsServer(auth.supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  const patient = directory.find((g) => g.patientKey === proposal.patientKey);
  if (!patient) return { ok: false, error: "Patient phone not found" };

  const service = createServiceClient();
  const result = await sendBillingPaymentRequest(service, {
    proposalId,
    patientKey: proposal.patientKey,
    patientName: patient.displayName,
    patientPhone: patient.phone,
    reservationId: proposal.reservationId,
    amountEgp: proposal.total,
    description,
    sentBy: auth.session.user.id,
  });
  if (!result.ok) return { ok: false, error: result.error };
  // `via` matters to the caller: "text" actually reached the patient, "queued"
  // only went into the outbox, where it waits on a Meta template that does not
  // exist yet. Reporting both as success told the front desk a message had
  // been sent when nothing had left the building.
  return { ok: true, via: result.via };
}
