"use client";

import type { MockPatient } from "./types";

type Props = {
  patient: MockPatient;
};

export function PatientHeader({ patient }: Props) {
  const balance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(patient.balance);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">{patient.name}</h1>
          <p className="text-sm text-[#6b7280]">Age {patient.age}</p>
        </div>
        {patient.hasMedicalAlert ? (
          <span className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Medical Alert
          </span>
        ) : null}
      </div>
      <p className="text-sm text-[#6b7280]">
        Balance{" "}
        <span className="font-semibold text-[#111827]">{balance}</span>
      </p>
    </header>
  );
}
