"use client";

import type { Reservation } from "@/services/reservations/types";
import { formatClock } from "@/features/admin/lib/dashboardModel";
import { DASHBOARD_LIST_LIMIT } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

type Props = {
  reservations: Reservation[];
  onPatientSelect?: (reservation: Reservation) => void;
};

function isToday(iso: string, now = new Date()) {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function DashboardTodayPatientsPanel({
  reservations,
  onPatientSelect,
}: Props) {
  const t = useTranslations();
  const rows = reservations
    .filter((r) => !r.deleted_at && isToday(r.starts_at) && r.status !== "cancelled")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, DASHBOARD_LIST_LIMIT);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3.5">
      <h2 className="mb-3 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.list.todayTitle")}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.overview.list.todayEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start hover:bg-[var(--admin-hover)]"
                onClick={() => onPatientSelect?.(row)}
              >
                <span className="min-w-0 truncate text-sm font-medium text-[var(--admin-text)]">
                  {row.patient_name}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                  {formatClock(row.starts_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
