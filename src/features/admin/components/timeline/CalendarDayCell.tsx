"use client";

import { useState } from "react";
import type { Reservation } from "@/services/reservations/types";
import type { CalendarGridDay } from "@/services/reservations/timeline";
import { cn } from "@/lib/utils";
import { CalendarEventChip } from "./CalendarEventChip";
import { CALENDAR_RESERVATION_DRAG_TYPE } from "./calendarDrag";

const MAX_VISIBLE = 3;

type Props = {
  day: CalendarGridDay;
  events: Reservation[];
  isSelected: boolean;
  selectedReservationId: string | null;
  movingReservationId: string | null;
  eventLabel: (reservation: Reservation) => string;
  onSelectDay: (iso: string) => void;
  onSelectReservation: (id: string) => void;
  onMoveReservation: (reservationId: string, targetDate: string) => void;
};

export function CalendarDayCell({
  day,
  events,
  isSelected,
  selectedReservationId,
  movingReservationId,
  eventLabel,
  onSelectDay,
  onSelectReservation,
  onMoveReservation,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const visible = events.slice(0, MAX_VISIBLE);
  const hiddenCount = events.length - visible.length;

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const reservationId = event.dataTransfer.getData(
      CALENDAR_RESERVATION_DRAG_TYPE,
    );
    if (!reservationId) return;
    onMoveReservation(reservationId, day.iso);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("[data-reservation-chip]")) {
          return;
        }
        onSelectDay(day.iso);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectDay(day.iso);
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex min-h-[6.5rem] cursor-pointer flex-col border-b border-e border-[#e6e8ec] p-2 text-start transition",
        isSelected && "bg-[#7c5cff]/8",
        !day.isCurrentMonth && "bg-white",
        day.isToday && !isSelected && "bg-[#0f2744]/[0.03]",
        isDragOver && "bg-[#7c5cff]/15 ring-2 ring-inset ring-[#7c5cff]/40",
      )}
    >
      <span
        className={cn(
          "mb-1.5 self-end text-xs font-medium",
          day.isCurrentMonth ? "text-[#0f2744]" : "text-[#9ca3af]",
          day.isToday &&
            "flex size-6 items-center justify-center rounded-full bg-[#7c5cff] text-white",
        )}
      >
        {day.dayNum}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        {visible.map((reservation) => (
          <CalendarEventChip
            key={reservation.id}
            reservation={reservation}
            label={eventLabel(reservation)}
            isActive={selectedReservationId === reservation.id}
            isMoving={movingReservationId === reservation.id}
            onSelect={onSelectReservation}
          />
        ))}
        {hiddenCount > 0 ? (
          <span className="px-1 text-[10px] font-medium text-[#7c5cff]">
            +{hiddenCount} more
          </span>
        ) : null}
      </div>
    </div>
  );
}
