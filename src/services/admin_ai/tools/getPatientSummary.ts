import { z } from "zod";
import {
  buildPatientHistoryDetail,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import type { ToolDb } from "./types";

export const getPatientSummaryArgs = z.object({
  patientKey: z.string().min(1).max(160),
});
export type GetPatientSummaryArgs = z.infer<typeof getPatientSummaryArgs>;

const MAX_PAST_VISITS = 10;

function visitLine(v: Reservation) {
  return {
    reservationId: v.id,
    starts_at: v.starts_at,
    service_label: v.service_label,
    status: v.status,
  };
}

/** Full visit history for one patient — the detail view's own logic, reused. */
export async function getPatientSummary(
  db: ToolDb,
  args: GetPatientSummaryArgs,
  now = new Date(),
) {
  const { data, error } = await db
    .from("reservations")
    .select("*")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  const groups = groupReservationsByPatient((data ?? []) as Reservation[]);
  const group = getPatientGroup(groups, args.patientKey);
  if (!group) return { found: false as const };

  const detail = buildPatientHistoryDetail(group, now);
  return {
    found: true as const,
    patientKey: group.patientKey,
    name: group.displayName,
    phone: group.phone,
    email: group.email,
    visitCount: detail.stats.visitCount,
    isReturning: detail.stats.isReturning,
    upcomingVisits: detail.upcomingVisits.map(visitLine),
    pastVisits: detail.pastVisits.slice(0, MAX_PAST_VISITS).map(visitLine),
    topServices: detail.services.slice(0, 5),
  };
}
