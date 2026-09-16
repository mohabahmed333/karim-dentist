"use client";

import { PatientAppointmentHistoryTab } from "@/features/admin/components/patients/PatientAppointmentHistoryTab";
import { PatientInfoTab } from "@/features/admin/components/patients/PatientInfoTab";
import { PatientMedicalRecordTab } from "@/features/admin/components/patients/PatientMedicalRecordTab";
import { PatientNextTreatmentTab } from "@/features/admin/components/patients/PatientNextTreatmentTab";
import type { PatientProfileTab } from "@/features/admin/components/patients/PatientProfileTabs";
import { usePatientToothNotes } from "@/features/admin/components/patients/usePatientToothNotes";
import { chartTabProps } from "@/features/admin/components/patients/history-dashboard/chartTabProps";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";

type Props = {
  /** Never "chart" — the chair's own workspace renders that one. */
  tab: Exclude<PatientProfileTab, "chart">;
  group: PatientGroup;
  treatments: TreatmentItem[];
  notes: PatientToothNote[];
  doctorNameById: Record<string, string>;
};

/**
 * The patient record's four tabs, as My Day shows them.
 *
 * Separate from `MyDayView` because the notes hook only seeds from its
 * `initial` argument: mounting this under `key={group.patientKey}` is what
 * reseeds the record when the clock rolls on to the next patient.
 */
export function MyDayRecordTabs({
  tab,
  group,
  treatments,
  notes,
  doctorNameById,
}: Props) {
  const chart = usePatientToothNotes(group.patientKey, notes);

  return (
    <>
      {tab === "information" ? (
        <PatientInfoTab group={group} embedded />
      ) : null}
      {tab === "history" ? (
        <PatientAppointmentHistoryTab group={group} />
      ) : null}
      {tab === "next" ? (
        <PatientNextTreatmentTab group={group} treatments={treatments} />
      ) : null}
      {tab === "medical" ? (
        <PatientMedicalRecordTab
          {...chartTabProps(chart, treatments, doctorNameById)}
        />
      ) : null}
    </>
  );
}
