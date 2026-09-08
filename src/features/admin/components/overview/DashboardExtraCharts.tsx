"use client";

import type { ReservationStats } from "@/services/reservations/stats";
import { useTranslations } from "@/lib/i18n";

export function ChartWeekCompare({
  weekCounts,
  lastWeekCounts,
}: {
  weekCounts: ReservationStats["weekCounts"];
  lastWeekCounts: ReservationStats["lastWeekCounts"];
}) {
  const t = useTranslations();
  const max = Math.max(
    1,
    ...weekCounts.map((d) => d.count),
    ...lastWeekCounts.map((d) => d.count),
  );

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.weekCompare")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.weekCompareDesc")}
      </p>
      <div className="grid min-h-[10rem] min-w-0 flex-1 grid-cols-7 gap-2">
        {weekCounts.map((item, index) => {
          const prev = lastWeekCounts[index]?.count ?? 0;
          return (
            <div
              key={`${item.label}-${index}`}
              className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] justify-items-center gap-1"
            >
              <div className="flex w-full min-h-0 items-end justify-center gap-0.5 self-stretch">
                <div
                  className="w-1/2 rounded-t-sm bg-[color-mix(in_srgb,var(--admin-muted)_35%,white)]"
                  style={{ height: `${Math.max(6, (prev / max) * 100)}%` }}
                  title={`${t("admin.overview.chart.lastWeek")}: ${prev}`}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-[var(--admin-secondary)]"
                  style={{ height: `${Math.max(6, (item.count / max) * 100)}%` }}
                  title={`${t("admin.overview.chart.thisWeek")}: ${item.count}`}
                />
              </div>
              <span className="text-[10px] text-[var(--admin-muted)]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ChartCancelRate({
  cancelRatePercent,
  cancelledCount,
}: {
  cancelRatePercent: number;
  cancelledCount: number;
}) {
  const t = useTranslations();
  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.cancelRate")}
      </h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.cancelRateDesc")}
      </p>
      <div className="mt-6 flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        <p className="text-4xl font-semibold tabular-nums text-[var(--admin-text)]">
          {cancelRatePercent}%
        </p>
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.overview.chart.cancelRateCount").replace(
            "{count}",
            String(cancelledCount),
          )}
        </p>
        <div className="h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-[var(--admin-hover)]">
          <div
            className="h-full rounded-full bg-[#DC2626]"
            style={{ width: `${Math.min(100, cancelRatePercent)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export function ChartServiceRank({
  serviceMix,
}: {
  serviceMix: ReservationStats["serviceMix"];
}) {
  const t = useTranslations();
  const rows = serviceMix.slice(0, 6);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.serviceRank")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.serviceRankDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.overview.noBookingsYet")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((item, index) => (
            <li key={item.label} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--admin-text)]">
                    {item.label}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-primary)]"
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
