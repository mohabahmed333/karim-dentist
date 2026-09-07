import type { Encounter, LabOrder, Prescription, TimelineRange, TimelineTick } from "./types";

export function inYearRange(iso: string, range: TimelineRange): boolean {
  const year = new Date(iso).getFullYear();
  return year >= range.startYear && year <= range.endYear;
}

export function filterEncounters(items: Encounter[], range: TimelineRange): Encounter[] {
  return items.filter((item) => inYearRange(item.timestamp, range));
}

export function filterPrescriptions(
  items: Prescription[],
  range: TimelineRange,
): Prescription[] {
  return items.filter((item) => {
    const start = new Date(item.startDate).getFullYear();
    const end = new Date(item.endDate).getFullYear();
    return start <= range.endYear && end >= range.startYear;
  });
}

export function filterLabs(items: LabOrder[], range: TimelineRange): LabOrder[] {
  return items.filter((item) => inYearRange(item.updatedAt, range));
}

export function encounterBucketKey(iso: string, zoomScale: number): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  if (zoomScale < 1.75) return String(year);
  if (zoomScale < 3) return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function clusterTimelineTicks(
  timestamps: string[],
  years: readonly number[],
  zoomScale: number,
): TimelineTick[] {
  const last = years.length - 1;
  const groups = new Map<string, string[]>();
  for (const iso of timestamps) {
    const key = encounterBucketKey(iso, zoomScale);
    const list = groups.get(key) ?? [];
    list.push(iso);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, list], _offset, all) => {
    const year = new Date(list[0] ?? `${years[0]}-01-01`).getFullYear();
    const index = Math.max(0, years.findIndex((item) => item === year));
    const slot = last <= 0 ? 0 : 100 / last;
    const siblings = all.filter(([, items]) =>
      new Date(items[0] ?? "").getFullYear() === year,
    );
    const sub = siblings.findIndex(([itemKey]) => itemKey === key);
    const spread = zoomScale < 1.75 || siblings.length <= 1 ? 0 : ((sub + 0.5) / siblings.length) * slot * 0.65;
    const count = list.length;
    return {
      key,
      pct: index * slot + spread,
      size: Math.min(4 + count * 2, 12),
      label: zoomScale >= 3 ? formatChip(list[0] ?? "") : count > 1 ? String(count) : null,
      count,
    };
  });
}

function formatChip(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}
