import Link from "next/link";
import type { Reservation } from "@/services/reservations/types";
import {
  formatReservationWhen,
  isUpcomingReservation,
  statusBadgeClass,
} from "@/services/reservations/stats";

type Props = {
  reservations: Reservation[];
};

export function UpcomingReservationsCard({ reservations }: Props) {
  const upcoming = reservations
    .filter((row) => isUpcomingReservation(row))
    .slice(0, 5);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#e6e8ec]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#0f2744]">Upcoming</h2>
        <Link href="/admin/reservations" className="text-xs text-[#6b7280] hover:text-[#0f2744]">
          View all
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-sm text-[#6b7280]">No upcoming bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/reservations?selected=${row.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0f2744]">
                    {row.patient_name}
                  </p>
                  <p className="truncate text-xs text-[#6b7280]">
                    {row.service_label} · {formatReservationWhen(row.starts_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusBadgeClass(row.status)}`}
                >
                  {row.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
