import type { Reservation, ReservationStatus } from "./types";

export type ReservationStats = {
  todayCount: number;
  yesterdayCount: number;
  pendingCount: number;
  confirmedThisWeek: number;
  cancelledCount: number;
  weekCounts: { label: string; count: number }[];
  serviceMix: { label: string; count: number; percent: number }[];
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

export function countReservationsForDay(
  reservations: Reservation[],
  day: Date,
): number {
  return reservations.filter((row) =>
    isSameDay(new Date(row.starts_at), day),
  ).length;
}

export function buildReservationStats(
  reservations: Reservation[],
  now = new Date(),
): ReservationStats {
  const active = reservations.filter((row) => row.deleted_at === null);
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = startOfWeek(now);

  const todayCount = countReservationsForDay(active, today);
  const yesterdayCount = countReservationsForDay(active, yesterday);
  const pendingCount = active.filter((row) => row.status === "pending").length;
  const confirmedThisWeek = active.filter((row) => {
    const starts = new Date(row.starts_at);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return row.status === "confirmed" && starts >= weekStart && starts <= weekEnd;
  }).length;
  const cancelledCount = active.filter(
    (row) => row.status === "cancelled",
  ).length;

  const weekCounts = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      count: countReservationsForDay(active, day),
    };
  });

  const serviceTotals = new Map<string, number>();
  for (const row of active) {
    serviceTotals.set(
      row.service_label,
      (serviceTotals.get(row.service_label) ?? 0) + 1,
    );
  }
  const total = active.length || 1;
  const serviceMix = [...serviceTotals.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    todayCount,
    yesterdayCount,
    pendingCount,
    confirmedThisWeek,
    cancelledCount,
    weekCounts,
    serviceMix,
  };
}

export function filterReservationsByStatus(
  reservations: Reservation[],
  filter: "upcoming" | "today" | "pending" | "all",
  now = new Date(),
): Reservation[] {
  const active = reservations.filter((row) => row.deleted_at === null);
  if (filter === "all") return active;
  if (filter === "pending") {
    return active.filter((row) => row.status === "pending");
  }
  if (filter === "today") {
    return active.filter((row) => isSameDay(new Date(row.starts_at), now));
  }
  return active.filter((row) => {
    const starts = new Date(row.starts_at);
    return starts >= now && row.status !== "cancelled";
  });
}

export function formatReservationWhen(startsAt: string): string {
  const date = new Date(startsAt);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusBadgeClass(status: ReservationStatus): string {
  switch (status) {
    case "pending":
      return "bg-[#c9a962]/15 text-[#0f2744]";
    case "confirmed":
      return "bg-[#0f2744] text-white";
    case "completed":
      return "bg-[#e6e8ec] text-[#0f2744]";
    case "cancelled":
      return "bg-red-50 text-red-700";
    case "no_show":
      return "bg-orange-50 text-orange-800";
    default:
      return "bg-[#e6e8ec] text-[#0f2744]";
  }
}

export function isUpcomingReservation(
  row: Reservation,
  now = new Date(),
): boolean {
  return (
    new Date(row.starts_at) >= now &&
    row.status !== "cancelled" &&
    row.status !== "no_show"
  );
}

export function dayBounds(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) };
}
