"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Reservation } from "@/services/reservations/types";
import {
  addCalendarDays,
  dayScheduleTitle,
  isSameCalendarDay,
  packDayBlocks,
  reservationsForDay,
} from "@/features/admin/lib/dayScheduleModel";
import { useTranslations } from "@/lib/i18n";
import { DayScheduleGrid } from "./DayScheduleGrid";

type Props = {
  reservations: Reservation[];
  onPatientSelect?: (reservation: Reservation) => void;
};

export function DashboardDaySchedule({
  reservations,
  onPatientSelect,
}: Props) {
  const t = useTranslations();
  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const rows = useMemo(
    () => reservationsForDay(reservations, day),
    [reservations, day],
  );
  const { blocks, laneCount } = useMemo(() => packDayBlocks(rows), [rows]);

  const dayLabel = isSameCalendarDay(day, new Date())
    ? t("admin.overview.today")
    : dayScheduleTitle(day);
  const bookingsLabel =
    rows.length === 1
      ? t("admin.overview.bookingCountOne").replace("{count}", String(rows.length))
      : t("admin.overview.bookingsCount").replace("{count}", String(rows.length));

  const legend = [
    {
      id: "confirmed",
      label: t("admin.reservations.confirmed"),
      tone: "var(--admin-primary)",
    },
    {
      id: "pending",
      label: t("admin.reservations.pending"),
      tone: "var(--admin-secondary)",
    },
    {
      id: "completed",
      label: t("admin.reservations.completed"),
      tone: "var(--admin-muted)",
    },
  ] as const;

  return (
    <section className="admin-card overflow-hidden rounded-md border border-[var(--admin-border)] bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--admin-text)]">
            {t("admin.overview.daySchedule")}
          </h2>
          <p className="text-[12px] text-[var(--admin-muted)]">
            {dayLabel} · {t("admin.overview.appointmentsChart")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t("admin.overview.prevDay")}
            onClick={() => setDay((d) => addCalendarDays(d, -1))}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            aria-label={t("admin.overview.nextDay")}
            onClick={() => setDay((d) => addCalendarDays(d, 1))}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-[11px] text-[var(--admin-muted)]">
        {legend.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: item.tone }}
            />
            {item.label}
          </span>
        ))}
        <span className="ms-auto">{bookingsLabel}</span>
      </div>

      <DayScheduleGrid
        blocks={blocks}
        laneCount={laneCount}
        empty={rows.length === 0}
        emptyLabel={t("admin.overview.noAppointmentsDay")}
        onPatientSelect={onPatientSelect}
      />
    </section>
  );
}
