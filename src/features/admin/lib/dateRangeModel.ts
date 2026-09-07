export type DateRange = { start: Date; end: Date };

export type RangePresetId =
  | "today"
  | "this_week"
  | "last_7"
  | "this_month"
  | "last_30"
  | "last_month"
  | "last_3_month"
  | "last_6_month";

export const RANGE_PRESETS: { id: RangePresetId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "last_7", label: "Last 7 days" },
  { id: "this_month", label: "This Month" },
  { id: "last_30", label: "Last 30 days" },
  { id: "last_month", label: "Last Month" },
  { id: "last_3_month", label: "Last 3 Months" },
  { id: "last_6_month", label: "Last 6 Months" },
];

export const RANGE_PRESET_MESSAGE_KEYS = {
  today: "admin.date.today",
  this_week: "admin.date.thisWeek",
  last_7: "admin.date.last7",
  this_month: "admin.date.thisMonth",
  last_30: "admin.date.last30",
  last_month: "admin.date.lastMonth",
  last_3_month: "admin.date.last3Months",
  last_6_month: "admin.date.last6Months",
} as const satisfies Record<RangePresetId, string>;

export const WEEKDAY_MESSAGE_KEYS = [
  "admin.date.weekday.mon",
  "admin.date.weekday.tue",
  "admin.date.weekday.wed",
  "admin.date.weekday.thu",
  "admin.date.weekday.fri",
  "admin.date.weekday.sat",
  "admin.date.weekday.sun",
] as const;

export type CompareMode = "previous_period" | "previous_year" | "none";

export const COMPARE_OPTIONS: { id: CompareMode; label: string }[] = [
  { id: "previous_period", label: "Previous period" },
  { id: "previous_year", label: "Previous year" },
  { id: "none", label: "No comparison" },
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function rangeFromPreset(
  id: RangePresetId,
  now = new Date(),
): DateRange {
  const today = startOfDay(now);
  switch (id) {
    case "today":
      return { start: today, end: endOfDay(today) };
    case "this_week": {
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = addDays(today, mondayOffset);
      return { start, end: endOfDay(addDays(start, 6)) };
    }
    case "last_7":
      return { start: addDays(today, -6), end: endOfDay(today) };
    case "this_month":
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: endOfDay(
          new Date(today.getFullYear(), today.getMonth() + 1, 0),
        ),
      };
    case "last_30":
      return { start: addDays(today, -29), end: endOfDay(today) };
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
      return { start, end };
    }
    case "last_3_month":
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 2, 1),
        end: endOfDay(today),
      };
    case "last_6_month":
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 5, 1),
        end: endOfDay(today),
      };
  }
}

export function formatRangeLabel(
  range: DateRange,
  locale: string = "en",
): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${range.start.toLocaleDateString(locale, opts)} - ${range.end.toLocaleDateString(locale, opts)}`;
}

export function formatSingleDate(d: Date, locale: string = "en"): string {
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isInRange(day: Date, range: DateRange) {
  const t = startOfDay(day).getTime();
  return t >= startOfDay(range.start).getTime() && t <= startOfDay(range.end).getTime();
}

export function isRangeEdge(day: Date, range: DateRange) {
  return sameDay(day, range.start) || sameDay(day, range.end);
}

export function monthMatrix(view: Date): Date[][] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();
  const cells: Date[] = [];
  for (let i = startPad; i > 0; i -= 1) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), 1 - i));
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push(new Date(view.getFullYear(), view.getMonth() + 1, next));
    next += 1;
  }
  const rows: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function presetIdForRange(
  range: DateRange,
  now = new Date(),
): RangePresetId | "custom" {
  for (const preset of RANGE_PRESETS) {
    const p = rangeFromPreset(preset.id, now);
    if (sameDay(p.start, range.start) && sameDay(p.end, range.end)) {
      return preset.id;
    }
  }
  return "custom";
}

export function presetLabelForRange(
  range: DateRange,
  now = new Date(),
): string {
  const id = presetIdForRange(range, now);
  if (id === "custom") return "Custom";
  return RANGE_PRESETS.find((preset) => preset.id === id)?.label ?? "Custom";
}
