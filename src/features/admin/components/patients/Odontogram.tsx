"use client";

import { useEffect, useMemo } from "react";
import {
  adjacentFdi,
  isFdiNumber,
  LOWER_LEFT,
  LOWER_RIGHT,
  UPPER_LEFT,
  UPPER_RIGHT,
  type FdiNumber,
} from "@/services/patient_tooth_findings/fdi";
import {
  ODONTOGRAM_VIEWBOX,
  odontogramPositions,
} from "@/services/patient_tooth_findings/fdiLayout";
import { OdontogramArch } from "./OdontogramArch";
import { ClinicalCanvasLtr } from "@/features/admin/components/ClinicalCanvasLtr";

type Props = {
  selectedFdi: string | null;
  hoveredFdi: string | null;
  commented: ReadonlySet<string>;
  onSelect: (fdi: string) => void;
  onHover: (fdi: string | null) => void;
  onDeselect: () => void;
};

export function Odontogram({
  selectedFdi,
  hoveredFdi,
  commented,
  onSelect,
  onHover,
  onDeselect,
}: Props) {
  const positions = useMemo(() => odontogramPositions(), []);
  const { width, height, cx, cy } = ODONTOGRAM_VIEWBOX;
  const pick = (ids: readonly FdiNumber[]) => ids.map((id) => positions[id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDeselect();
        return;
      }
      if (!selectedFdi || !isFdiNumber(selectedFdi)) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        onSelect(adjacentFdi(selectedFdi, "next"));
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        onSelect(adjacentFdi(selectedFdi, "prev"));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDeselect, onSelect, selectedFdi]);

  return (
    <ClinicalCanvasLtr className="rounded-2xl bg-[#EEF2F6] px-4 py-5">
      <h3 className="mb-4 text-center text-base font-semibold text-[#111827]">
        Odontogram
      </h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto h-auto w-full max-w-md"
        role="img"
        aria-label="Adult dental chart"
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          onClick={onDeselect}
        />
        <line x1={cx} y1={24} x2={cx} y2={height - 24} stroke="#e5e7eb" />
        <line x1={28} y1={cy} x2={width - 28} y2={cy} stroke="#e5e7eb" />
        <OdontogramArch
          positions={pick([...UPPER_RIGHT, ...UPPER_LEFT])}
          selectedFdi={selectedFdi}
          hoveredFdi={hoveredFdi}
          commented={commented}
          onSelect={onSelect}
          onHover={onHover}
        />
        <OdontogramArch
          positions={pick([...LOWER_RIGHT, ...LOWER_LEFT])}
          selectedFdi={selectedFdi}
          hoveredFdi={hoveredFdi}
          commented={commented}
          onSelect={onSelect}
          onHover={onHover}
        />
        {Object.values(positions).map((position) => {
          const active = position.fdi === selectedFdi;
          const hover = position.fdi === hoveredFdi;
          return (
            <text
              key={`label-${position.fdi}`}
              x={position.labelX}
              y={position.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={active || hover ? 700 : 400}
              className={
                active ? "fill-[#111827]" : hover ? "fill-[#2563eb]" : "fill-[#9ca3af]"
              }
              pointerEvents="none"
            >
              {position.fdi}
            </text>
          );
        })}
      </svg>
    </ClinicalCanvasLtr>
  );
}
