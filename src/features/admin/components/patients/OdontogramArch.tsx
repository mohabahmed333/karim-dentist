"use client";

import type { ToothPosition } from "@/services/patient_tooth_findings/fdiLayout";
import { OdontogramTooth } from "./OdontogramTooth";

type Props = {
  positions: ToothPosition[];
  selectedFdi: string | null;
  hoveredFdi: string | null;
  commented: ReadonlySet<string>;
  onSelect: (fdi: string) => void;
  onHover: (fdi: string | null) => void;
};

export function OdontogramArch({
  positions,
  selectedFdi,
  hoveredFdi,
  commented,
  onSelect,
  onHover,
}: Props) {
  return (
    <>
      {positions.map((position) => (
        <OdontogramTooth
          key={position.fdi}
          position={position}
          selectedFdi={selectedFdi}
          hoveredFdi={hoveredFdi}
          commented={commented}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </>
  );
}
