"use client";

import type { Reservation } from "@/services/reservations/types";
import {
  calendarEventAccent,
  formatCalendarTime,
} from "@/services/reservations/timeline";
import { cn } from "@/lib/utils";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/components/ui/preview-card";
import { AdminUserAvatar } from "@/features/admin/components/AdminUserAvatar";
import { CALENDAR_RESERVATION_DRAG_TYPE } from "./calendarDrag";

export type ChipDoctorInfo = {
  name: string;
  avatarUrl: string | null;
  specialty: string | null;
};

type Props = {
  reservation: Reservation;
  label: string;
  isActive?: boolean;
  isMoving?: boolean;
  doctorColor?: string | null;
  doctor?: ChipDoctorInfo | null;
  onSelect: (id: string) => void;
};

export function CalendarEventChip({
  reservation,
  label,
  isActive,
  isMoving,
  doctorColor,
  doctor,
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
        doctor ? (
          <PreviewCard>
            <PreviewCardTrigger
              delay={200}
              closeDelay={0}
              render={
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: doctorColor }}
                />
              }
            />
            <PreviewCardContent side="top" sideOffset={6} className="w-56 p-2.5">
              <span className="flex items-center gap-2.5">
                <AdminUserAvatar
                  name={doctor.name}
                  avatarUrl={doctor.avatarUrl}
                  size="sm"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">
                    {doctor.name}
                  </span>
                  {doctor.specialty ? (
                    <span className="block truncate text-[11px] text-[var(--admin-muted)]">
                      {doctor.specialty}
                    </span>
                  ) : null}
                </span>
              </span>
            </PreviewCardContent>
          </PreviewCard>
        ) : (
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: doctorColor }}
          />
        )
      ) : null}
      <span className="shrink-0 font-semibold text-[var(--admin-text)]">
        {formatCalendarTime(reservation.starts_at)}
      </span>
      <span className="truncate text-[var(--admin-muted)]">{label}</span>
    </button>
  );
}
