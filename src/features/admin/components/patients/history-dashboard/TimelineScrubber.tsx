"use client";

import { useCallback, useMemo } from "react";
import {
  TIMELINE_YEARS,
  ZOOM_SCALES,
  encounterBucketKey,
  type Encounter,
  type TimelineRange,
  type TimelineTick,
} from "@/services/dental_chart";
import { GlobalTimelineScrubber } from "./scrubber/GlobalTimelineScrubber";
import { categoryFromEncounter } from "./scrubber/eventCategory";
import type { TimelineScrubberEvent } from "./scrubber/scrubber.types";

type Props = {
  range: TimelineRange;
  ticks: TimelineTick[];
  encounters: Encounter[];
  zoomIndex: number;
  onZoomIndex: (next: number) => void;
  onRange: (range: TimelineRange) => void;
  onEventClick?: (encounter: Encounter) => void;
};

const MIN_DATE = new Date(2014, 0, 1);
const MAX_DATE = new Date(2022, 11, 31);

function yearDate(year: number, end = false): Date {
  return end ? new Date(year, 11, 31) : new Date(year, 0, 1);
}

function tickToDate(tick: TimelineTick): Date {
  const year = Math.round(2022 - (tick.pct / 100) * 8);
  const dayMatch = tick.label?.match(/(\d{2})\.(\d{2})/);
  if (dayMatch) {
    return new Date(year, Number(dayMatch[2]) - 1, Number(dayMatch[1]));
  }
  return yearDate(year, true);
}

export function TimelineScrubber({
  range,
  ticks,
  encounters,
  zoomIndex,
  onZoomIndex,
  onRange,
  onEventClick,
}: Props) {
  const zoomScale = ZOOM_SCALES[zoomIndex] ?? 1;

  const dateRange = useMemo(
    (): [Date, Date] => [yearDate(range.startYear), yearDate(range.endYear, true)],
    [range.endYear, range.startYear],
  );

  const events = useMemo((): TimelineScrubberEvent[] => {
    const encounterByKey = new Map(
      encounters.map((item) => [encounterBucketKey(item.timestamp, zoomScale), item]),
    );
    return ticks
      .filter((tick) => tick.count > 0)
      .map((tick) => {
        const encounter = encounterByKey.get(tick.key);
        return {
          id: tick.key,
          date: tickToDate(tick),
          count: tick.count,
          category: encounter ? categoryFromEncounter(encounter.type) : "NOTE",
        };
      });
  }, [encounters, ticks, zoomScale]);

  const handleEventClick = useCallback(
    (tickKey: string) => {
      const encounter = encounters.find(
        (item) => encounterBucketKey(item.timestamp, zoomScale) === tickKey,
      );
      if (encounter) onEventClick?.(encounter);
    },
    [encounters, onEventClick, zoomScale],
  );

  return (
    <GlobalTimelineScrubber
      minDate={MIN_DATE}
      maxDate={MAX_DATE}
      initialRange={dateRange}
      range={dateRange}
      events={events}
      zoomScale={zoomScale}
      yearLabels={[...TIMELINE_YEARS]}
      onRangeChange={(start, end) => {
        onRange({ startYear: start.getFullYear(), endYear: end.getFullYear() });
      }}
      onEventClick={handleEventClick}
      onZoomChange={(scale) => {
        const index = ZOOM_SCALES.findIndex((level) => level === scale);
        if (index >= 0) onZoomIndex(index);
      }}
    />
  );
}
