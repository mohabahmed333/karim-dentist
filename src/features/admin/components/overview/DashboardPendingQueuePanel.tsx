"use client";

import type { Reservation } from "@/services/reservations/types";
import { formatReservationWhen } from "@/services/reservations/stats";
import { DASHBOARD_LIST_LIMIT } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

type Props = {
  reservations: Reservation[];
  onPatientSelect?: (reservation: Reservation) => void;
};

export function DashboardPendingQueuePanel({
  reservations,
  onPatientSelect,
}: Props) {
  const t = useTranslations();
  const rows = reservations
    .filter((r) => !r.deleted_at && r.status === "pending")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, DASHBOARD_LIST_LIMIT);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3.5">
      <h2 className="mb-3 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.list.pendingTitle")}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.overview.list.pendingEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="w-full rounded-md px-2 py-1.5 text-start hover:bg-[var(--admin-hover)]"
                onClick={() => onPatientSelect?.(row)}
              >
                <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                  {row.patient_name}
                </p>
                <p className="truncate text-xs text-[var(--admin-muted)]">
                  {row.service_label} · {formatReservationWhen(row.starts_at)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
