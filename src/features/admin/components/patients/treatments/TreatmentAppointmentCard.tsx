"use client";

import { CalendarCheck } from "lucide-react";
import { formatAppointmentLabel } from "@/services/cdt";
import type { TreatmentAppointment } from "@/services/patient_treatments";

type Props = {
  appointment: TreatmentAppointment;
};

export function TreatmentAppointmentCard({ appointment }: Props) {
  const when = formatAppointmentLabel(appointment.startsAt);
  const statusLabel = statusText(appointment.status);

  return (
    <div className="rounded-xl bg-white px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <CalendarCheck className="size-3.5 text-[#166534]" />
        <p className="text-[11px] font-semibold tracking-wide text-[#166534] uppercase">
          Appointment
        </p>
        <span
          className={`ms-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(appointment.status)}`}
        >
          {statusLabel}
        </span>
      </div>
      <p className="text-sm font-semibold text-[#111827]">{when}</p>
      <p className="mt-0.5 text-[12px] text-[#4b5563]">
        {appointment.serviceLabel}
      </p>
      {appointment.notes ? (
        <p className="mt-1 line-clamp-2 text-[11px] text-[#9ca3af]">
          {appointment.notes}
        </p>
      ) : null}
    </div>
  );
}

function statusText(status: TreatmentAppointment["status"]): string {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function statusClass(status: TreatmentAppointment["status"]): string {
  switch (status) {
    case "confirmed":
      return "bg-[#DCFCE7] text-[#166534]";
    case "pending":
      return "bg-[#FEF3C7] text-[#92400E]";
    case "cancelled":
      return "bg-[#FEE2E2] text-[#991B1B]";
    case "completed":
      return "bg-[#E0E7FF] text-[#3730A3]";
    default:
      return "bg-[#f3f4f6] text-[#6b7280]";
  }
}
