"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { patientWorkspacePath } from "@/services/reservations/patientHistory";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { usePatientToothNotes } from "./usePatientToothNotes";
import { PatientAppointmentHistoryTab } from "./PatientAppointmentHistoryTab";
import { PatientInfoTab } from "./PatientInfoTab";
import { PatientMedicalRecordTab } from "./PatientMedicalRecordTab";
import { PatientNextTreatmentTab } from "./PatientNextTreatmentTab";
import {
  PatientProfileTabs,
  type PatientProfileTab,
} from "./PatientProfileTabs";
import { PatientTabPanel } from "./PatientTabPanel";
import { chartTabProps } from "./history-dashboard/chartTabProps";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
  treatments: TreatmentItem[];
  doctorNameById: Record<string, string>;
  /** Front desk reads the record but does not open the chart. */
  canOpenWorkspace?: boolean;
};

/**
 * The patient's record, as four tabs.
 *
 * This route used to render the clinical workspace, byte for byte the same
 * component as `/patients/[key]/workspace` — two URLs for one screen, and
 * nowhere to read a patient's details without the chairside chart on top of
 * them. The workspace keeps its own route; this one is the record, and links
 * across to it.
 */
export function PatientProfileView({
  group,
  notes,
  treatments,
  doctorNameById,
  canOpenWorkspace = false,
}: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<PatientProfileTab>("information");
  const chart = usePatientToothNotes(group.patientKey, notes);

  return (
    <div className="space-y-4">
      <PatientProfileTabs
        active={tab}
        onChange={setTab}
        actions={
          canOpenWorkspace ? (
            <Link
              href={patientWorkspacePath(group.patientKey)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <ExternalLink className="size-3.5" />
              {t("admin.patientTabs.openWorkspace")}
            </Link>
          ) : null
        }
      />

      <PatientTabPanel tab={tab}>
        {tab === "information" ? <PatientInfoTab group={group} /> : null}
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
      </PatientTabPanel>
    </div>
  );
}
