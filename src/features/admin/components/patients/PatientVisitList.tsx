"use client";

import Link from "next/link";
import type { Reservation } from "@/services/reservations/types";
import { formatReservationWhen, statusBadgeClass } from "@/services/reservations/stats";

type Props = {
  visits: Reservation[];
  reservationsBase?: string;
  emptyMessage?: string;
  compact?: boolean;
};

export function PatientVisitList({
  visits,
  reservationsBase = "/admin/reservations",
  emptyMessage = "No visits in this section.",
  compact = false,
}: Props) {
  if (visits.length === 0) {
    return <p className="text-sm text-[#9ca3af]">{emptyMessage}</p>;
  }

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2"}>
      {visits.map((visit) => (
        <li key={visit.id}>
          <Link
            href={`${reservationsBase}?selected=${visit.id}`}
            className="block rounded-2xl bg-[#fafafa] px-3.5 py-2.5 transition hover:bg-[#f3f4f6]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#111827]">
                  {visit.service_label}
                </p>
                <p className="text-[11px] text-[#9ca3af]">
                  {formatReservationWhen(visit.starts_at)}
                </p>
                {!compact && visit.notes ? (
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-[#6b7280]">
                    {visit.notes}
                  </p>
                ) : null}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] capitalize ${statusBadgeClass(visit.status)}`}
              >
                {visit.status}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
