import type { Reservation } from "@/services/reservations/types";
import {
  buildReservationStats,
  isUpcomingReservation,
} from "@/services/reservations/stats";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

export function greetingKeyForHour(hour: number): AdminMessageKey {
  if (hour < 12) return "admin.overview.goodMorning";
  if (hour < 17) return "admin.overview.goodAfternoon";
  return "admin.overview.goodEvening";
}

/** @deprecated use greetingKeyForHour + t() */
export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function firstNameFromEmail(email: string | null | undefined): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "there";
  const part = local.split(/[._-]/)[0] ?? local;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export function relativeTimeLabel(iso: string, now = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const mins = Math.round(Math.abs(diffMs) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nextAppointmentLine(
  reservations: Reservation[],
  now = new Date(),
): string | null {
  const next = reservations
    .filter((r) => isUpcomingReservation(r, now))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  if (!next) return null;
  const starts = new Date(next.starts_at);
  const mins = Math.round((starts.getTime() - now.getTime()) / 60_000);
  const inLabel =
    mins < 60
      ? `in ${Math.max(1, mins)}m`
      : `in ${Math.round(mins / 60)}h`;
  const when = isSameCalendarDay(starts, now)
    ? `today at ${formatClock(next.starts_at)}`
    : starts.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  return `${next.patient_name} · ${next.service_label} ${when} (${inLabel})`;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type AttentionItem = {
  id: string;
  titleKey: AdminMessageKey;
  detail: string;
  urgency: string;
  href: string;
  tone: "blue" | "orange" | "violet";
};

export function buildAttentionItems(
  reservations: Reservation[],
  now = new Date(),
): AttentionItem[] {
  const active = reservations.filter((r) => !r.deleted_at);
  const pending = active.filter((r) => r.status === "pending");
  const todayUpcoming = active.filter(
    (r) =>
      isSameCalendarDay(new Date(r.starts_at), now) &&
      new Date(r.starts_at) >= now &&
      r.status !== "cancelled",
  );
  const items: AttentionItem[] = [];
  if (pending.length) {
    items.push({
      id: "pending",
      titleKey: "admin.overview.attention.pending",
      detail: `${pending.length}`,
      urgency: pending.length > 3 ? "urgent" : "review",
      href: "/admin/reservations",
      tone: "orange",
    });
  }
  if (todayUpcoming.length) {
    items.push({
      id: "today",
      titleKey: "admin.overview.attention.today",
      detail: `${todayUpcoming.length}`,
      urgency: "today",
      href: "/admin/reservations",
      tone: "blue",
    });
  }
  const cancelled = active.filter((r) => r.status === "cancelled");
  if (cancelled.length) {
    items.push({
      id: "cancelled",
      titleKey: "admin.overview.attention.cancelled",
      detail: `${cancelled.length}`,
      urgency: "follow-up",
      href: "/admin/reservations",
      tone: "violet",
    });
  }
  const noShows = active.filter((r) => r.status === "no_show");
  if (noShows.length) {
    items.push({
      id: "noShow",
      titleKey: "admin.overview.attention.noShow",
      detail: `${noShows.length}`,
      urgency: "review",
      href: "/admin/reservations",
      tone: "orange",
    });
  }
  return items;
}

export type DashboardKpi = {
  labelKey: AdminMessageKey;
  value: string;
  trend: string;
  up: boolean;
};

/** Max rows shown in home list panels (bookings, recent, schedule, messages). */
export const DASHBOARD_LIST_LIMIT = 5;

export function buildDashboardKpis(
  reservations: Reservation[],
  serviceCount: number,
  unreadChats = 0,
  now = new Date(),
): DashboardKpi[] {
  const stats = buildReservationStats(reservations, now);
  const delta = stats.todayCount - stats.yesterdayCount;
  return [
    {
      labelKey: "admin.overview.kpi.todayVisits",
      value: String(stats.todayCount),
      trend: delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta}`,
      up: delta >= 0,
    },
    {
      labelKey: "admin.overview.kpi.pending",
      value: String(stats.pendingCount),
      trend: "—",
      up: stats.pendingCount === 0,
    },
    {
      labelKey: "admin.overview.kpi.confirmedWeek",
      value: String(stats.confirmedThisWeek),
      trend: "—",
      up: true,
    },
    {
      labelKey: "admin.overview.kpi.services",
      value: String(serviceCount),
      trend: "—",
      up: true,
    },
    {
      labelKey: "admin.overview.kpi.cancelled",
      value: String(stats.cancelledCount),
      trend: "—",
      up: stats.cancelledCount === 0,
    },
    {
      labelKey: "admin.overview.kpi.noShow",
      value: String(stats.noShowCount),
      trend: "—",
      up: stats.noShowCount === 0,
    },
    {
      labelKey: "admin.overview.kpi.completed",
      value: String(stats.completedCount),
      trend: "—",
      up: true,
    },
    {
      labelKey: "admin.overview.kpi.tomorrow",
      value: String(stats.tomorrowCount),
      trend: "—",
      up: true,
    },
    {
      labelKey: "admin.overview.kpi.weekTotal",
      value: String(stats.weekTotalCount),
      trend: "—",
      up: true,
    },
    {
      labelKey: "admin.overview.kpi.unreadChats",
      value: String(unreadChats),
      trend: "—",
      up: unreadChats === 0,
    },
  ];
}

export function groupUpcomingByDay(
  reservations: Reservation[],
  now = new Date(),
  limit = DASHBOARD_LIST_LIMIT,
) {
  const upcoming = reservations
    .filter((r) => isUpcomingReservation(r, now))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, limit);

  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(tomorrow);
  afterTomorrow.setDate(afterTomorrow.getDate() + 1);

  const groups: { label: string; items: Reservation[] }[] = [];
  for (const row of upcoming) {
    const d = new Date(row.starts_at);
    const label = isSameCalendarDay(d, now)
      ? "Today"
      : isSameCalendarDay(d, tomorrow)
        ? "Tomorrow"
        : isSameCalendarDay(d, afterTomorrow)
          ? "Day after tomorrow"
          : d.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
            });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(row);
    else groups.push({ label, items: [row] });
  }
  return groups;
}
