"use client";

import { useCallback, useRef, useState } from "react";
import {
  enforceMinWindow,
  pixelToDate,
  snapToEvents,
} from "./temporalMath";
import type { TimelineScrubberEvent } from "./scrubber.types";

type DragMode = "left" | "right" | "pan" | null;

type Args = {
  minDate: Date;
  maxDate: Date;
  range: [Date, Date];
  events: TimelineScrubberEvent[];
  enableSnap: boolean;
  onRangeChange: (start: Date, end: Date) => void;
};

export function useGlobalTimelineDrag({
  minDate,
  maxDate,
  range,
  events,
  enableSnap,
  onRangeChange,
}: Args) {
  const trackRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<DragMode>(null);
  const anchorRef = useRef({ x: 0, older: range[0], newer: range[1] });
  const [dragging, setDragging] = useState(false);

  const localX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const box = track.getBoundingClientRect();
    return Math.max(0, Math.min(clientX - box.left, box.width));
  }, []);

  const applyRange = useCallback(
    (older: Date, newer: Date, edited: "start" | "end" | "pan") => {
      let nextOlder = older;
      let nextNewer = newer;
      if (enableSnap) {
        nextOlder = snapToEvents(nextOlder, events, minDate, maxDate, trackRef.current?.clientWidth ?? 1);
        nextNewer = snapToEvents(nextNewer, events, minDate, maxDate, trackRef.current?.clientWidth ?? 1);
      }
      const [start, end] = enforceMinWindow(nextOlder, nextNewer, minDate, maxDate, edited);
      onRangeChange(start, end);
    },
    [enableSnap, events, maxDate, minDate, onRangeChange],
  );

  const rangeRef = useRef(range);
  rangeRef.current = range;

  const begin = useCallback(
    (mode: DragMode, event: React.PointerEvent) => {
      if (event.button !== 0) return;
      modeRef.current = mode;
      anchorRef.current = {
        x: localX(event.clientX),
        older: rangeRef.current[0],
        newer: rangeRef.current[1],
      };
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [localX],
  );

  const move = useCallback(
    (event: React.PointerEvent) => {
      const mode = modeRef.current;
      const track = trackRef.current;
      if (!mode || !track) return;
      const width = track.getBoundingClientRect().width;
      const x = localX(event.clientX);
      const { older, newer } = anchorRef.current;

      if (mode === "left") {
        const date = pixelToDate(x, minDate, maxDate, width);
        applyRange(older, date, "end");
        return;
      }
      if (mode === "right") {
        const date = pixelToDate(x, minDate, maxDate, width);
        applyRange(date, newer, "start");
        return;
      }
      if (mode === "pan") {
        const dx = x - anchorRef.current.x;
        const span = maxDate.getTime() - minDate.getTime();
        const deltaMs = (dx / width) * span;
        applyRange(new Date(older.getTime() + deltaMs), new Date(newer.getTime() + deltaMs), "pan");
      }
    },
    [applyRange, localX, maxDate, minDate],
  );

  const end = useCallback((event: React.PointerEvent) => {
    modeRef.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return { trackRef, dragging, begin, move, end };
}
