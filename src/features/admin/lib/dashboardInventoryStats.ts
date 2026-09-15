import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

export type InventoryWeekConsumptionPoint = { label: string; amount: number };

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Consumption cost (EGP) per day, Monday–Sunday, for the week containing `now`. */
export function buildWeekConsumptionChart(
  rows: WeekConsumptionRow[],
  now = new Date(),
): InventoryWeekConsumptionPoint[] {
  const weekStart = startOfWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const amount = rows
      .filter((row) => isSameDay(new Date(row.date), day))
      .reduce((sum, row) => sum + row.cost, 0);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      amount,
    };
  });
}
