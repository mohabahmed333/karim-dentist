"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { TimelineHandle } from "./TimelineHandle";
import { TimelineZoomCluster } from "./TimelineZoomCluster";
import { formatRangeLabel } from "./temporalMath";
import { EVENT_CATEGORY_COLORS } from "./eventCategory";
import type { TimelineScrubberProps } from "./scrubber.types";

import { useGlobalTimelineDrag } from "./useGlobalTimelineDrag";

export function GlobalTimelineScrubber({
  minDate,
  maxDate,
  range,
  highlightColor = "#E2F163",
  trackBgColor = "#EBEAE5",
  handleStyle = "BAR",
  events,
  enableZoom = true,
  enableSnap = true,
  zoomScale = 1,
  yearLabels = [2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014],
  onRangeChange,
  onEventClick,
  onZoomChange,
}: TimelineScrubberProps) {
  const drag = useGlobalTimelineDrag({
    minDate,
    maxDate,
    range,
    events,
    enableSnap,
    onRangeChange,
  });

  const [older, newer] = range;
  const span = maxDate.getTime() - minDate.getTime();

  const windowStyle = useMemo(() => {
    if (span <= 0) return { left: "0%", width: "10%" };
    const leftPct = ((maxDate.getTime() - newer.getTime()) / span) * 100;
    const widthPct = Math.max(((newer.getTime() - older.getTime()) / span) * 100, 1.5);
    return { left: `${leftPct}%`, width: `${widthPct}%` };
  }, [maxDate, newer, older, span]);

  const eventMarks = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        pct: ((maxDate.getTime() - event.date.getTime()) / span) * 100,
      })),
    [events, maxDate, span],
  );

  return (
    <div className="flex items-center gap-4 rounded-full border border-gray-200/60 bg-white/90 px-6 py-3 shadow-lg backdrop-blur-md">
      <div className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div
          ref={drag.trackRef}
          className="relative h-14 touch-none select-none"
          style={{ width: `${zoomScale * 100}%`, minWidth: "100%" }}
          onPointerMove={drag.move}
          onPointerUp={drag.end}
          onPointerCancel={drag.end}
        >
          {yearLabels.map((year, index) => (
            <span
              key={year}
              className="pointer-events-none absolute top-0 text-[10px] font-medium text-[#7a7a7a]"
              style={{ left: `${(index / (yearLabels.length - 1)) * 100}%` }}
            >
              {year}
            </span>
          ))}

          <div
            className="pointer-events-none absolute top-8 end-0 start-0 h-px opacity-80"
            style={{ backgroundColor: trackBgColor }}
          />

          {eventMarks.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventClick(event.id)}
              className="absolute top-2 z-10 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm"
              style={{
                left: `${event.pct}%`,
                backgroundColor: EVENT_CATEGORY_COLORS[event.category],
              }}
            >
              {event.count}
            </button>
          ))}

          {eventMarks.map((event) => (
            <span
              key={`${event.id}-dot`}
              className="pointer-events-none absolute top-[34px] size-1.5 -translate-x-1/2 rounded-full bg-[#9a9a94]"
              style={{ left: `${event.pct}%` }}
            />
          ))}

          <motion.div
            role="group"
            aria-label={`Selected range ${formatRangeLabel(older, newer)}`}
            className={`absolute top-6 h-8 rounded-md ${drag.dragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ ...windowStyle, backgroundColor: highlightColor }}
            animate={{ scale: drag.dragging ? 1.02 : 1 }}
            transition={{ duration: 0.12 }}
            onPointerDown={(event) => drag.begin("pan", event)}
            onPointerMove={drag.move}
            onPointerUp={drag.end}
          >
            <TimelineHandle
              style={handleStyle}
              side="left"
              onPointerDown={(event) => {
                event.stopPropagation();
                drag.begin("left", event);
              }}
            />
            <TimelineHandle
              style={handleStyle}
              side="right"
              onPointerDown={(event) => {
                event.stopPropagation();
                drag.begin("right", event);
              }}
            />
            <span className="pointer-events-none absolute -top-4 start-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium text-[#111111]/70">
              {formatRangeLabel(older, newer)}
            </span>
          </motion.div>
        </div>
      </div>

      {enableZoom ? <TimelineZoomCluster scale={zoomScale} onChange={onZoomChange} /> : null}
    </div>
  );
}
