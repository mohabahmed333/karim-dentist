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
  /**
   * The current minute in epoch ms, from the view's clock. Null before
   * hydration — nothing is dimmed as past until the browser's clock is known,
   * which is also what keeps the server and client markup identical.
   */
  nowMs: number | null;
  onSelect: (reservation: Reservation) => void;
  /** Owner/front desk see whose patient each one is; a doctor already knows. */
  showDoctor?: boolean;
  doctorNameById?: Record<string, string>;
};

/**
 * The index the "Upcoming" divider goes before: the first appointment that has
 * not started yet and is not the one in the chair. -1 when the day is over, so
 * no divider is drawn at the end of the list.
 */
function firstUpcomingIndex(
  reservations: Reservation[],
  nowId: string | null,
  nowMs: number | null,
): number {
  if (nowMs === null) return -1;
  return reservations.findIndex(
    (row) => row.id !== nowId && new Date(row.starts_at).getTime() > nowMs,
  );
}

export function MyDayScheduleList({
  reservations,
  selectedId,
  nowId,
  nowMs,
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

  const upcomingAt = firstUpcomingIndex(reservations, nowId, nowMs);

  return (
    <ul className="flex flex-col gap-1">
      {reservations.map((reservation, index) => {
        const selected = reservation.id === selectedId;
        const isNow = reservation.id === nowId;
        const isPast =
          !isNow &&
          nowMs !== null &&
          new Date(reservation.starts_at).getTime() < nowMs;
        const status = statusBlockStyle(reservation.status);
        const doctorName = reservation.doctor_id
          ? doctorNameById[reservation.doctor_id]
          : null;

        return (
          <li key={reservation.id}>
            {index === upcomingAt && index > 0 ? (
              <div className="flex items-center gap-2 px-1 pb-1 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
                  {t("admin.myDay.upcoming")}
                </span>
                <span className="h-px flex-1 bg-[var(--admin-border)]" />
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onSelect(reservation)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border border-s-2 px-3 py-2.5 text-start transition",
                selected
                  ? "border-[var(--admin-primary)] bg-[color-mix(in_srgb,var(--admin-primary)_8%,transparent)]"
                  : "border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
                isNow && !selected && "border-s-[var(--admin-primary)]",
                isPast && !selected && "opacity-60",
              )}
            >
              {/* Time gutter: a fixed column so the rail reads as one timeline
                  rather than a ragged list of labels. */}
              <span className="flex w-11 shrink-0 flex-col items-start gap-1.5 pt-0.5">
                <span className="text-[13px] font-semibold tabular-nums text-[var(--admin-text)]">
                  {time.format(new Date(reservation.starts_at))}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "size-2 rounded-full border",
                    isNow && "animate-pulse motion-reduce:animate-none",
                  )}
                  style={
                    isNow
                      ? ({
                          background: "var(--admin-primary)",
                          borderColor: "var(--admin-primary)",
                        } as CSSProperties)
                      : ({
                          background: status.background,
                          borderColor: status.border,
                        } as CSSProperties)
                  }
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--admin-text)]">
                    {reservation.patient_name}
                  </span>
                  {isNow ? (
                    <span className="shrink-0 rounded-full bg-[var(--admin-primary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {t("admin.myDay.now")}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-[var(--admin-muted)]">
                  {[reservation.service_label, showDoctor ? doctorName : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span
                  className="mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px]"
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
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
