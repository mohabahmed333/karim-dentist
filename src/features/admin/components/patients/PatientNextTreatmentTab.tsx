"use client";

import Link from "next/link";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  buildPatientHistoryDetail,
  encodePatientKey,
} from "@/services/reservations/patientHistory";
import { PatientVisitList } from "./PatientVisitList";

type Props = {
  group: PatientGroup;
  reservationsBase?: string;
};

export function PatientNextTreatmentTab({
  group,
  reservationsBase = "/admin/reservations",
}: Props) {
  const detail = buildPatientHistoryDetail(group);

  return (
    <div className="space-y-6 pt-6">
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

      <Link
        href={`/admin/reservations?new=1&patient=${encodePatientKey(group.patientKey)}`}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0f2744] px-4 text-sm font-medium text-white hover:bg-[#0f2744]/90"
      >
        Book follow-up
      </Link>
    </div>
  );
}
