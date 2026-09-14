import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  decodePatientKey,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { listPatientLedger } from "@/services/patient_billing/queries";
import { PatientBillingView } from "@/features/admin/components/patients/billing/PatientBillingView";
import { requirePagePermission } from "@/lib/auth/pageGuard";

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
  const group = getPatientGroup(directory, patientKey);
  if (!group) notFound();

  const { entries, balance } = await listPatientLedger(
    supabase,
    group.patientKey,
    group.visits.map((v) => v.id),
  );

  return (
    <PatientBillingView
      patientKey={group.patientKey}
      displayName={group.displayName}
      entries={entries}
      balance={balance}
      canEdit={session.permissions.has("patients.billing.edit")}
    />
  );
}
