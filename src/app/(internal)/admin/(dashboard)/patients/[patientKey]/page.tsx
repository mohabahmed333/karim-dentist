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
import { listPatientImagingServer } from "@/services/patient_imaging";
import { listToothNotesServer } from "@/services/patient_tooth_notes/queries";
import { listPatientTreatmentsServer } from "@/services/patient_treatments";
import type { Service } from "@/services/services/types";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { listDoctors } from "@/services/profiles";
import { listAllServiceDoctorMappings } from "@/services/service_doctors/queries";
import { listPatientLedger } from "@/services/patient_billing/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ patientKey: string }>;
};

export default async function AdminPatientDetailPage({ params }: Props) {
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

  const [notes, imaging, treatments, servicesResult, doctors, serviceDoctorMappings, ledger] =
    await Promise.all([
      listToothNotesServer(supabase, group.patientKey).catch(() => []),
      listPatientImagingServer(supabase, group.patientKey).catch(() => []),
      listPatientTreatmentsServer(supabase, group.patientKey).catch(() => []),
      (async () => {
        try {
          const { data } = await supabase
            .from("services")
            .select("*")
            .is("deleted_at", null)
            .order("sort_order", { ascending: true });
          return (data ?? []) as Service[];
        } catch {
          return [] as Service[];
        }
      })(),
      listDoctors(supabase),
      listAllServiceDoctorMappings(supabase),
      listPatientLedger(supabase, group.patientKey, group.visits.map((v) => v.id)),
    ]);

  return (
    <PatientProfileView
      group={group}
      notes={notes}
      imaging={imaging}
      treatments={treatments}
      services={servicesResult}
      directory={directory}
      doctors={doctors.map((d) => ({ id: d.id, display_name: d.display_name }))}
      serviceDoctorMappings={serviceDoctorMappings}
      canPropose={session.permissions.has("patients.treatments.edit")}
      canEditBilling={session.permissions.has("patients.billing.edit")}
      billingBalance={ledger.balance}
      currentDoctorId={session.isDoctor ? session.user!.id : null}
      canPickDoctor={!session.isDoctor}
    />
  );
}
