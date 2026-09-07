import { TIMELINE_YEARS } from "./labels";
import type { TimelineRange, TimelineTick } from "./types";

export const ZOOM_SCALES = [1, 2, 4] as const;
export type ZoomScale = (typeof ZOOM_SCALES)[number];

const LEFT_YEAR = TIMELINE_YEARS[0]!;
const RIGHT_YEAR = TIMELINE_YEARS[TIMELINE_YEARS.length - 1]!;

export function zoomScaleAt(index: number): ZoomScale {
  const clamped = Math.max(0, Math.min(index, ZOOM_SCALES.length - 1));
  return ZOOM_SCALES[clamped] ?? 1;
}

export function yearToPct(year: number): number {
  const last = TIMELINE_YEARS.length - 1;
  const index = TIMELINE_YEARS.findIndex((item) => item === year);
  return (Math.max(index, 0) / last) * 100;
}

/** Map track pixel X to calendar year (2022 at left → 2014 at right). */
export function pixelToYear(pixelX: number, trackWidth: number): number {
  const t = Math.max(0, Math.min(pixelX / Math.max(trackWidth, 1), 1));
  const span = LEFT_YEAR - RIGHT_YEAR;
  return LEFT_YEAR - t * span;
}

export function pctToYear(pct: number): number {
  return pixelToYear(pct, 100);
}

export function snapYear(
  year: number,
  ticks: TimelineTick[],
  trackWidth: number,
  thresholdPx = 10,
): number {
  const pixelX = (yearToPct(Math.round(year)) / 100) * trackWidth;
  for (const tick of ticks) {
    const tickX = (tick.pct / 100) * trackWidth;
    if (Math.abs(pixelX - tickX) <= thresholdPx && tick.label) {
      return Math.round(pctToYear(tick.pct));
    }
  }
  return Math.round(year);
}

export function rangeFromPixels(
  startPx: number,
  endPx: number,
  trackWidth: number,
  ticks: TimelineTick[],
): TimelineRange {
  const a = snapYear(pixelToYear(Math.min(startPx, endPx), trackWidth), ticks, trackWidth);
  const b = snapYear(pixelToYear(Math.max(startPx, endPx), trackWidth), ticks, trackWidth);
  return { startYear: Math.min(a, b), endYear: Math.max(a, b) };
}

export function moveRange(
  range: TimelineRange,
  deltaYears: number,
): TimelineRange {
  const width = range.endYear - range.startYear;
  const nextStart = Math.max(RIGHT_YEAR, Math.min(LEFT_YEAR - width, range.startYear + deltaYears));
  return { startYear: nextStart, endYear: nextStart + width };
}
