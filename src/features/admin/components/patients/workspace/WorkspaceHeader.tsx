"use client";

import Link from "next/link";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { encodePatientKey } from "@/services/reservations/patientHistory";
import { useTranslations } from "@/lib/i18n";

type Props = {
  group: PatientGroup;
  /** Omitted when the user can't create billing requests. */
  onBill?: () => void;
};

export function WorkspaceHeader({ group, onBill }: Props) {
  const t = useTranslations();
  return (
    // A row of its own rather than an overlay: floating it over the chart pane
    // laid the patient's name across the chart-style buttons, leaving both
    // unreadable.
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#e5e7eb] px-4 py-3 md:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#111111]">
          {group.displayName}
        </p>
        <p className="truncate text-[11px] tracking-wide text-[#7a7a7a] uppercase">
          {t("admin.patients.clinicalWorkspace")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/patients/${encodePatientKey(group.patientKey)}/billing`}
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          {t("admin.billing.patientTitle")}
        </Link>
        {onBill ? (
          <button
            type="button"
            onClick={onBill}
            className="rounded-md bg-[#2563eb] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            {t("admin.billing.billPatient")}
          </button>
        ) : null}
      </div>
    </header>
  );
}
