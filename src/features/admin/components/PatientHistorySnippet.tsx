"use client";

import Link from "next/link";
import {
  buildPatientHistoryStats,
  formatPatientVisitDate,
  groupReservationsByPatient,
  patientKeyFromReservation,
  patientProfilePath,
} from "@/services/reservations/patientHistory";
import { formatReservationWhen, statusBadgeClass } from "@/services/reservations/stats";
import type { Reservation } from "@/services/reservations/types";

type Props = {
  reservations: Reservation[];
  patientName: string;
  phone: string;
  excludeId?: string;
  limit?: number;
};

export function PatientHistorySnippet({
  reservations,
  patientName,
  phone,
  excludeId,
  limit = 5,
}: Props) {
  if (!patientName.trim() && !phone.trim()) return null;

  const probe: Reservation = {
    id: excludeId ?? "probe",
    patient_name: patientName,
    phone,
    email: null,
    service_id: null,
    service_label: "",
    starts_at: new Date().toISOString(),
    notes: "",
    status: "pending",
    created_at: "",
    updated_at: "",
    deleted_at: null,
  };
  const key = patientKeyFromReservation(probe);
  const group = groupReservationsByPatient(reservations).find(
    (item) => item.patientKey === key,
  );
  if (!group || group.visits.length <= 1) return null;

  const stats = buildPatientHistoryStats(group);
  const recent = [...group.visits]
    .filter((visit) => visit.id !== excludeId)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
    .slice(0, limit);

  if (recent.length === 0) return null;

  return (
    <section className="mt-6 border-t border-[var(--admin-border,#e6e8ec)] pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-[var(--admin-text,#0f2744)]">
          Patient history
        </h3>
        <Link
          href={patientProfilePath(key)}
          className="text-xs font-medium text-[var(--admin-primary,#5e6ad2)] hover:underline"
        >
          Full history
        </Link>
      </div>
      <p className="mb-3 text-xs text-[var(--admin-muted,#6b7280)]">
        {stats.visitCount} visits
        {stats.lastVisit
          ? ` · Last ${formatPatientVisitDate(stats.lastVisit.starts_at)}`
          : ""}
      </p>
      <ul className="space-y-2">
        {recent.map((visit) => (
          <li
            key={visit.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--admin-border,#e6e8ec)] bg-[var(--admin-panel,#fff)] px-3 py-2 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--admin-text,#0f2744)]">
                {visit.service_label}
              </p>
              <p className="text-[var(--admin-muted,#6b7280)]">
                {formatReservationWhen(visit.starts_at)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 capitalize ${statusBadgeClass(visit.status)}`}
            >
              {visit.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
