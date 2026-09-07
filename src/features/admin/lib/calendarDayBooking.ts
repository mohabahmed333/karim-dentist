export type CalendarDayBookingBlockReason = "past" | "no_slots";

/** Why a calendar day cannot open the new-reservation dialog, or null if bookable. */
export function calendarDayBookingBlockReason(
  dayIso: string,
  todayIso: string,
  openSlotDays: ReadonlySet<string>,
): CalendarDayBookingBlockReason | null {
  if (dayIso < todayIso) return "past";
  if (!openSlotDays.has(dayIso)) return "no_slots";
  return null;
}

export function localTodayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function openSlotDaySet(
  slots: ReadonlyArray<{ starts_at: string }>,
): Set<string> {
  const days = new Set<string>();
  for (const slot of slots) {
    days.add(localTodayIso(new Date(slot.starts_at)));
  }
  return days;
}
