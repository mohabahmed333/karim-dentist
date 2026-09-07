import type { Reservation } from "@/services/reservations/types";
import type { ReservationStatus } from "@/services/reservations/types";

export const DAY_SCHEDULE_START_HOUR = 8;
export const DAY_SCHEDULE_END_HOUR = 20;
export const DAY_SCHEDULE_SLOT_MS = 60 * 60_000;
export const DAY_SCHEDULE_PX_PER_HOUR = 56;

export type DayScheduleBlock = {
  reservation: Reservation;
  lane: number;
  topPx: number;
  heightPx: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addCalendarDays(d: Date, days: number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function reservationsForDay(
  reservations: Reservation[],
  day: Date,
): Reservation[] {
  return reservations
    .filter((r) => !r.deleted_at && r.status !== "cancelled")
    .filter((r) => isSameCalendarDay(new Date(r.starts_at), day))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function dayScheduleHours(): number[] {
  const hours: number[] = [];
  for (let h = DAY_SCHEDULE_START_HOUR; h <= DAY_SCHEDULE_END_HOUR; h += 1) {
    hours.push(h);
  }
  return hours;
}

export function formatHourLabel(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function packDayBlocks(rows: Reservation[]): {
  blocks: DayScheduleBlock[];
  laneCount: number;
} {
  const dayStartMs =
    DAY_SCHEDULE_START_HOUR * 60 * 60_000;
  const laneEnds: number[] = [];
  const blocks: DayScheduleBlock[] = [];

  for (const reservation of rows) {
    const start = new Date(reservation.starts_at);
    const startMs =
      start.getHours() * 60 * 60_000 +
      start.getMinutes() * 60_000 +
      start.getSeconds() * 1000;
    const endMs = startMs + DAY_SCHEDULE_SLOT_MS;
    let lane = laneEnds.findIndex((end) => end <= startMs);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(endMs);
    } else {
      laneEnds[lane] = endMs;
    }
    const topPx =
      ((startMs - dayStartMs) / (60 * 60_000)) * DAY_SCHEDULE_PX_PER_HOUR;
    const heightPx =
      (DAY_SCHEDULE_SLOT_MS / (60 * 60_000)) * DAY_SCHEDULE_PX_PER_HOUR - 4;
    blocks.push({
      reservation,
      lane,
      topPx: Math.max(0, topPx),
      heightPx: Math.max(28, heightPx),
    });
  }

  return { blocks, laneCount: Math.max(1, laneEnds.length) };
}

export function statusBlockStyle(status: ReservationStatus): {
  background: string;
  border: string;
  color: string;
} {
  switch (status) {
    case "confirmed":
      return {
        background: "color-mix(in srgb, var(--admin-primary) 14%, white)",
        border: "color-mix(in srgb, var(--admin-primary) 35%, white)",
        color: "var(--admin-text)",
      };
    case "pending":
      return {
        background: "color-mix(in srgb, var(--admin-secondary) 18%, white)",
        border: "color-mix(in srgb, var(--admin-secondary) 40%, white)",
        color: "var(--admin-text)",
      };
    case "completed":
      return {
        background: "var(--admin-hover)",
        border: "var(--admin-border)",
        color: "var(--admin-text)",
      };
    case "no_show":
      return {
        background: "color-mix(in srgb, var(--admin-muted) 12%, white)",
        border: "var(--admin-border)",
        color: "var(--admin-muted)",
      };
    default:
      return {
        background: "var(--admin-canvas)",
        border: "var(--admin-border)",
        color: "var(--admin-muted)",
      };
  }
}

export function dayScheduleTitle(day: Date, today = new Date()): string {
  if (isSameCalendarDay(day, today)) return "Today";
  return day.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
