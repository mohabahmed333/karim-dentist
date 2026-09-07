"use client";

/**
 * DISABLED: Notes / Perio / Labs / placeholder Imaging panes.
 * Patient shell now mounts History + PatientXrayPane only.
 * Restore by wiring DashboardTab ids and remounting from PatientHistoryDashboard.
 */
import type { LabOrder } from "@/services/dental_chart";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { DashboardTab } from "./dashboard.types";
import type { usePatientToothNotes } from "../usePatientToothNotes";

type Props = {
  tab: DashboardTab;
  group: PatientGroup;
  chart: ReturnType<typeof usePatientToothNotes>;
  labs: LabOrder[];
};

export function DashboardPanes(_props: Props) {
  return null;
}

/* DISABLED body — kept for restore:
import { useMemo, useState } from "react";
import { filterLabsByView, type LabViewFilter } from "@/services/dental_chart/bento";
import { chartTabProps } from "./chartTabProps";
import { ImagingPane } from "./ImagingPane";
import { LabsRail } from "./LabsRail";
import { PatientInfoTab } from "../PatientInfoTab";
import { PatientMedicalRecordTab } from "../PatientMedicalRecordTab";

export function DashboardPanes({ tab, group, chart, labs }: Props) {
  const [labFilter, setLabFilter] = useState<LabViewFilter>("IN_PROGRESS");
  const visibleLabs = useMemo(() => filterLabsByView(labs, labFilter), [labs, labFilter]);
  if (tab === "labs") {
    return (
      <div className="mt-6 max-w-lg">
        <LabsRail labs={visibleLabs} filter={labFilter} onFilter={setLabFilter} />
      </div>
    );
  }
  if (tab === "imaging") return <ImagingPane />;
  return (
    <div className="mt-4 rounded-[32px] bg-white p-5 shadow-[0_16px_40px_rgba(17,17,17,0.06)]">
      {tab === "notes" ? <PatientInfoTab group={group} /> : null}
      <PatientMedicalRecordTab {...chartTabProps(chart)} />
    </div>
  );
}
*/
