"use client";

import { midControlBezierPath, boxAnchor } from "./bezier";
import type { ConditionNode } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";

type Props = {
  rects: Record<string, DOMRect>;
  width: number;
  height: number;
  stream: ConditionNode[];
  conditionId: string;
  hoveredEntity: HoveredEntity;
};

export function FanRayLayer({
  rects,
  width,
  height,
  stream,
  conditionId,
  hoveredEntity,
}: Props) {
  const origin = rects.arch;
  if (!origin || width < 1 || height < 1) return null;
  const from = {
    x: origin.left + origin.width * 0.62,
    y: origin.top + origin.height * 0.42,
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-[25] hidden h-full w-full lg:block"
      aria-hidden
    >
      <defs>
        <linearGradient id="hx-fan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {stream.map((node) => {
        const box = rects[`fan-${node.id}`];
        if (!box) return null;
        const to = boxAnchor(box, "left");
        const on = node.id === conditionId;
        const hot = hoveredEntity?.type === "NODE" && hoveredEntity.id === node.id;
        return (
          <path
            key={node.id}
            d={midControlBezierPath(from, to)}
            fill="none"
            stroke="url(#hx-fan)"
            strokeWidth={on || hot ? 38 : 22}
            opacity={on || hot ? 0.82 : 0.35}
          />
        );
      })}
    </svg>
  );
}
