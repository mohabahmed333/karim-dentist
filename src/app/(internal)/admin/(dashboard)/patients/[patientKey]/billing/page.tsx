import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  decodePatientKey,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { resolvePatientDirectoryGroupFallback } from "@/services/patient_profiles/queries";
import { listPatientLedger } from "@/services/patient_billing/queries";
import { PatientBillingView } from "@/features/admin/components/patients/billing/PatientBillingView";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { listDoctors } from "@/services/profiles";
import { listAllServiceDoctorMappings } from "@/services/service_doctors/queries";
import { listPendingProposals } from "@/services/treatment_proposals/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ patientKey: string }>;
};

export default async function AdminPatientBillingPage({ params }: Props) {
  const session = await requirePagePermission("patients.view");
  const { patientKey: encoded } = await params;
  const patientKey = decodePatientKey(encoded);
  const supabase = await createClient();
  const reservations = await listReservationsServer(supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  const group =
    getPatientGroup(directory, patientKey) ??
    (await resolvePatientDirectoryGroupFallback(supabase, patientKey));
  if (!group) notFound();

  const [{ entries, balance }, doctors, serviceDoctorMappings, servicesRes, pendingProposals] =
    await Promise.all([
      listPatientLedger(supabase, group.patientKey, group.visits.map((v) => v.id)),
      listDoctors(supabase),
      listAllServiceDoctorMappings(supabase),
      supabase
        .from("services")
        .select("id, title, title_ar, price_label")
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      listPendingProposals(supabase, group.patientKey),
    ]);

  return (
    <PatientBillingView
      patientKey={group.patientKey}
      patientPhone={group.phone}
      displayName={group.displayName}
      entries={entries}
      balance={balance}
      canEdit={session.permissions.has("patients.billing.edit")}
      canPropose={session.permissions.has("patients.treatments.edit")}
      services={servicesRes.data ?? []}
      doctors={doctors.map((d) => ({ id: d.id, display_name: d.display_name }))}
      serviceDoctorMappings={serviceDoctorMappings}
      pendingProposals={pendingProposals}
      reservations={group.visits}
    />
  );
}
