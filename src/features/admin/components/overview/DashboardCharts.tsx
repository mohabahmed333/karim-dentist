"use client";

import type { ReservationStats } from "@/services/reservations/stats";
import type { ReservationStatus } from "@/services/reservations/types";
import { useLocale, useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

const STATUS_COLOR: Record<ReservationStatus, string> = {
  pending: "#EA580C",
  confirmed: "#0F766E",
  completed: "#6366F1",
  cancelled: "#DC2626",
  no_show: "#D97706",
};

const STATUS_LABEL: Record<ReservationStatus, AdminMessageKey> = {
  pending: "admin.overview.chart.status.pending",
  confirmed: "admin.overview.chart.status.confirmed",
  completed: "admin.overview.chart.status.completed",
  cancelled: "admin.overview.chart.status.cancelled",
  no_show: "admin.overview.chart.status.noShow",
};

export function ChartVisitsWeek({
  weekCounts,
}: {
  weekCounts: ReservationStats["weekCounts"];
}) {
  const t = useTranslations();
  const { locale } = useLocale();
  const maxWeek = Math.max(...weekCounts.map((item) => item.count), 1);
  const weekdayLocale = locale === "ar" ? "ar" : "en";

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-3 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.visitsWeek")}
      </h2>
      <div className="grid min-h-[12rem] min-w-0 flex-1 grid-cols-7 gap-2">
        {weekCounts.map((item, index) => {
          const weekStart = startOfWeekMonday(new Date());
          weekStart.setDate(weekStart.getDate() + index);
          const label = weekStart.toLocaleDateString(weekdayLocale, {
            weekday: "short",
          });
          const barPct = Math.max(
            item.count === 0 ? 4 : 10,
            (item.count / maxWeek) * 100,
          );
          return (
            <div
              key={`${item.label}-${index}`}
              className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto_auto] justify-items-center gap-1.5"
            >
              <div
                className="relative w-full min-h-0 self-stretch rounded-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-secondary) 12%, white)",
                }}
              >
                <div className="absolute inset-x-1.5 bottom-1.5 top-2 flex items-end">
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: `${barPct}%`,
                      background:
                        "linear-gradient(to top, color-mix(in srgb, var(--admin-secondary) 45%, white), var(--admin-secondary))",
                    }}
                    title={`${item.count}`}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--admin-muted)]">
                {label}
              </span>
              <span className="text-xs font-semibold text-[var(--admin-text)]">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ChartBookingMix({
  serviceMix,
}: {
  serviceMix: ReservationStats["serviceMix"];
}) {
  const t = useTranslations();
  const mix = serviceMix.slice(0, 5);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.bookingMix")}
      </h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.bookingMixDesc")}
      </p>
      {mix.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--admin-muted)]">
          {t("admin.overview.noBookingsYet")}
        </p>
      ) : (
        <ul className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {mix.map((item) => (
            <li key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-[var(--admin-text)]">
                  {item.label}
                </span>
                <span className="shrink-0 text-sm font-semibold text-[var(--admin-text)]">
                  {item.percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#ECEEF3]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, item.percent)}%`,
                    background: "var(--admin-primary)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ChartStatusMix({
  statusMix,
}: {
  statusMix: ReservationStats["statusMix"];
}) {
  const t = useTranslations();
  const statusTotal = statusMix.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <section className="admin-card h-full min-h-0 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.statusTitle")}
      </h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.statusDesc")}
      </p>
      {statusMix.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--admin-muted)]">
          {t("admin.overview.noBookingsYet")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="mx-auto size-36 shrink-0 rounded-full"
            style={{ background: conicGradient(statusMix, statusTotal) }}
            role="img"
            aria-label={t("admin.overview.chart.statusTitle")}
          />
          <ul className="min-w-0 flex-1 space-y-2.5">
            {statusMix.map((item) => (
              <li
                key={item.status}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: STATUS_COLOR[item.status] }}
                  />
                  <span className="truncate text-[var(--admin-text)]">
                    {t(STATUS_LABEL[item.status])}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--admin-text)]">
                  {item.count}
                  <span className="ms-1 font-normal text-[var(--admin-muted)]">
                    ({item.percent}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ChartBusyHours({
  hourCounts,
}: {
  hourCounts: ReservationStats["hourCounts"];
}) {
  const t = useTranslations();
  const maxHour = Math.max(...hourCounts.map((item) => item.count), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.busyHours")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.busyHoursDesc")}
      </p>
      <div
        className="grid min-h-[12rem] min-w-0 flex-1 gap-1"
        style={{
          gridTemplateColumns: `repeat(${hourCounts.length}, minmax(0, 1fr))`,
        }}
      >
        {hourCounts.map((item) => {
          const barPct = Math.max(6, (item.count / maxHour) * 100);
          return (
            <div
              key={item.hour}
              className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] justify-items-center gap-1.5"
            >
              <div
                className="relative w-full min-h-0 self-stretch rounded-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-primary) 10%, white)",
                }}
              >
                <div className="absolute inset-x-0.5 bottom-1 top-1.5 flex items-end">
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${barPct}%`,
                      background: "var(--admin-primary)",
                      opacity: item.count === 0 ? 0.25 : 1,
                    }}
                    title={`${item.hour}:00 — ${item.count}`}
                  />
                </div>
              </div>
              <span className="text-[9px] tabular-nums text-[var(--admin-muted)]">
                {item.hour}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ChartDayTrend({
  dayTrend,
}: {
  dayTrend: ReservationStats["dayTrend"];
}) {
  const t = useTranslations();
  const maxTrend = Math.max(...dayTrend.map((item) => item.count), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.dayTrend")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.dayTrendDesc")}
      </p>
      <div className="relative min-h-[12rem] min-w-0 flex-1">
        <div className="absolute inset-0 flex items-end gap-px sm:gap-0.5">
          {dayTrend.map((item) => (
            <div
              key={item.dateKey}
              className="relative h-full min-w-0 flex-1"
              title={`${item.dateKey}: ${item.count}`}
            >
              <div className="absolute inset-x-0 bottom-0 top-0 flex items-end">
                <div
                  className="w-full min-h-1 rounded-t-sm"
                  style={{
                    height: `${Math.max(
                      item.count === 0 ? 4 : 8,
                      (item.count / maxTrend) * 100,
                    )}%`,
                    background:
                      "linear-gradient(to top, color-mix(in srgb, var(--admin-secondary) 40%, white), var(--admin-secondary))",
                    opacity: item.count === 0 ? 0.2 : 1,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex shrink-0 justify-between text-[10px] text-[var(--admin-muted)]">
        <span>{dayTrend[0]?.dateKey}</span>
        <span>{dayTrend[dayTrend.length - 1]?.dateKey}</span>
      </div>
    </section>
  );
}

function conicGradient(
  statusMix: ReservationStats["statusMix"],
  total: number,
): string {
  let cursor = 0;
  const stops: string[] = [];
  for (const item of statusMix) {
    const start = cursor;
    cursor += (item.count / total) * 360;
    stops.push(
      `${STATUS_COLOR[item.status]} ${start.toFixed(1)}deg ${cursor.toFixed(1)}deg`,
    );
  }
  if (stops.length === 0) return "#ECEEF3";
  return `conic-gradient(${stops.join(", ")})`;
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}
