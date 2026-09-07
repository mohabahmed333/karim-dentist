"use client";

import { useLayoutEffect, useMemo, useState, type RefObject } from "react";
import { boxAnchor, midControlBezierPath } from "./bezier";
import type { Point } from "./dashboard.types";

type Measured = {
  rects: Record<string, DOMRect>;
  width: number;
  height: number;
};

export type BezierConnector = {
  id: string;
  from: Point;
  to: Point;
  d: string;
};

function measureAnchors(root: HTMLElement): Measured {
  const origin = root.getBoundingClientRect();
  const rects: Record<string, DOMRect> = {};
  root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((node) => {
    const id = node.dataset.anchor;
    if (!id) return;
    const box = node.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    rects[id] = new DOMRect(
      box.left - origin.left,
      box.top - origin.top,
      box.width,
      box.height,
    );
  });
  return { rects, width: origin.width, height: origin.height };
}

export function useBezierConnector(
  container: RefObject<HTMLElement | null>,
  tick: unknown,
  sourceId = "condition",
) {
  const [measured, setMeasured] = useState<Measured>({ rects: {}, width: 0, height: 0 });

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const update = () => setMeasured(measureAnchors(root));
    update();
    const frame = requestAnimationFrame(update);
    const delayed = window.setTimeout(update, 400);
    const observer = new ResizeObserver(update);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((node) => observer.observe(node));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(delayed);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [container, tick]);

  const connectors = useMemo(() => {
    const source = measured.rects[sourceId];
    if (!source || measured.width < 1) return [] as BezierConnector[];
    const from = boxAnchor(source, "right");
    return Object.entries(measured.rects)
      .filter(([id]) => id !== sourceId && !id.startsWith("fan-"))
      .map(([id, box]) => {
        const to = boxAnchor(box, "left");
        const d = midControlBezierPath(from, to);
        return { id, from, to, d };
      });
  }, [measured, sourceId]);

  return { ...measured, connectors };
}
