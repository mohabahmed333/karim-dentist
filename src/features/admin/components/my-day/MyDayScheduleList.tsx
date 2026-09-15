"use client";

import type { CSSProperties } from "react";
import { statusBlockStyle } from "@/features/admin/lib/dayScheduleModel";
import type { Reservation } from "@/services/reservations/types";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  reservations: Reservation[];
  selectedId: string | null;
  /** The one the clock says is happening, marked even when another is selected. */
  nowId: string | null;
  onSelect: (reservation: Reservation) => void;
  /** Owner/front desk see whose patient each one is; a doctor already knows. */
  showDoctor?: boolean;
  doctorNameById?: Record<string, string>;
};

export function MyDayScheduleList({
  reservations,
  selectedId,
  nowId,
  onSelect,
  showDoctor = false,
  doctorNameById = {},
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (reservations.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
        {t("admin.myDay.noAppointments")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {reservations.map((reservation) => {
        const selected = reservation.id === selectedId;
        const isNow = reservation.id === nowId;
        const status = statusBlockStyle(reservation.status);
        const doctorName = reservation.doctor_id
          ? doctorNameById[reservation.doctor_id]
          : null;

        return (
          <li key={reservation.id}>
            <button
              type="button"
              onClick={() => onSelect(reservation)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-start transition",
                selected
                  ? "border-[var(--admin-primary)] ring-1 ring-[var(--admin-primary)]"
                  : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--admin-text)]">
                  {time.format(new Date(reservation.starts_at))}
                </span>
                {isNow ? (
                  <span className="shrink-0 rounded-full bg-[var(--admin-primary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {t("admin.myDay.now")}
                  </span>
                ) : (
                  <span
                    className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px]"
                    style={
                      {
                        background: status.background,
                        borderColor: status.border,
                        color: status.color,
                      } as CSSProperties
                    }
                  >
                    {reservation.status}
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-[var(--admin-text)]">
                {reservation.patient_name}
              </p>
              <p className="truncate text-[11px] text-[var(--admin-muted)]">
                {[reservation.service_label, showDoctor ? doctorName : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
