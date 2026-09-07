"use client";

import { useState } from "react";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { ArchStage } from "./ArchStage";
import { ClinicalPatientHeader } from "./ClinicalPatientHeader";
import { RequiredTreatmentsQueue } from "./RequiredTreatmentsQueue";
import { ToothActionSidebar } from "./ToothActionSidebar";
import {
  appendCdtToQueue,
  openBalanceEgp,
} from "./queueHelpers";
import { buildQueueFromServer } from "./buildQueue";
import type { CdtQuickAction, QueueRow, ViewTab } from "./clinicalTypes";

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
  const [selectedUniversal, setSelectedUniversal] = useState<number | null>(
    null,
  );
  const [viewTab, setViewTab] = useState<ViewTab>("chairside");
  const [sessionRows, setSessionRows] = useState<QueueRow[]>([]);

  const serverQueue = buildQueueFromServer(treatments, imaging);
  const queue = [...sessionRows, ...serverQueue];
  const markedFdis = [
    ...new Set(
      queue.map((r) => r.toothFdi).filter((fdi): fdi is string => Boolean(fdi)),
    ),
  ];
  const balanceEgp = openBalanceEgp(queue);

  function handleQuickAction(action: CdtQuickAction) {
    if (selectedUniversal === null) return;
    setSessionRows((prev) => appendCdtToQueue(prev, selectedUniversal, action));
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc]">
      <ClinicalPatientHeader group={group} balanceEgp={balanceEgp} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,380px)]">
          <ArchStage
            selectedUniversal={selectedUniversal}
            markedFdis={markedFdis}
            viewTab={viewTab}
            onViewTab={setViewTab}
            onSelectUniversal={setSelectedUniversal}
          />
          <ToothActionSidebar
            selectedUniversal={selectedUniversal}
            onQuickAction={handleQuickAction}
          />
        </div>
        <RequiredTreatmentsQueue rows={queue} />
      </div>
    </div>
  );
}
