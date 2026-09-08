"use client";

import type { ReservationStats } from "@/services/reservations/stats";
import { useTranslations } from "@/lib/i18n";

type Props = {
  serviceMix: ReservationStats["serviceMix"];
};

export function DashboardTopServicesPanel({ serviceMix }: Props) {
  const t = useTranslations();
  const rows = serviceMix.slice(0, 5);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3.5">
      <h2 className="mb-3 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.list.topServicesTitle")}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.overview.noBookingsYet")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((item) => (
            <li key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-[var(--admin-text)]">
                  {item.label}
                </span>
                <span className="shrink-0 tabular-nums text-[var(--admin-muted)]">
                  {item.count}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                <div
                  className="h-full rounded-full bg-[var(--admin-secondary)]"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
