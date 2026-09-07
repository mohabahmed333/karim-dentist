"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  buildPatientHistoryDetail,
  formatPatientVisitDate,
} from "@/services/reservations/patientHistory";

type Props = { group: PatientGroup };

export function PatientInfoTab({ group }: Props) {
  const detail = buildPatientHistoryDetail(group);
  const { stats } = detail;

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0f2744]">
          {group.displayName}
        </h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          {group.phone}
          {group.email ? ` · ${group.email}` : ""}
        </p>
        {group.alternateNames.length > 0 ? (
          <p className="mt-1 text-xs text-[#6b7280]">
            Also known as: {group.alternateNames.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total visits" value={String(stats.visitCount)} />
        <StatCard
          label="Patient since"
          value={
            detail.firstVisit
              ? formatPatientVisitDate(detail.firstVisit.starts_at)
              : "—"
          }
        />
        <StatCard
          label="Last visit"
          value={
            stats.lastVisit
              ? formatPatientVisitDate(stats.lastVisit.starts_at)
              : "—"
          }
        />
        <StatCard
          label="Next visit"
          value={
            stats.nextVisit
              ? formatPatientVisitDate(stats.nextVisit.starts_at)
              : "—"
          }
        />
      </div>

      {detail.services.length > 0 ? (
        <section className="rounded-2xl border border-[#e6e8ec] bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-[#0f2744]">
            Services received
          </h3>
          <div className="flex flex-wrap gap-2">
            {detail.services.map((service) => (
              <span
                key={service.label}
                className="rounded-full border border-[#e6e8ec] px-3 py-1 text-xs text-[#0f2744]"
              >
                {service.label} · {service.count}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e6e8ec] bg-white px-4 py-3">
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#0f2744]">{value}</p>
    </div>
  );
}
