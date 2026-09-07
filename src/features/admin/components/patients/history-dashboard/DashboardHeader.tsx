"use client";

import Link from "next/link";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { patientWorkspacePath } from "@/services/reservations/patientHistory";
import { PatientSearchPill } from "./PatientSearchPill";

type Props = {
  group: PatientGroup;
  directory: PatientGroup[];
  onAddNote: () => void;
};

export function DashboardHeader({ group, directory, onAddNote }: Props) {
  return (
    <header className="relative z-40 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#111111]">
          {group.displayName}
        </p>
        <p className="truncate text-[11px] tracking-wide text-[#7a7a7a] uppercase">
          Patient
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={patientWorkspacePath(group.patientKey)}
          className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#64748B] hover:text-[#1E293B]"
        >
          Clinical workspace
        </Link>
        <button
          type="button"
          onClick={onAddNote}
          className="rounded-full bg-[#111111] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#2563EB]"
        >
          + Note
        </button>
        <PatientSearchPill directory={directory} currentKey={group.patientKey} />
      </div>
    </header>
  );
}
