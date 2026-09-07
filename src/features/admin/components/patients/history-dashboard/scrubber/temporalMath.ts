const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Left = newest (maxDate), right = oldest (minDate). */
export function dateToPixel(
  date: Date,
  minDate: Date,
  maxDate: Date,
  trackWidth: number,
): number {
  const span = maxDate.getTime() - minDate.getTime();
  if (span <= 0) return 0;
  const t = (maxDate.getTime() - date.getTime()) / span;
  return clamp(t, 0, 1) * trackWidth;
}

export function pixelToDate(
  pixelX: number,
  minDate: Date,
  maxDate: Date,
  trackWidth: number,
): Date {
  const span = maxDate.getTime() - minDate.getTime();
  const t = clamp(pixelX / Math.max(trackWidth, 1), 0, 1);
  return new Date(maxDate.getTime() - t * span);
}

export function snapToEvents(
  date: Date,
  events: { date: Date }[],
  minDate: Date,
  maxDate: Date,
  trackWidth: number,
  thresholdPx = 12,
): Date {
  const px = dateToPixel(date, minDate, maxDate, trackWidth);
  let closest = date;
  let closestDist = thresholdPx + 1;
  for (const event of events) {
    const eventPx = dateToPixel(event.date, minDate, maxDate, trackWidth);
    const dist = Math.abs(px - eventPx);
    if (dist <= thresholdPx && dist < closestDist) {
      closest = event.date;
      closestDist = dist;
    }
  }
  return closest;
}

export function enforceMinWindow(
  start: Date,
  end: Date,
  minDate: Date,
  maxDate: Date,
  edited: "start" | "end" | "pan",
): [Date, Date] {
  const minT = minDate.getTime();
  const maxT = maxDate.getTime();
  let older = start.getTime() <= end.getTime() ? start : end;
  let newer = start.getTime() <= end.getTime() ? end : start;
  if (newer.getTime() - older.getTime() < MONTH_MS) {
    if (edited === "start") older = new Date(newer.getTime() - MONTH_MS);
    else newer = new Date(older.getTime() + MONTH_MS);
  }
  older = new Date(clamp(older.getTime(), minT, maxT));
  newer = new Date(clamp(newer.getTime(), minT, maxT));
  if (newer.getTime() - older.getTime() < MONTH_MS) {
    if (edited === "end") newer = new Date(Math.min(maxT, older.getTime() + MONTH_MS));
    else older = new Date(Math.max(minT, newer.getTime() - MONTH_MS));
  }
  return [older, newer];
}

export function formatRangeLabel(start: Date, end: Date): string {
  return `${start.getFullYear()} – ${end.getFullYear()}`;
}
