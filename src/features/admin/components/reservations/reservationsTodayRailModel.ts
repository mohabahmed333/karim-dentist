import type { Reservation } from "@/services/reservations/types";
import {
  addCalendarDays,
  reservationsForDay,
} from "@/features/admin/lib/dayScheduleModel";

export type NextThreeDayKey = "today" | "tomorrow" | "afterTomorrow";

export type NextThreeDayGroup = {
  key: NextThreeDayKey;
  items: Reservation[];
};

/** Today + tomorrow + day after (skip empty days). */
export function groupReservationsNextThreeDays(
  rows: Reservation[],
  now = new Date(),
): NextThreeDayGroup[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const days: { key: NextThreeDayKey; day: Date }[] = [
    { key: "today", day: start },
    { key: "tomorrow", day: addCalendarDays(start, 1) },
    { key: "afterTomorrow", day: addCalendarDays(start, 2) },
  ];
  return days
    .map(({ key, day }) => ({
      key,
      items: reservationsForDay(rows, day),
    }))
    .filter((g) => g.items.length > 0);
}
