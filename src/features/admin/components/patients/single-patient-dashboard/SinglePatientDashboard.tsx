"use client";

import { useState } from "react";
import { ActionPanel } from "./ActionPanel";
import { MOCK_PATIENT, MOCK_TREATMENTS } from "./mockData";
import { Odontogram } from "./Odontogram";
import { PatientHeader } from "./PatientHeader";
import { TreatmentTable } from "./TreatmentTable";
import { appendQuickTreatment } from "./treatmentActions";
import type { QuickAction, Treatment } from "./types";

export function SinglePatientDashboard() {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>(MOCK_TREATMENTS);

  function handleQuickAction(action: QuickAction) {
    if (selectedTooth === null) return;
    setTreatments((prev) => appendQuickTreatment(prev, selectedTooth, action));
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc]">
      <PatientHeader patient={MOCK_PATIENT} />
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:p-6">
        <div className="flex flex-col gap-4">
          <Odontogram
            treatments={treatments}
            selectedTooth={selectedTooth}
            onSelectTooth={setSelectedTooth}
          />
          <TreatmentTable treatments={treatments} />
        </div>
        <ActionPanel
          selectedTooth={selectedTooth}
          onQuickAction={handleQuickAction}
        />
      </div>
    </div>
  );
}
