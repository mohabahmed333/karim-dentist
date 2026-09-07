"use client";

import type { ProcedureItem } from "@/services/cdt";

type Props = {
  procedure: ProcedureItem;
  onBook: () => void;
};

export function CdtBookingAction({ procedure, onBook }: Props) {
  if (procedure.status === "open") {
    return (
      <button
        type="button"
        className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-medium text-[#2563EB]"
        onClick={onBook}
      >
        Book
      </button>
    );
  }

  if (procedure.status === "done" && !procedure.appointmentLabel) {
    return (
      <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-medium text-[#64748B]">
        Done
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onBook}
      className="max-w-38 rounded-full bg-[#DCFCE7] px-3 py-1 text-start text-[11px] font-medium text-[#166534]"
      title="View or change appointment"
    >
      <span className="block leading-tight">Booked</span>
      {procedure.appointmentLabel ? (
        <span className="block truncate text-[10px] font-normal opacity-90">
          {procedure.appointmentLabel}
        </span>
      ) : null}
    </button>
  );
}
