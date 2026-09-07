import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientProfileView } from "@/features/admin/components/patients/PatientProfileView";
import {
  decodePatientKey,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { listPatientImagingServer } from "@/services/patient_imaging";
import { listToothNotesServer } from "@/services/patient_tooth_notes/queries";
import { listPatientTreatmentsServer } from "@/services/patient_treatments";
import type { Service } from "@/services/services/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ patientKey: string }>;
};

export default async function AdminPatientDetailPage({ params }: Props) {
  const { patientKey: encoded } = await params;
  const patientKey = decodePatientKey(encoded);
  const supabase = await createClient();
  const reservations = await listReservationsServer(supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  const group = getPatientGroup(directory, patientKey);

  if (!group) notFound();

  const [notes, imaging, treatments, servicesResult] = await Promise.all([
    listToothNotesServer(supabase, group.patientKey).catch(() => []),
    listPatientImagingServer(supabase, group.patientKey).catch(() => []),
    listPatientTreatmentsServer(supabase, group.patientKey).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .then(({ data }) => (data ?? []) as Service[])
      .catch(() => [] as Service[]),
  ]);

  return (
    <PatientProfileView
      group={group}
      notes={notes}
      imaging={imaging}
      treatments={treatments}
      services={servicesResult}
      directory={directory}
    />
  );
}
