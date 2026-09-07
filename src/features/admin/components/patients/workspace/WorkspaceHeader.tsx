"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import { useTranslations } from "@/lib/i18n";

type Props = {
  group: PatientGroup;
};

export function WorkspaceHeader({ group }: Props) {
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
      </div>
    </header>
  );
}
