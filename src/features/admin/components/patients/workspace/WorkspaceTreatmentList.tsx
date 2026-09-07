"use client";

import { toast } from "sonner";
import { formatEgp } from "@/services/cdt";
import type { ClinicalNote } from "@/services/clinical_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import { createDraftNote } from "../charting/useClinicalNotes";
import type { usePatientTreatments } from "../usePatientTreatments";
import { TreatmentTimelineItem } from "./TreatmentTimelineItem";

type Chart = ReturnType<typeof usePatientTreatments>;

type Props = {
  rows: TreatmentItem[];
  chart: Chart;
  clinicalNotes: ClinicalNote[];
  onSaveClinicalNote: (note: ClinicalNote) => void;
  onAdd: () => void;
  onContext: (id: string, anchor: DOMRect) => void;
};

export function WorkspaceTreatmentList({
  rows,
  chart,
  clinicalNotes,
  onSaveClinicalNote,
  onAdd,
  onContext,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-4 py-10 text-center">
        <p className="text-sm text-[#94A3B8]">No treatments for this tooth.</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 rounded-full bg-[#111111] px-4 py-2 text-[12px] font-semibold text-white"
        >
          Add required treatment
        </button>
      </div>
    );
  }

  const total = rows.reduce((sum, row) => sum + (row.feeAmount ?? 0), 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
          Timeline · {rows.length}
        </p>
        <p className="text-[12px] font-semibold tabular-nums text-[#0F172A]">
          Total {formatEgp(total)}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pe-1">
        {rows.map((item, index) => (
          <TreatmentTimelineItem
            key={item.id}
            item={item}
            notes={clinicalNotes.filter((note) => note.targetId === item.id)}
            isLast={index === rows.length - 1}
            expanded={chart.expandedId === item.id}
            onToggle={() =>
              chart.setExpandedId((prev) =>
                prev === item.id ? null : item.id,
              )
            }
            onBook={() => chart.openBook(item.id, "book")}
            onReplace={() => chart.openBook(item.id, "replace")}
            onEdit={() => chart.openEditor(item.id)}
            onSaveNote={(content) => {
              onSaveClinicalNote(
                createDraftNote(item.id, "Quick Note", content),
              );
              toast.success("Note saved");
            }}
            onDelete={() => chart.setDeleteId(item.id)}
            onContext={(rect) => onContext(item.id, rect)}
          />
        ))}
      </div>
    </div>
  );
}
