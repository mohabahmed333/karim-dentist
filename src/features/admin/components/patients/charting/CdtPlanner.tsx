"use client";

import {
  bookModeForStatus,
  cdtPhaseFromId,
  phaseAfterToggle,
  proceduresInPhase,
  type CdtPhase,
  type PlannerPhaseId,
} from "@/services/cdt";
import { displayTooth, type NotationSystem } from "@/services/notation";
import type { TreatmentItem } from "@/services/patient_treatments";
import { CdtPhaseLane } from "./CdtPhaseLane";
import { CdtPresetChips } from "./CdtPresetChips";
import { PlannerActions } from "./PlannerActions";
import { useTreatmentPlanner } from "./useTreatmentPlanner";

const LANES: { phaseId: PlannerPhaseId; title: string }[] = [
  { phaseId: "immediate", title: "Immediate Care" },
  { phaseId: "planned", title: "Planned Care" },
];

type Props = {
  items: TreatmentItem[];
  selectedFdi: string | null;
  notation: NotationSystem;
  onAdd: (code: string, fee: number) => void;
  onPhase: (id: string, phase: CdtPhase) => void;
  onDelete: (id: string) => void;
  onBookRow: (id: string, mode: "book" | "replace") => void;
  onBookSelected: () => void;
  onAddNote: (procedureId: string, label: string) => void;
};

export function CdtPlanner({
  items,
  selectedFdi,
  notation,
  onAdd,
  onPhase,
  onDelete,
  onBookRow,
  onBookSelected,
  onAddNote,
}: Props) {
  const planner = useTreatmentPlanner(items, notation, 0);
  const selectedTooth = selectedFdi ? displayTooth(selectedFdi, notation) : null;
  const bookDisabled = !items.some(
    (item) => item.toothFdi === selectedFdi && item.status === "open",
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <CdtPresetChips
        hasTooth={Boolean(selectedFdi)}
        toothLabel={selectedTooth}
        onAdd={onAdd}
      />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {LANES.map((lane) => (
          <CdtPhaseLane
            key={lane.phaseId}
            phase={cdtPhaseFromId(lane.phaseId)}
            title={lane.title}
            items={proceduresInPhase(planner.procedures, lane.phaseId)}
            selectedTooth={selectedTooth}
            onBook={(id) => {
              const row = planner.procedures.find((item) => item.id === id);
              onBookRow(id, bookModeForStatus(row?.status ?? "open"));
            }}
            onAddNote={(id) => {
              const row = planner.procedures.find((item) => item.id === id);
              if (!row) return;
              onAddNote(
                id,
                `${row.cdtCode} · Tooth ${row.toothNumber}`,
              );
            }}
            onToggleCare={(id) => {
              const row = planner.procedures.find((item) => item.id === id);
              if (row) onPhase(id, phaseAfterToggle(row.phaseId));
            }}
            onDelete={onDelete}
            onDropPhase={onPhase}
          />
        ))}
      </div>
      <PlannerActions bookDisabled={bookDisabled} onBook={onBookSelected} />
    </div>
  );
}
