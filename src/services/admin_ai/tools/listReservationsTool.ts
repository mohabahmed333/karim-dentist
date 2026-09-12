import { z } from "zod";
import { cairoDayRangeUtc } from "./clinicDay";
import type { ToolDb } from "./types";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");

export const listReservationsToolArgs = z.object({
  from: dateStr,
  /** Defaults to `from` — a single day. */
  to: dateStr.optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
});
export type ListReservationsToolArgs = z.infer<typeof listReservationsToolArgs>;

const MAX_ROWS = 40;

/** Appointments in a clinic-local date range — for days beyond what Clinic context already lists. */
export async function listReservationsTool(db: ToolDb, args: ListReservationsToolArgs) {
  const { startUtc } = cairoDayRangeUtc(args.from);
  const { endUtc } = cairoDayRangeUtc(args.to ?? args.from);

  let query = db
    .from("reservations")
    .select("id,patient_name,phone,service_label,starts_at,status")
    .is("deleted_at", null)
    .gte("starts_at", startUtc)
    .lt("starts_at", endUtc)
    .order("starts_at", { ascending: true })
    .limit(MAX_ROWS);
  if (args.status) query = query.eq("status", args.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    reservationId: r.id as string,
    patient_name: r.patient_name as string,
    phone: r.phone as string,
    service_label: r.service_label as string,
    starts_at: r.starts_at as string,
    status: r.status as string,
  }));
}
