"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
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
import { chartTabProps } from "./history-dashboard/chartTabProps";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
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
}: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<PatientProfileTab>("information");
  const chart = usePatientToothNotes(group.patientKey, notes);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PatientProfileTabs active={tab} onChange={setTab} />
        <Link
          href={patientWorkspacePath(group.patientKey)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ExternalLink className="size-3.5" />
          {t("admin.patientTabs.openWorkspace")}
        </Link>
      </div>

      {tab === "information" ? <PatientInfoTab group={group} /> : null}
      {tab === "history" ? (
        <PatientAppointmentHistoryTab group={group} />
      ) : null}
      {tab === "next" ? <PatientNextTreatmentTab group={group} /> : null}
      {tab === "medical" ? <PatientMedicalRecordTab {...chartTabProps(chart)} /> : null}
    </div>
  );
}
