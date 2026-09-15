import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

export type ConsumptionTrendPoint = { label: string; amount: number };

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daySpan(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000)) + 1;
}

/** Consumption cost (EGP) per day across [from, to] inclusive — a rolling window, not calendar-aligned. */
export function buildConsumptionTrendChart(
  rows: WeekConsumptionRow[],
  from: Date,
  to: Date,
): ConsumptionTrendPoint[] {
  const start = startOfDay(from);
  const days = Math.max(1, daySpan(from, to));
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const amount = rows
      .filter((row) => isSameDay(new Date(row.date), day))
      .reduce((sum, row) => sum + row.cost, 0);
    return {
      label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      amount,
    };
  });
}
