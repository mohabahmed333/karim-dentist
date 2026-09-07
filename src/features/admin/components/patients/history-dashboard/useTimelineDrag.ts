"use client";

import { useCallback, useRef, useState } from "react";
import { moveRange, rangeFromPixels } from "@/services/dental_chart/scrubber-math";
import type { TimelineRange, TimelineTick } from "@/services/dental_chart";

type DragMode = "select" | "move" | null;

type Args = {
  range: TimelineRange;
  ticks: TimelineTick[];
  onRange: (range: TimelineRange) => void;
};

export function useTimelineDrag({ range, ticks, onRange }: Args) {
  const trackRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<DragMode>(null);
  const anchorPxRef = useRef(0);
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const [dragging, setDragging] = useState(false);

  const localX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const box = track.getBoundingClientRect();
    return Math.max(0, Math.min(clientX - box.left, box.width));
  }, []);

  const onTrackPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      modeRef.current = "select";
      anchorPxRef.current = localX(event.clientX);
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [localX],
  );

  const onWindowPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();
      modeRef.current = "move";
      anchorPxRef.current = localX(event.clientX);
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [localX],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!modeRef.current) return;
      const track = trackRef.current;
      if (!track) return;
      const width = track.getBoundingClientRect().width;
      if (modeRef.current === "select") {
        onRange(rangeFromPixels(anchorPxRef.current, localX(event.clientX), width, ticks));
        return;
      }
      const deltaPx = localX(event.clientX) - anchorPxRef.current;
      const deltaYears = Math.round((deltaPx / width) * -8);
      if (deltaYears !== 0) {
        onRange(moveRange(rangeRef.current, deltaYears));
        anchorPxRef.current = localX(event.clientX);
      }
    },
    [localX, onRange, ticks],
  );

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    modeRef.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return {
    trackRef,
    dragging,
    onTrackPointerDown,
    onWindowPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
