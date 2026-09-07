"use client";

import type { GraphAnchor } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";
import type { GraphEdgePath } from "./useGraphNetworkBezier";

type Props = {
  edgePaths: GraphEdgePath[];
  width: number;
  height: number;
  visibleAnchors: GraphAnchor[];
  expanded: boolean;
  hoveredEntity: HoveredEntity;
};

function edgeActive(
  path: GraphEdgePath,
  expanded: boolean,
  visibleAnchors: GraphAnchor[],
  hoveredEntity: HoveredEntity,
): boolean {
  if (!expanded) return false;
  const hot =
    hoveredEntity?.type === "CARD" &&
    (hoveredEntity.id === path.targetAnchor ||
      (path.sourceAnchor !== null && hoveredEntity.id === path.sourceAnchor));
  if (hot) return true;
  if (!visibleAnchors.includes(path.targetAnchor)) return false;
  if (path.sourceAnchor && !visibleAnchors.includes(path.sourceAnchor)) return false;
  return true;
}

export function GraphBezierLayer({
  edgePaths,
  width,
  height,
  visibleAnchors,
  expanded,
  hoveredEntity,
}: Props) {
  if (width < 1 || height < 1) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible lg:block"
      aria-hidden
    >
      {edgePaths.map((path) => {
        const active = edgeActive(path, expanded, visibleAnchors, hoveredEntity);
        return (
          <path
            key={path.id}
            d={path.d}
            fill="none"
            stroke={active ? "#E2F163" : "rgba(0,0,0,0.15)"}
            strokeWidth={active ? 3 : 1.5}
            vectorEffect="non-scaling-stroke"
            className={`hx-bezier-path ${active ? "hx-path-glow hx-path-active" : ""}`}
            style={{ opacity: expanded ? 1 : 0 }}
          />
        );
      })}
    </svg>
  );
}
