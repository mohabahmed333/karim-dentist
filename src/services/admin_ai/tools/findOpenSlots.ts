import { z } from "zod";
import { cairoDayRangeUtc } from "./clinicDay";
import type { ToolDb } from "./types";

export const findOpenSlotsArgs = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD"),
});
export type FindOpenSlotsArgs = z.infer<typeof findOpenSlotsArgs>;

const MAX_SLOTS = 30;

/** Open appointment slots on one clinic-local day, beyond what Clinic context already lists. */
export async function findOpenSlots(db: ToolDb, args: FindOpenSlotsArgs) {
  const { startUtc, endUtc } = cairoDayRangeUtc(args.date);
  const { data, error } = await db
    .from("appointment_slots")
    .select("id,starts_at")
    .eq("status", "open")
    .gte("starts_at", startUtc)
    .lt("starts_at", endUtc)
    .order("starts_at", { ascending: true })
    .limit(MAX_SLOTS);
  if (error) throw new Error(error.message);

  return (data ?? []).map((s) => ({ slotId: s.id as string, starts_at: s.starts_at as string }));
}
