"use client";

import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import type { Reservation } from "@/services/reservations/types";
import {
  isUpcomingReservation,
  statusBadgeClass,
} from "@/services/reservations/stats";
import { relativeTimeLabel } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

type Props = {
  reservations: Reservation[];
  onPatientSelect?: (reservation: Reservation) => void;
};

function statusLabel(
  status: string,
  t: (key: import("@/lib/i18n").AnyMessageKey) => string,
): string {
  switch (status) {
    case "pending":
      return t("admin.reservations.pending");
    case "confirmed":
      return t("admin.reservations.confirmed");
    case "cancelled":
      return t("admin.reservations.cancelled");
    case "completed":
      return t("admin.reservations.completed");
    case "no_show":
      return t("admin.reservations.noShow");
    default:
      return status;
  }
}

export function DashboardBookingsPanel({
  reservations,
  onPatientSelect,
}: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<"active" | "closed">("active");
  const active = useMemo(
    () =>
      reservations
        .filter((r) => isUpcomingReservation(r))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [reservations],
  );
  const closed = useMemo(
    () =>
      reservations
        .filter(
          (r) =>
            !r.deleted_at &&
            (r.status === "completed" ||
              r.status === "cancelled" ||
              new Date(r.starts_at) < new Date()),
        )
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
    [reservations],
  );
  const rows = (tab === "active" ? active : closed).slice(0, 8);

  return (
    <section className="admin-card flex h-full flex-col rounded-md border border-[var(--admin-border)] bg-white p-3.5">
      <div className="mb-3 flex items-center gap-4 border-b border-[var(--admin-border)] pb-2">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`pb-2 text-sm font-semibold ${
            tab === "active"
              ? "border-b-2 border-[var(--admin-primary)] text-[var(--admin-text)]"
              : "text-[var(--admin-muted)]"
          }`}
        >
          {t("admin.overview.active")} {active.length}
        </button>
        <button
          type="button"
          onClick={() => setTab("closed")}
          className={`pb-2 text-sm font-semibold ${
            tab === "closed"
              ? "border-b-2 border-[var(--admin-primary)] text-[var(--admin-text)]"
              : "text-[var(--admin-muted)]"
          }`}
        >
          {t("admin.overview.closed")} {closed.length}
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {rows.length === 0 ? (
          <li className="px-1 py-6 text-sm text-[var(--admin-muted)]">
            {t("admin.overview.noBookings")}
          </li>
        ) : (
          rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onPatientSelect?.(row)}
                className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-start hover:bg-[var(--admin-hover)]"
              >
                <span
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background:
                      "color-mix(in srgb, var(--admin-primary) 14%, white)",
                    color: "var(--admin-primary)",
                  }}
                >
                  {row.patient_name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                      {row.patient_name}
                    </p>
                    <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                      {relativeTimeLabel(row.updated_at || row.created_at)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[var(--admin-muted)]">
                    {row.service_label}
                  </p>
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(row.status)}`}
                  >
                    {row.status === "confirmed" ? (
                      <Calendar className="size-3" />
                    ) : null}
                    {statusLabel(row.status, t)}
                  </span>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
