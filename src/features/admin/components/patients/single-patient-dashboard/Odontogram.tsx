"use client";

import { toothConditionTint } from "./treatmentActions";
import type { Treatment } from "./types";
import { ClinicalCanvasLtr } from "@/features/admin/components/ClinicalCanvasLtr";

type Props = {
  treatments: Treatment[];
  selectedTooth: number | null;
  onSelectTooth: (tooth: number) => void;
};

const UPPER = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER = Array.from({ length: 16 }, (_, i) => i + 17);

function toothClass(
  tooth: number,
  selected: number | null,
  treatments: Treatment[],
): string {
  const base =
    "flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]";
  if (selected === tooth) {
    return `${base} border-[#2563eb] bg-[#dbeafe] text-[#1e40af]`;
  }
  const tint = toothConditionTint(treatments, tooth);
  if (tint === "Critical") {
    return `${base} border-red-200 bg-red-100 text-red-900 hover:bg-red-200`;
  }
  if (tint === "Minor") {
    return `${base} border-yellow-200 bg-yellow-100 text-yellow-900 hover:bg-yellow-200`;
  }
  return `${base} border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]`;
}

function ToothRow({
  teeth,
  treatments,
  selectedTooth,
  onSelectTooth,
}: {
  teeth: number[];
  treatments: Treatment[];
  selectedTooth: number | null;
  onSelectTooth: (tooth: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {teeth.map((tooth) => (
        <button
          key={tooth}
          type="button"
          aria-pressed={selectedTooth === tooth}
          aria-label={`Tooth ${tooth}`}
          className={toothClass(tooth, selectedTooth, treatments)}
          onClick={() => onSelectTooth(tooth)}
        >
          {tooth}
        </button>
      ))}
    </div>
  );
}

export function Odontogram({ treatments, selectedTooth, onSelectTooth }: Props) {
  return (
    <ClinicalCanvasLtr>
      <section
        aria-label="Dental chart"
        className="rounded-xl border border-[#e5e7eb] bg-white p-4"
      >
        <h2 className="mb-3 text-sm font-semibold text-[#111827]">Odontogram</h2>
        <div className="space-y-3">
          <ToothRow
            teeth={UPPER}
            treatments={treatments}
            selectedTooth={selectedTooth}
            onSelectTooth={onSelectTooth}
          />
          <ToothRow
            teeth={LOWER}
            treatments={treatments}
            selectedTooth={selectedTooth}
            onSelectTooth={onSelectTooth}
          />
        </div>
      </section>
    </ClinicalCanvasLtr>
  );
}
