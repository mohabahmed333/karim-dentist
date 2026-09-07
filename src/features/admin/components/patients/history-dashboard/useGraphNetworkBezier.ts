"use client";

import { useLayoutEffect, useMemo, useState, type RefObject } from "react";
import { calculateBezierPath } from "./bezier";
import type { GraphNetworkEdge } from "@/services/dental_chart/graph-network";
import { measureLegacyAnchors, stageMeasureEqual } from "./stageMeasure";
import type { NodeRefMap } from "./useNodeRefMap";

const EMPTY_EDGES: GraphNetworkEdge[] = [];

type Measured = {
  rects: Record<string, DOMRect>;
  width: number;
  height: number;
};

export type GraphEdgePath = {
  id: string;
  from: string;
  to: string;
  sourceAnchor: GraphNetworkEdge["sourceAnchor"];
  targetAnchor: GraphNetworkEdge["targetAnchor"];
  d: string;
};

function buildEdgePaths(
  container: HTMLElement,
  nodeRefs: NodeRefMap,
  edges: GraphNetworkEdge[],
): GraphEdgePath[] {
  return edges
    .map((edge) => {
      const sourceEl = nodeRefs.current[edge.from];
      const targetEl = nodeRefs.current[edge.to];
      if (!sourceEl || !targetEl) return null;
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        sourceAnchor: edge.sourceAnchor,
        targetAnchor: edge.targetAnchor,
        d: calculateBezierPath(sourceEl, targetEl, container),
      };
    })
    .filter((path): path is GraphEdgePath => path !== null);
}

function edgePathsEqual(a: GraphEdgePath[], b: GraphEdgePath[]): boolean {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index].id !== b[index].id || a[index].d !== b[index].d) return false;
  }
  return true;
}

export function useGraphNetworkBezier(
  container: RefObject<HTMLElement | null>,
  nodeRefs: NodeRefMap,
  edges: GraphNetworkEdge[] = EMPTY_EDGES,
  tick: unknown,
) {
  const [measured, setMeasured] = useState<Measured>({ rects: {}, width: 0, height: 0 });
  const [paths, setPaths] = useState<GraphEdgePath[]>([]);

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const update = () => {
      const legacy = measureLegacyAnchors(root);
      setMeasured((prev) => (stageMeasureEqual(prev, legacy) ? prev : legacy));
      const nextPaths = buildEdgePaths(root, nodeRefs, edges);
      setPaths((prev) => (edgePathsEqual(prev, nextPaths) ? prev : nextPaths));
    };

    update();
    const frame = requestAnimationFrame(update);
    const delayed = window.setTimeout(update, 420);
    const observer = new ResizeObserver(update);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((node) => observer.observe(node));
    Object.values(nodeRefs.current).forEach((node) => {
      if (node) observer.observe(node);
    });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(delayed);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [container, nodeRefs, edges, tick]);

  const edgePaths = useMemo(() => paths, [paths]);

  return { ...measured, edgePaths };
}
