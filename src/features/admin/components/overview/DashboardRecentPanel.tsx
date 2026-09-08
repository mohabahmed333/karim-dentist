"use client";

import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { relativeTimeLabel, DASHBOARD_LIST_LIMIT } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";
import { ReservationServiceLabel } from "@/features/admin/components/ReservationServiceLabel";

type Props = {
  reservations: Reservation[];
  services?: Service[];
  onPatientSelect?: (reservation: Reservation) => void;
};

export function DashboardRecentPanel({
  reservations,
  services = [],
  onPatientSelect,
}: Props) {
  const t = useTranslations();
  const recent = [...reservations]
    .filter((r) => !r.deleted_at)
    .sort((a, b) =>
      (b.updated_at || b.created_at).localeCompare(
        a.updated_at || a.created_at,
      ),
    )
    .slice(0, DASHBOARD_LIST_LIMIT);
  const unreadish = recent.filter((r) => r.status === "pending").length;

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3.5">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">
          {t("admin.overview.recentActivity")}
        </h2>
        {unreadish > 0 ? (
          <span className="rounded-full bg-[#EF4444] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadish}
          </span>
        ) : null}
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {recent.length === 0 ? (
          <li className="py-6 text-sm text-[var(--admin-muted)]">
            {t("admin.overview.noRecent")}
          </li>
        ) : (
          recent.map((row) => {
            const pending = row.status === "pending";
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onPatientSelect?.(row)}
                  className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-start hover:bg-[var(--admin-hover)]"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--admin-hover)] text-xs font-semibold text-[var(--admin-muted)]">
                    {row.patient_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                        {row.patient_name}
                      </p>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--admin-muted)]">
                        {pending ? (
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: "var(--admin-secondary)" }}
                          />
                        ) : (
                          <span className="text-[var(--admin-muted)]">✓✓</span>
                        )}
                        {relativeTimeLabel(row.updated_at || row.created_at)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[var(--admin-muted)]">
                      <ReservationServiceLabel
                        serviceId={row.service_id}
                        storedLabel={row.service_label}
                        services={services}
                      />{" "}
                      · {row.phone}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
                      {row.notes?.trim() || t("admin.overview.noNotes")}
                    </p>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
