"use client";

import {
  CHARTING_TOOLS,
  DENTITION_OPTIONS,
  NUMBERING_OPTIONS,
  type ChartingTool,
  type DentitionMode,
  type NumberingSystem,
} from "./shellTypes";

type Props = {
  numbering: NumberingSystem;
  dentition: DentitionMode;
  tool: ChartingTool;
  onNumbering: (v: NumberingSystem) => void;
  onDentition: (v: DentitionMode) => void;
  onTool: (v: ChartingTool) => void;
};

function Pill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? "bg-[#2563eb] text-white"
          : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:text-[#111827]"
      }`}
    >
      {label}
    </button>
  );
}

export function ChartingToolbar({
  numbering,
  dentition,
  tool,
  onNumbering,
  onDentition,
  onTool,
}: Props) {
  return (
    <div className="space-y-2 rounded-xl border border-[#e5e7eb] bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {NUMBERING_OPTIONS.map((opt) => (
          <Pill
            key={opt}
            label={opt}
            active={numbering === opt}
            onClick={() => onNumbering(opt)}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-[#e5e7eb]" aria-hidden />
        {DENTITION_OPTIONS.map((opt) => (
          <Pill
            key={opt}
            label={opt}
            active={dentition === opt}
            onClick={() => onDentition(opt)}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {CHARTING_TOOLS.map((opt) => (
          <Pill
            key={opt}
            label={opt}
            active={tool === opt}
            onClick={() => onTool(opt)}
          />
        ))}
      </div>
    </div>
  );
}
