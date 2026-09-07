"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Reservation } from "@/services/reservations/types";
import {
  formatCalendarDayLabel,
  formatCalendarTime,
  reservationDayIso,
} from "@/services/reservations/timeline";
import { splitStartsAt } from "@/services/reservations/schemas";
import {
  patientKeyFromReservation,
  patientProfilePath,
} from "@/services/reservations/patientHistory";
import { statusBadgeClass } from "@/services/reservations/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientProfileDrawer } from "../patients/workspace/ClientProfileDrawer";

type Props = {
  dayIso: string | null;
  reservation: Reservation | null;
  dayEvents: Reservation[];
  reservationsBase: string;
  isRescheduling: boolean;
  onClose: () => void;
  onSelectReservation: (id: string) => void;
  onReschedule: (targetDate: string) => void;
};

export function CalendarReservationPanel({
  dayIso,
  reservation,
  dayEvents,
  reservationsBase,
  isRescheduling,
  onClose,
  onSelectReservation,
  onReschedule,
}: Props) {
  const [moveDate, setMoveDate] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!reservation) {
      setMoveDate("");
      setProfileOpen(false);
      return;
    }
    setMoveDate(splitStartsAt(reservation.starts_at).date);
    setProfileOpen(false);
  }, [reservation?.id, reservation?.starts_at]);

  if (!dayIso) return null;

  const title = reservation ? reservation.service_label : "Day appointments";

  const currentDate = reservation
    ? reservationDayIso(reservation.starts_at)
    : null;
  const canMove =
    reservation && moveDate && moveDate !== currentDate && !isRescheduling;

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-2xl border border-[#e6e8ec] bg-white lg:w-[22rem]">
      <div className="flex items-center justify-between border-b border-[#e6e8ec] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[#6b7280] hover:bg-white"
          aria-label="Close panel"
        >
          <X className="size-4" />
        </button>
        <p className="text-sm font-medium text-[#6b7280]">
          {reservation ? "Appointment" : "Create appointment"}
        </p>
        <Button
          size="sm"
          render={
            <Link href={panelActionHref(reservation, dayIso, reservationsBase)} />
          }
        >
          {reservation ? "Open" : "Add"}
        </Button>
      </div>

      {reservation ? (
        <div className="space-y-4 p-4">
          <h3 className="text-lg font-semibold text-[#0f2744]">{title}</h3>
          <p className="text-sm text-[#6b7280]">{reservation.patient_name}</p>
          <div className="rounded-xl border border-[#e6e8ec] bg-white px-4 py-3">
            <p className="text-2xl font-semibold text-[#0f2744]">
              {formatCalendarTime(reservation.starts_at)}
            </p>
            <p className="mt-1 text-sm text-[#6b7280]">
              {formatCalendarDayLabel(dayIso)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-[#6b7280]">{reservation.phone}</span>
            {reservation.email ? (
              <span className="text-[#6b7280]">{reservation.email}</span>
            ) : null}
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${statusBadgeClass(reservation.status)}`}
          >
            {reservation.status}
          </span>
          {reservation.notes ? (
            <div className="rounded-xl border border-[#e6e8ec] p-3 text-sm text-[#4b5563]">
              {reservation.notes}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="text-sm font-medium text-[#0f2744] underline-offset-2 hover:underline"
            >
              Client intake
            </button>
            <Link
              href={patientProfilePath(patientKeyFromReservation(reservation))}
              className="text-sm font-medium text-[#6b7280] hover:underline"
            >
              Full history
            </Link>
          </div>
          <div className="space-y-2 border-t border-[#e6e8ec] pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
              Move to another day
            </p>
            <p className="text-xs text-[#9ca3af]">
              Drag the appointment on the calendar or pick a date below.
            </p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={moveDate}
                onChange={(event) => setMoveDate(event.target.value)}
                disabled={isRescheduling}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                disabled={!canMove}
                onClick={() => onReschedule(moveDate)}
              >
                {isRescheduling ? "Moving…" : "Move"}
              </Button>
            </div>
          </div>
          <ClientProfileDrawer
            open={profileOpen}
            patientKey={patientKeyFromReservation(reservation)}
            displayName={reservation.patient_name}
            phone={reservation.phone}
            email={reservation.email}
            onClose={() => setProfileOpen(false)}
          />
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <h3 className="text-lg font-semibold text-[#0f2744]">
            {formatCalendarDayLabel(dayIso)}
          </h3>
          <p className="text-sm text-[#6b7280]">
            {dayEvents.length === 0
              ? "No appointments on this day."
              : `${dayEvents.length} appointment${dayEvents.length === 1 ? "" : "s"}`}
          </p>
          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelectReservation(event.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#e6e8ec] px-3 py-2 text-start text-sm hover:border-[#7c5cff]/40"
                >
                  <span className="font-medium text-[#0f2744]">
                    {event.patient_name}
                  </span>
                  <span className="text-[#6b7280]">
                    {formatCalendarTime(event.starts_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function panelActionHref(
  reservation: Reservation | null,
  dayIso: string,
  base: string,
): string {
  if (reservation) {
    return `${base}?selected=${reservation.id}`;
  }
  return `${base}?new=1&date=${dayIso}`;
}
