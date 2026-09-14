"use client";

import type { Reservation } from "@/services/reservations/types";
import { type CalendarGridDay } from "@/services/reservations/timeline";
import { useLocale } from "@/lib/i18n";
import { CalendarDayCell } from "./CalendarDayCell";
import { TooltipProvider } from "@/components/ui/tooltip";

type Props = {
  days: CalendarGridDay[];
  eventsByDay: Map<string, Reservation[]>;
  selectedDayIso: string | null;
  selectedReservationId: string | null;
  eventLabel: (reservation: Reservation) => string;
  doctorColorById?: Record<string, string>;
  doctorNameById?: Record<string, string>;
  onSelectDay: (iso: string) => void;
  onSelectReservation: (id: string) => void;
  onMoveReservation: (reservationId: string, targetDate: string) => void;
  movingReservationId: string | null;
};

/** Monday-first weekday labels, localized. */
function weekdayLabels(locale: string): string[] {
  // 2024-01-01 is a Monday
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toLocaleDateString(locale === "ar" ? "ar" : "en", {
      weekday: "short",
    });
  });
}

export function CalendarMonthGrid({
  days,
  eventsByDay,
  selectedDayIso,
  selectedReservationId,
  eventLabel,
  doctorColorById,
  doctorNameById,
  onSelectDay,
  onSelectReservation,
  onMoveReservation,
  movingReservationId,
}: Props) {
  const { locale } = useLocale();
  const labels = weekdayLabels(locale);

  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
        <div className="grid grid-cols-7 border-b border-[var(--admin-border)] bg-[var(--admin-panel)]">
          {labels.map((label) => (
            <div
              key={label}
              className="border-e border-[var(--admin-border)] px-2 py-2.5 text-center text-xs font-medium text-[var(--admin-muted)] last:border-e-0"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6">
          {days.map((day) => (
            <CalendarDayCell
              key={day.iso}
              day={day}
              events={eventsByDay.get(day.iso) ?? []}
              isSelected={selectedDayIso === day.iso}
              selectedReservationId={selectedReservationId}
              eventLabel={eventLabel}
              doctorColorById={doctorColorById}
              doctorNameById={doctorNameById}
              onSelectDay={onSelectDay}
              onSelectReservation={onSelectReservation}
              onMoveReservation={onMoveReservation}
              movingReservationId={movingReservationId}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
