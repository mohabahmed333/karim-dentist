import type { WeekPaymentRow } from "@/services/patient_billing/types";

export type WeekRevenuePoint = { label: string; amount: number };
export type PaymentMethodMixItem = { method: string; amount: number; percent: number };

const KNOWN_METHODS = new Set(["cash", "card", "instapay", "deposit", "whatsapp"]);
const METHOD_ORDER = ["cash", "card", "instapay", "deposit", "whatsapp", "other"] as const;

function normalizeMethod(method: string | null): string {
  if (!method) return "other";
  return KNOWN_METHODS.has(method) ? method : "other";
}

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

/** EGP collected per day, Monday–Sunday, for the week containing `now`. */
export function buildBillingWeekRevenue(
  rows: WeekPaymentRow[],
  now = new Date(),
): WeekRevenuePoint[] {
  const weekStart = startOfWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const amount = rows
      .filter((row) => isSameDay(new Date(row.date), day))
      .reduce((sum, row) => sum + row.amount, 0);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      amount,
    };
  });
}

/** Share of this week's revenue by payment method, fixed order, zero-amount methods dropped. */
export function buildPaymentMethodMix(rows: WeekPaymentRow[]): PaymentMethodMixItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const method = normalizeMethod(row.method);
    totals.set(method, (totals.get(method) ?? 0) + row.amount);
  }
  const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1;
  return METHOD_ORDER.map((method) => {
    const amount = totals.get(method) ?? 0;
    return { method, amount, percent: Math.round((amount / total) * 100) };
  }).filter((item) => item.amount > 0);
}
