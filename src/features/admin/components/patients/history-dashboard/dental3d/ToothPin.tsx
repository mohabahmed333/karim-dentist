"use client";

import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SEVERITY_COLORS, type ToothConditionInfo } from "./dental3d.types";

type Props = {
  position: THREE.Vector3;
  toothId: number;
  selected: boolean;
  highlightColor: string;
  condition: ToothConditionInfo;
  onClick: () => void;
};

const PIN_OFFSET_Y = 0.72;

export function ToothPin({
  position,
  toothId,
  selected,
  highlightColor,
  condition,
  onClick,
}: Props) {
  const pinPos: [number, number, number] = [
    position.x,
    position.y + PIN_OFFSET_Y,
    position.z,
  ];

  const severityColor = SEVERITY_COLORS[condition.severity];

  return (
    <Html
      position={pinPos}
      center
      distanceFactor={5}
      zIndexRange={[10, 20]}
      sprite
    >
      <button
        type="button"
        aria-label={`Tooth ${toothId}: ${condition.count} condition${condition.count !== 1 ? "s" : ""}`}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: selected ? highlightColor : "#111111",
          color: selected ? "#111111" : "#ffffff",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          border: `2px solid ${selected ? highlightColor : severityColor}`,
          cursor: "pointer",
          boxShadow: selected
            ? `0 0 0 4px ${highlightColor}55, 0 0 12px ${highlightColor}88`
            : `0 0 0 2px ${severityColor}55`,
          transition: "all 0.2s ease",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {condition.count}
        {/* Vertical line down to tooth */}
        <span
          style={{
            position: "absolute",
            bottom: -18,
            left: "50%",
            transform: "translateX(-50%)",
            width: 1.5,
            height: 16,
            background: selected ? highlightColor : severityColor,
            opacity: 0.7,
            borderRadius: 1,
          }}
        />
      </button>
    </Html>
  );
}
