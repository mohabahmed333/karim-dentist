import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientProfileView } from "@/features/admin/components/patients/PatientProfileView";
import {
  decodePatientKey,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { resolvePatientDirectoryGroupFallback } from "@/services/patient_profiles/queries";
import { listToothNotesServer } from "@/services/patient_tooth_notes/queries";
import {
  listPatientTreatmentsServer,
  toTreatmentItem,
} from "@/services/patient_treatments";
import { listDoctors } from "@/services/profiles";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ patientKey: string }>;
};

export default async function AdminPatientDetailPage({ params }: Props) {
  await requirePagePermission("patients.view");
  const { patientKey: encoded } = await params;
  const patientKey = decodePatientKey(encoded);
  const supabase = await createClient();
  const reservations = await listReservationsServer(supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  const group =
    getPatientGroup(directory, patientKey) ??
    (await resolvePatientDirectoryGroupFallback(supabase, patientKey));

  if (!group) notFound();

  // Visits come with the group. The Medical Record tab reads the tooth notes
  // and, for its timeline, the patient's treatments plus the doctor names to
  // resolve each one's dentist. Imaging, services, the service/doctor matrix
  // and the ledger belonged to the workspace this route used to render, and
  // nothing on the record tabs reads them.
  const [notes, treatmentRows, doctors] = await Promise.all([
    listToothNotesServer(supabase, group.patientKey).catch(() => []),
    listPatientTreatmentsServer(supabase, group.patientKey).catch(() => []),
    listDoctors(supabase).catch(() => []),
  ]);

  return (
    <PatientProfileView
      group={group}
      notes={notes}
      treatments={treatmentRows.map(toTreatmentItem)}
      doctorNameById={Object.fromEntries(
        doctors.map((d) => [d.id, d.display_name ?? ""]),
      )}
    />
  );
}
