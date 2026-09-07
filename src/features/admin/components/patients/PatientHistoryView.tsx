"use client";

import Link from "next/link";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  buildPatientHistoryDetail,
  encodePatientKey,
  formatPatientVisitDate,
  patientProfilePath,
} from "@/services/reservations/patientHistory";
import type { TreatmentItem } from "@/services/patient_treatments";
import { PatientTreatmentHistory } from "./PatientTreatmentHistory";
import { PatientVisitList } from "./PatientVisitList";

type Props = {
  group: PatientGroup;
  treatments?: TreatmentItem[];
  reservationsBase?: string;
  showFullLink?: boolean;
  embedded?: boolean;
};

export function PatientHistoryView({
  group,
  treatments = [],
  reservationsBase = "/admin/reservations",
  showFullLink = false,
  embedded = false,
}: Props) {
  const detail = buildPatientHistoryDetail(group);
  const { stats } = detail;

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
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
          {showFullLink ? (
            <Link
              href={patientProfilePath(group.patientKey)}
              className="text-sm font-medium text-[#c9a962] hover:underline"
            >
              Open full profile
            </Link>
          ) : null}
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#6b7280]">
            {group.phone}
            {group.email ? ` · ${group.email}` : ""}
          </p>
          {group.alternateNames.length > 0 ? (
            <p className="mt-1 text-xs text-[#6b7280]">
              Also known as: {group.alternateNames.join(", ")}
            </p>
          ) : null}
        </div>
      )}

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
        <section className="rounded-2xl bg-[#fafafa] p-4">
          <h3 className="mb-3 text-sm font-medium text-[#0f2744]">
            Services received
          </h3>
          <div className="flex flex-wrap gap-2">
            {detail.services.map((service) => (
              <span
                key={service.label}
                className="rounded-full bg-white px-3 py-1 text-xs text-[#0f2744]"
              >
                {service.label} · {service.count}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <PatientTreatmentHistory treatments={treatments} />

      <section>
        <h3 className="mb-3 text-sm font-medium text-[#0f2744]">
          Upcoming ({detail.upcomingVisits.length})
        </h3>
        <PatientVisitList
          visits={detail.upcomingVisits}
          reservationsBase={reservationsBase}
          emptyMessage="No upcoming appointments."
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-[#0f2744]">
          Past visits ({detail.pastVisits.length})
        </h3>
        <PatientVisitList
          visits={detail.pastVisits}
          reservationsBase={reservationsBase}
          emptyMessage="No completed past visits."
        />
      </section>

      {detail.cancelledVisits.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-medium text-[#0f2744]">
            Cancelled ({detail.cancelledVisits.length})
          </h3>
          <PatientVisitList
            visits={detail.cancelledVisits}
            reservationsBase={reservationsBase}
          />
        </section>
      ) : null}

      <Link
        href={`/admin/reservations?new=1&patient=${encodePatientKey(group.patientKey)}`}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0f2744] px-4 text-sm font-medium text-white hover:bg-[#0f2744]/90"
      >
        Book follow-up
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fafafa] px-4 py-3">
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#0f2744]">{value}</p>
    </div>
  );
}
