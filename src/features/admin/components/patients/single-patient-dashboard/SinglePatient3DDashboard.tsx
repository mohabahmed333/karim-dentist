"use client";

import { useState } from "react";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { ArchStage } from "./ArchStage";
import { ClinicalPatientHeader } from "./ClinicalPatientHeader";
import { PatientDashboardShell } from "./PatientDashboardShell";
import { CDT_QUICK_ACTIONS } from "./clinicalCatalog";
import { buildQueueFromServer } from "./buildQueue";
import { appendCdtToQueue, openBalanceEgp } from "./queueHelpers";
import type { QueueRow } from "./clinicalTypes";

type Props = {
  group: PatientGroup;
  treatments: PatientTreatmentRow[];
  imaging: PatientImaging[];
};

export function SinglePatient3DDashboard({
  group,
  treatments,
  imaging,
}: Props) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [sessionRows, setSessionRows] = useState<QueueRow[]>([]);

  const serverQueue = buildQueueFromServer(treatments, imaging);
  const queue = [...sessionRows, ...serverQueue];
  const markedFdis = [
    ...new Set(
      queue.map((r) => r.toothFdi).filter((fdi): fdi is string => Boolean(fdi)),
    ),
  ];
  const balanceEgp = openBalanceEgp(queue);

  function handlePickCdt(cdtCode: string, label: string) {
    if (selectedTooth === null) return;
    const action =
      CDT_QUICK_ACTIONS.find((a) => a.cdtCode === cdtCode) ?? {
        id: `custom-${cdtCode}`,
        label: `+ ${label}`,
        cdtCode,
        severity: "Minor" as const,
        feeAmount: 0,
        procedureName: label,
      };
    setSessionRows((prev) => appendCdtToQueue(prev, selectedTooth, action));
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc]">
      <ClinicalPatientHeader group={group} balanceEgp={balanceEgp} />
      <PatientDashboardShell
        selectedTooth={selectedTooth}
        queue={queue}
        onPickCdt={handlePickCdt}
      >
        <ArchStage
          selectedUniversal={selectedTooth}
          markedFdis={markedFdis}
          onSelectUniversal={setSelectedTooth}
        />
      </PatientDashboardShell>
    </div>
  );
}
