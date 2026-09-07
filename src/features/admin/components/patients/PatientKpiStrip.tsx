"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  buildPatientHistoryDetail,
  formatPatientVisitDate,
} from "@/services/reservations/patientHistory";

type Props = {
  group: PatientGroup;
  notesCount: number;
  imagingCount: number;
};

export function PatientKpiStrip({ group, notesCount, imagingCount }: Props) {
  const detail = buildPatientHistoryDetail(group);
  const { stats } = detail;

  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-12">
      <PatientDashMetric
        className="lg:col-span-4"
        tone="dark"
        label="Total visits"
        value={String(stats.visitCount)}
        hint={
          stats.isReturning ? "Returning patient" : "New patient record"
        }
      />
      <PatientDashMetric
        className="lg:col-span-2"
        tone="accent"
        label="Notes"
        value={String(notesCount)}
        hint="Tooth notes"
      />
      <PatientDashMetric
        className="lg:col-span-2"
        label="X-rays"
        value={String(imagingCount)}
        hint="Imaging files"
      />
      <PatientDashMetric
        className="lg:col-span-2"
        label="Last visit"
        value={
          stats.lastVisit
            ? formatPatientVisitDate(stats.lastVisit.starts_at)
            : "—"
        }
        hint="Most recent"
      />
      <PatientDashMetric
        className="lg:col-span-2"
        label="Next visit"
        value={
          stats.nextVisit
            ? formatPatientVisitDate(stats.nextVisit.starts_at)
            : "—"
        }
        hint="Upcoming"
      />
    </div>
  );
}

function PatientDashMetric({
  label,
  value,
  hint,
  tone = "default",
  className = "",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "dark" | "accent";
  className?: string;
}) {
  const shell =
    tone === "dark"
      ? "pdash-card pdash-card-dark"
      : tone === "accent"
        ? "pdash-card pdash-card-accent"
        : "pdash-card";

  return (
    <div className={`${shell} flex flex-col justify-between p-4 ${className}`}>
      <p
        className={`text-[11px] font-medium tracking-wide uppercase ${
          tone === "dark"
            ? "text-white/55"
            : tone === "accent"
              ? "text-[#ec4899]"
              : "text-[#9ca3af]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-3 text-2xl font-semibold tracking-tight ${
          tone === "dark"
            ? "text-white"
            : tone === "accent"
              ? "text-[#ec4899]"
              : "text-[#111827]"
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-1 text-[11px] ${
          tone === "dark" ? "text-white/45" : "text-[#9ca3af]"
        }`}
      >
        {hint}
      </p>
    </div>
  );
}
