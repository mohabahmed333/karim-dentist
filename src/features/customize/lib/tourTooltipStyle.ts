import type { CSSProperties } from "react";
import type { TourStep } from "../lib/customizeTour";

type Rect = { top: number; left: number; width: number; height: number };

export function tourTooltipStyle(
  hole: Rect | null,
  placement: TourStep["placement"],
): CSSProperties {
  if (!hole) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }
  const gap = 12;
  const maxLeft = Math.max(12, window.innerWidth - 352);
  if (placement === "right") {
    return {
      top: Math.min(hole.top, window.innerHeight - 200),
      left: Math.min(hole.left + hole.width + gap, maxLeft),
    };
  }
  if (placement === "left") {
    return {
      top: Math.min(hole.top, window.innerHeight - 200),
      left: Math.max(12, hole.left - gap - 340),
    };
  }
  if (placement === "top") {
    return {
      top: Math.max(12, hole.top - gap - 160),
      left: Math.min(Math.max(12, hole.left), maxLeft),
    };
  }
  return {
    top: Math.min(hole.top + hole.height + gap, window.innerHeight - 200),
    left: Math.min(Math.max(12, hole.left), maxLeft),
  };
}
