"use client";

import {
  formatReservationWhen,
  statusBadgeClass,
} from "@/services/reservations/stats";
import type { Reservation } from "@/services/reservations/types";
import { useLocale, useTranslations } from "@/lib/i18n";
import { ReservationServiceLabel } from "@/features/admin/components/ReservationServiceLabel";
import type { Service } from "@/services/services/types";
import {
  groupReservationsNextThreeDays,
  type NextThreeDayKey,
} from "./todayRailGrouping";

type Props = {
  reservations: Reservation[];
  onSelect: (id: string) => void;
  services?: Service[];
};

function statusLabel(
  status: string,
  t: (key: import("@/lib/i18n").AnyMessageKey) => string,
) {
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

function dayHeading(
  key: NextThreeDayKey,
  t: (key: import("@/lib/i18n").AnyMessageKey) => string,
) {
  if (key === "today") return t("admin.overview.today");
  if (key === "tomorrow") return t("admin.overview.tomorrow");
  return t("admin.overview.afterTomorrow");
}

export function ReservationsTodayRail({
  reservations,
  onSelect,
  services = [],
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const groups = groupReservationsNextThreeDays(reservations);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const countLabel =
    total === 1
      ? t("admin.reservations.appointmentCountOne").replace(
          "{count}",
          String(total),
        )
      : t("admin.reservations.appointmentsCount").replace(
          "{count}",
          String(total),
        );

  function timeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString(locale === "ar" ? "ar" : undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <div className="shrink-0 border-b border-[var(--admin-border)] px-4 py-3">
        <h3 className="text-[14px] font-semibold text-[var(--admin-text)]">
          {t("admin.reservations.nextThreeDays")}
        </h3>
        <p className="text-[12px] text-[var(--admin-muted)]">{countLabel}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-[var(--admin-muted)]">
            {t("admin.reservations.noAppointmentsNextThreeDays")}
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
                  {dayHeading(group.key, t)}
                </p>
                <ul className="space-y-2">
                  {group.items.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(row.id)}
                        className="flex w-full items-start gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-3 py-2.5 text-start transition hover:border-[var(--admin-primary)]/40"
                      >
                        <span className="w-12 shrink-0 pt-0.5 text-[12px] font-semibold tabular-nums text-[var(--admin-primary)]">
                          {timeLabel(row.starts_at)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-[var(--admin-text)]">
                            <ReservationServiceLabel
                              serviceId={row.service_id}
                              storedLabel={row.service_label}
                              services={services}
                            />
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-[var(--admin-muted)]">
                            {row.patient_name}
                          </span>
                          <span className="mt-1 block text-[10px] text-[var(--admin-muted)]">
                            {formatReservationWhen(row.starts_at)}
                          </span>
                        </span>
                        <span
                          className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(row.status)}`}
                        >
                          {statusLabel(row.status, t)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
