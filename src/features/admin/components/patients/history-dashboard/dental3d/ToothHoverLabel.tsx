"use client";

import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SEVERITY_COLORS, type ToothConditionInfo } from "./dental3d.types";

const TOOTH_NAMES: Record<number, string> = {
  1: "Upper Right 3rd Molar",   2: "Upper Right 2nd Molar",
  3: "Upper Right 1st Molar",   4: "Upper Right 2nd Premolar",
  5: "Upper Right 1st Premolar",6: "Upper Right Canine",
  7: "Upper Right Lateral Inc.", 8: "Upper Right Central Inc.",
  9: "Upper Left Central Inc.", 10: "Upper Left Lateral Inc.",
  11: "Upper Left Canine",      12: "Upper Left 1st Premolar",
  13: "Upper Left 2nd Premolar",14: "Upper Left 1st Molar",
  15: "Upper Left 2nd Molar",   16: "Upper Left 3rd Molar",
  17: "Lower Left 3rd Molar",   18: "Lower Left 2nd Molar",
  19: "Lower Left 1st Molar",   20: "Lower Left 2nd Premolar",
  21: "Lower Left 1st Premolar",22: "Lower Left Canine",
  23: "Lower Left Lateral Inc.",24: "Lower Left Central Inc.",
  25: "Lower Right Central Inc.",26: "Lower Right Lateral Inc.",
  27: "Lower Right Canine",     28: "Lower Right 1st Premolar",
  29: "Lower Right 2nd Premolar",30: "Lower Right 1st Molar",
  31: "Lower Right 2nd Molar",  32: "Lower Right 3rd Molar",
};

type Props = {
  position: THREE.Vector3;
  toothId: number;
  condition?: ToothConditionInfo;
  arch: "upper" | "lower";
};

export function ToothHoverLabel({ position, toothId, condition, arch }: Props) {
  const yOffset = arch === "upper" ? 1.1 : -1.1;
  const labelPos: [number, number, number] = [position.x, position.y + yOffset, position.z];

  return (
    <Html position={labelPos} center distanceFactor={6} zIndexRange={[30, 40]}>
      <div
        style={{
          background: "rgba(17,17,17,0.92)",
          backdropFilter: "blur(6px)",
          borderRadius: 10,
          padding: "6px 10px",
          minWidth: 140,
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, margin: 0, fontFamily: "system-ui" }}>
          #{toothId} — {TOOTH_NAMES[toothId] ?? "Tooth"}
        </p>
        {condition ? (
          <p style={{
            color: SEVERITY_COLORS[condition.severity],
            fontSize: 10,
            margin: "3px 0 0",
            fontFamily: "system-ui",
          }}>
            {condition.count} condition{condition.count !== 1 ? "s" : ""} · {condition.severity}
            {condition.surfaces?.length
              ? ` · ${condition.surfaces.join(", ")}`
              : ""}
          </p>
        ) : (
          <p style={{ color: "#aaa", fontSize: 10, margin: "3px 0 0", fontFamily: "system-ui" }}>
            No recorded conditions
          </p>
        )}
      </div>
    </Html>
  );
}
