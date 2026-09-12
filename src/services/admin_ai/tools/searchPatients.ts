import { z } from "zod";
import {
  buildPatientHistoryStats,
  filterPatientGroups,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import type { ToolDb } from "./types";

export const searchPatientsArgs = z.object({
  query: z.string().min(1).max(120),
});
export type SearchPatientsArgs = z.infer<typeof searchPatientsArgs>;

const MAX_RESULTS = 8;

function visitLine(v: Reservation) {
  return { reservationId: v.id, starts_at: v.starts_at, service_label: v.service_label };
}

/** Find a patient by name or phone, the same grouping the Patients page uses. */
export async function searchPatients(
  db: ToolDb,
  args: SearchPatientsArgs,
  now = new Date(),
) {
  const { data, error } = await db
    .from("reservations")
    .select("*")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  const groups = groupReservationsByPatient((data ?? []) as Reservation[]);
  const matches = filterPatientGroups(groups, "all", args.query, now).slice(0, MAX_RESULTS);

  return matches.map((group) => {
    const stats = buildPatientHistoryStats(group, now);
    return {
      patientKey: group.patientKey,
      name: group.displayName,
      phone: group.phone,
      visitCount: stats.visitCount,
      lastVisit: stats.lastVisit ? visitLine(stats.lastVisit) : null,
      nextVisit: stats.nextVisit ? visitLine(stats.nextVisit) : null,
    };
  });
}
