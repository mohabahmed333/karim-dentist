"use client";

import type { ReservationStats } from "@/services/reservations/stats";
import { useLocale, useTranslations } from "@/lib/i18n";

type Props = {
  weekCounts: ReservationStats["weekCounts"];
  serviceMix: ReservationStats["serviceMix"];
};

export function DashboardCharts({ weekCounts, serviceMix }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const max = Math.max(...weekCounts.map((item) => item.count), 1);
  const mix = serviceMix.slice(0, 5);
  const weekdayLocale = locale === "ar" ? "ar" : "en";

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="admin-card rounded-md border border-[var(--admin-border)] bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-[var(--admin-text)]">
          {t("admin.overview.visitsWeek")}
        </h2>
        <div className="flex items-end gap-2">
          {weekCounts.map((item, index) => {
            const day = new Date();
            // weekCounts are Sun..Sat of current week starting weekStart (Sunday)
            const weekStart = startOfWeekMonday(new Date());
            weekStart.setDate(weekStart.getDate() + index);
            const label = weekStart.toLocaleDateString(weekdayLocale, {
              weekday: "short",
            });
            return (
              <div
                key={`${item.label}-${index}`}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="flex h-32 w-full items-end rounded-md px-1.5 pb-1.5 pt-2"
                  style={{
                    background:
                      "color-mix(in srgb, var(--admin-secondary) 12%, white)",
                  }}
                >
                  <div
                    className="w-full rounded-lg transition-[height]"
                    style={{
                      height: `${Math.max(10, (item.count / max) * 100)}%`,
                      background:
                        "linear-gradient(to top, color-mix(in srgb, var(--admin-secondary) 45%, white), var(--admin-secondary))",
                    }}
                    title={`${item.count}`}
                  />
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

      <section className="admin-card rounded-md border border-[var(--admin-border)] bg-white p-4">
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
          <ul className="mt-5 space-y-4">
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
                      marginInlineStart: 0,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}
