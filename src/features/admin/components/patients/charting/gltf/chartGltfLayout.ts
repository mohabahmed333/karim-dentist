import type { Dentition } from "@/services/notation";
import {
  PRIMARY_LOWER_LEFT,
  PRIMARY_LOWER_RIGHT,
  PRIMARY_UPPER_LEFT,
  PRIMARY_UPPER_RIGHT,
  fdiForUniversalAdult,
} from "@/services/notation";
import { TOOTH_POSITIONS } from "../../history-dashboard/dental3d/arch-geometry";

export type ChartGltfSlot = {
  fdi: string;
  position: [number, number, number];
  rotationY: number;
  arch: "upper" | "lower";
};

function row(
  ids: readonly string[],
  y: number,
  halfWidth: number,
  depth: number,
  arch: "upper" | "lower",
): ChartGltfSlot[] {
  return ids.map((fdi, index) => {
    const t = ids.length <= 1 ? 0 : (index / (ids.length - 1)) * 2 - 1;
    return {
      fdi,
      position: [t * halfWidth, y, depth * t * t],
      rotationY: Math.atan2(t * 0.35, 1) + (arch === "lower" ? Math.PI : 0),
      arch,
    };
  });
}

/** Adult uses Clinical U-arch layout; primary keeps a compact row layout. */
export function chartGltfSlots(dentition: Dentition): ChartGltfSlot[] {
  if (dentition === "primary") {
    const upper = [...PRIMARY_UPPER_RIGHT, ...PRIMARY_UPPER_LEFT];
    const lower = [...PRIMARY_LOWER_RIGHT, ...PRIMARY_LOWER_LEFT];
    return [
      ...row(upper, 0.42, 2.5, 1.15, "upper"),
      ...row(lower, -0.42, 2.35, 1.05, "lower"),
    ];
  }

  return TOOTH_POSITIONS.flatMap((tooth) => {
    const fdi = fdiForUniversalAdult(tooth.id);
    if (!fdi) return [];
    const yNudge = tooth.arch === "upper" ? -0.06 : 0.06;
    return [
      {
        fdi,
        position: [
          tooth.position.x,
          tooth.position.y + yNudge,
          tooth.position.z,
        ] as [number, number, number],
        rotationY: tooth.rotation,
        arch: tooth.arch,
      },
    ];
  });
}
