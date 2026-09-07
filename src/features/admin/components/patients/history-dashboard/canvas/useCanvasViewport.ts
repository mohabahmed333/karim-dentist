"use client";

import { useCallback, useRef, useState } from "react";
import type { Viewport } from "./canvas.types";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

export function useCanvasViewport() {
  const [viewport, setViewport] = useState<Viewport>({ x: 24, y: 16, scale: 1 });
  const panRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.06 : 0.06;
    setViewport((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta)),
    }));
  }, []);

  const onPanStart = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest("[data-node-shell]")) return;
      panRef.current = {
        x: event.clientX,
        y: event.clientY,
        originX: viewport.x,
        originY: viewport.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [viewport.x, viewport.y],
  );

  const onPanMove = useCallback((event: React.PointerEvent) => {
    const pan = panRef.current;
    if (!pan) return;
    setViewport((prev) => ({
      ...prev,
      x: pan.originX + (event.clientX - pan.x),
      y: pan.originY + (event.clientY - pan.y),
    }));
  }, []);

  const onPanEnd = useCallback((event: React.PointerEvent) => {
    if (!panRef.current) return;
    panRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return { viewport, onWheel, onPanStart, onPanMove, onPanEnd };
}
