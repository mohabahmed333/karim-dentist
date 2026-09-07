"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import { buildPatientHistoryDetail } from "@/services/reservations/patientHistory";
import { PatientVisitList } from "./PatientVisitList";

type Props = {
  group: PatientGroup;
  reservationsBase?: string;
};

export function PatientAppointmentHistoryTab({
  group,
  reservationsBase = "/admin/reservations",
}: Props) {
  const detail = buildPatientHistoryDetail(group);

  return (
    <div className="space-y-6 pt-6">
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
    </div>
  );
}
