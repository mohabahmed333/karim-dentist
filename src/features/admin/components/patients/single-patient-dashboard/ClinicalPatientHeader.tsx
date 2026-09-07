"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";

type Props = {
  group: PatientGroup;
  balanceEgp: number;
};

export function ClinicalPatientHeader({ group, balanceEgp }: Props) {
  const visitCount = group.visits.length;
  const balance = new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(balanceEgp);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">
            {group.displayName}
          </h1>
          <p className="text-sm text-slate-500">
            {visitCount} visit{visitCount === 1 ? "" : "s"}
            {group.phone ? ` · ${group.phone}` : ""}
          </p>
        </div>
        <span
          className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
          title="Allergy data not stored yet — confirm verbally"
        >
          Confirm allergies
        </span>
      </div>
      <p className="text-sm text-slate-500">
        Balance <span className="font-semibold text-slate-900">{balance}</span>
      </p>
    </header>
  );
}
