"use client";

import type { CanvasNode, Viewport } from "./canvas.types";
import { CANVAS_WORLD } from "./initialScene";

type Props = {
  nodes: CanvasNode[];
  viewport: Viewport;
};

export function CanvasMiniMap({ nodes, viewport }: Props) {
  const scaleX = 120 / CANVAS_WORLD.width;
  const scaleY = 68 / CANVAS_WORLD.height;

  return (
    <div className="absolute bottom-3 left-3 z-40 overflow-hidden rounded-xl border border-black/10 bg-white/90 p-1.5 shadow-md">
      <p className="mb-1 px-1 text-[9px] font-medium text-[#111111]/60">Mini-map</p>
      <svg width={120} height={68} className="block">
        {nodes.map((node) => (
          <rect
            key={node.id}
            x={node.x * scaleX}
            y={node.y * scaleY}
            width={18}
            height={10}
            rx={2}
            fill="#111111"
            opacity={0.35}
          />
        ))}
        <rect
          x={Math.max(0, -viewport.x * scaleX / viewport.scale)}
          y={Math.max(0, -viewport.y * scaleY / viewport.scale)}
          width={120 / viewport.scale}
          height={68 / viewport.scale}
          fill="none"
          stroke="#E2F163"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
