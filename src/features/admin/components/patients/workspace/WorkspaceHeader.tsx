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
    <header className="pointer-events-none absolute top-4 start-4 z-40 md:top-5 md:start-6">
      <div className="min-w-0 max-w-[min(18rem,50vw)]">
        <p className="truncate text-sm font-semibold text-[#111111]">
          {group.displayName}
        </p>
        <p className="truncate text-[11px] tracking-wide text-[#7a7a7a] uppercase">
          {t("admin.patients.clinicalWorkspace")}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Link
            href={`/admin/patients/${encodePatientKey(group.patientKey)}/billing`}
            className="pointer-events-auto inline-block text-[11px] font-medium text-[#2563eb] hover:underline"
          >
            {t("admin.billing.patientTitle")}
          </Link>
          {onBill ? (
            <button
              type="button"
              onClick={onBill}
              className="pointer-events-auto rounded-md bg-[#2563eb] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              {t("admin.billing.billPatient")}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
