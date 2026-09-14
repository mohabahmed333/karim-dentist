"use client";

import type { Reservation } from "@/services/reservations/types";
import {
  calendarEventAccent,
  formatCalendarTime,
} from "@/services/reservations/timeline";
import { cn } from "@/lib/utils";
import { CALENDAR_RESERVATION_DRAG_TYPE } from "./calendarDrag";

type Props = {
  reservation: Reservation;
  label: string;
  isActive?: boolean;
  isMoving?: boolean;
  doctorColor?: string | null;
  onSelect: (id: string) => void;
};

export function CalendarEventChip({
  reservation,
  label,
  isActive,
  isMoving,
  doctorColor,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      data-reservation-chip
      draggable={!isMoving}
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.setData(
          CALENDAR_RESERVATION_DRAG_TYPE,
          reservation.id,
        );
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(reservation.id);
      }}
      className={cn(
        "flex w-full cursor-grab items-center gap-1.5 truncate rounded-md border-s-[3px] px-1.5 py-1 text-start text-[11px] leading-tight transition active:cursor-grabbing",
        calendarEventAccent(reservation.status),
        isActive && "ring-1 ring-[#7c5cff]/40",
        isMoving && "pointer-events-none opacity-50",
      )}
    >
      {doctorColor ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: doctorColor }}
        />
      ) : null}
      <span className="shrink-0 font-semibold text-[var(--admin-text)]">
        {formatCalendarTime(reservation.starts_at)}
      </span>
      <span className="truncate text-[var(--admin-muted)]">{label}</span>
    </button>
  );
}
