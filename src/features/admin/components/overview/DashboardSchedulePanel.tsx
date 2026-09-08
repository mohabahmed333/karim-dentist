"use client";

import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import {
  formatClock,
  groupUpcomingByDay,
} from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";
import { ReservationServiceLabel } from "@/features/admin/components/ReservationServiceLabel";

const bars = [
  "var(--admin-secondary)",
  "var(--admin-primary)",
  "#8B5CF6",
  "#10B981",
  "#F97316",
];

type Props = {
  reservations: Reservation[];
  services?: Service[];
  onPatientSelect?: (reservation: Reservation) => void;
};

export function DashboardSchedulePanel({
  reservations,
  services = [],
  onPatientSelect,
}: Props) {
  const t = useTranslations();
  const groups = groupUpcomingByDay(reservations);
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3.5">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">
          {t("admin.overview.upcomingSchedule")}
        </h2>
        <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-xs font-medium text-[#4B5563]">
          {count}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="py-6 text-sm text-[var(--admin-muted)]">
            {t("admin.overview.nothingScheduled")}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-medium text-[var(--admin-muted)]">
                {group.label === "Today"
                  ? t("admin.overview.today")
                  : group.label === "Tomorrow"
                    ? t("admin.overview.tomorrow")
                    : group.label === "Day after tomorrow"
                      ? t("admin.overview.afterTomorrow")
                      : group.label}
              </p>
              <ul className="space-y-2">
                {group.items.map((row, i) => {
                  const start = new Date(row.starts_at);
                  const end = new Date(start.getTime() + 60 * 60_000);
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => onPatientSelect?.(row)}
                        className="flex w-full gap-3 rounded-md px-1 py-1.5 text-start hover:bg-[var(--admin-hover)]"
                      >
                        <span
                          className="mt-1 w-1 shrink-0 rounded-full"
                          style={{ background: bars[i % bars.length] }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--admin-muted)]">
                            <ReservationServiceLabel
                              serviceId={row.service_id}
                              storedLabel={row.service_label}
                              services={services}
                            />{" "}
                            · {row.phone}
                          </p>
                          <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                            {row.patient_name}
                          </p>
                          <p className="text-xs text-[var(--admin-muted)]">
                            {formatClock(row.starts_at)} –{" "}
                            {formatClock(end.toISOString())}{" "}
                            {t("admin.overview.duration1h")}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
