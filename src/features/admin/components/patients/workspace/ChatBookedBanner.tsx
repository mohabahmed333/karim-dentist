"use client";

import { CalendarCheck } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { formatAppointmentLabel } from "@/services/cdt";
import type { TreatmentAppointment } from "@/services/patient_treatments";

type Props = {
  appointment: TreatmentAppointment;
};

export function ChatBookedBanner({ appointment }: Props) {
  const t = useTranslations();
  const when = formatAppointmentLabel(appointment.startsAt);
  return (
    <div className="mt-2 rounded-2xl border border-[#D1E7DD] bg-[#F0F9F4] px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <CalendarCheck className="size-3.5 text-[#166534]" />
        <p className="text-[11px] font-semibold tracking-wide text-[#166534] uppercase">
          {t("admin.chat.alreadyBooked")}
        </p>
        <span className="ms-auto rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#166534] capitalize">
          {appointment.status}
        </span>
      </div>
      <p className="mt-1 text-[13px] font-semibold text-[#111111]">{when}</p>
      <p className="text-[11px] text-[#4b5563]">{appointment.serviceLabel}</p>
    </div>
  );
}
