"use client";

import type { ReactNode } from "react";
import type { DiagTab } from "./useChartingSession";

const TABS: { id: DiagTab; label: string }[] = [
  { id: "imaging", label: "Imaging" },
  { id: "vitality", label: "Vitality" },
  { id: "perio", label: "Perio" },
  { id: "soap", label: "SOAP" },
];

type Props = {
  selectedFdi: string | null;
  toothLabel: string;
  tab: DiagTab;
  onTab: (tab: DiagTab) => void;
  children: ReactNode;
};

export function DiagnosticPane({
  selectedFdi,
  toothLabel,
  tab,
  onTab,
  children,
}: Props) {
  if (!selectedFdi) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#EEF2F6] px-6 py-10">
        <p className="text-[15px] font-semibold text-[#1E293B]">Select a tooth</p>
        <p className="mt-2 max-w-[16rem] text-center text-sm text-[#64748B]">
          Tap a tooth on the chart in the middle to open imaging, vitality,
          perio, and SOAP.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-[15px] font-semibold tracking-tight text-[#1E293B]">
        {toothLabel}
      </p>
      <div className="mt-3 flex flex-wrap gap-1 rounded-full bg-[#EEF2F6] p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium ${
              tab === item.id
                ? "bg-[#2563EB] text-white shadow-sm"
                : "text-[#64748B]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
