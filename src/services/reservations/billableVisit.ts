import type { Reservation } from "./types";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Whether a visit can be billed.
 *
 * Today's visits only, and only once they have started. A bill is raised at
 * the chair for the work just done: an appointment still to come has had no
 * work, and one from a previous day is almost always a misclick in a list —
 * billing a patient for a visit nine days old, long after they have left, is
 * how a clinic charges the wrong person for the wrong thing.
 *
 * A cancelled visit is never billable: there is no work to charge for.
 *
 * `no_show` stays billable, so a clinic that charges a missed-visit fee has
 * somewhere to put it — but only on the day, like everything else.
 *
 * The deliberate cost: a visit nobody billed on the day cannot be billed
 * through this form afterwards. That is a charge on the patient's ledger
 * rather than a bill against the visit.
 */
export function isBillableVisit(
  reservation: Pick<Reservation, "starts_at" | "status">,
  now: Date | number = Date.now(),
): boolean {
  if (reservation.status === "cancelled") return false;
  const nowDate = typeof now === "number" ? new Date(now) : now;
  const startsAt = new Date(reservation.starts_at);
  if (startsAt.getTime() > nowDate.getTime()) return false;
  return isSameLocalDay(startsAt, nowDate);
}
