"use client";

import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool } from "@/services/tooth_surfaces";
import { ChartingSegment } from "./ChartingSegment";

const TOOLS: { id: PaintTool; label: string; swatch: string }[] = [
  { id: "select", label: "Select", swatch: "#2563EB" },
  { id: "decay", label: "Decay", swatch: "#EF4444" },
  { id: "filling", label: "Filling", swatch: "#3B82F6" },
  { id: "crown", label: "Crown", swatch: "#10B981" },
  { id: "missing", label: "Missing", swatch: "#94A3B8" },
  { id: "clear", label: "Clear", swatch: "#CBD5E1" },
];

type Props = {
  notation: NotationSystem;
  onNotation: (value: NotationSystem) => void;
  dentition: Dentition;
  onDentition: (value: Dentition) => void;
  paintTool: PaintTool;
  onPaintTool: (value: PaintTool) => void;
};

export function ChartingToolbar({
  notation,
  onNotation,
  dentition,
  onDentition,
  paintTool,
  onPaintTool,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 rounded-full bg-[#f8fafc] p-1">
        <ChartingSegment
          value={notation}
          onChange={onNotation}
          options={[
            { id: "fdi", label: "FDI" },
            { id: "universal", label: "Universal" },
            { id: "palmer", label: "Palmer" },
          ]}
        />
        <span className="mx-0.5 h-4 w-px bg-[#e5e7eb]" aria-hidden />
        <ChartingSegment
          value={dentition}
          onChange={onDentition}
          options={[
            { id: "adult", label: "Adult" },
            { id: "primary", label: "Child" },
          ]}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {TOOLS.map((tool) => {
          const active = paintTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onPaintTool(tool.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active
                  ? "bg-[#EFF6FF] text-[#2563EB]"
                  : "text-[#64748B] hover:text-[#111827]"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: tool.swatch }}
              />
              {tool.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
