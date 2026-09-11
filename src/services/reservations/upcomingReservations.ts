import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type UpcomingReservation = {
  id: string;
  patient_name: string;
  service_label: string;
  starts_at: string;
  status: string;
};

/**
 * A patient's future, non-cancelled visits, soonest first.
 *
 * Matched on the last 8 phone digits (the indexed `phone_suffix`), the same way
 * inbound WhatsApp messages are matched to conversations, so "+20 10…" and
 * "010…" find the same patient. Shared by the auto-responder and quick replies
 * so both always agree on what "your next appointment" is.
 */
export async function loadUpcomingReservations(
  db: SupabaseClient<Database>,
  phone: string,
  limit = 5,
  now: Date = new Date(),
): Promise<UpcomingReservation[]> {
  const { data } = await db
    .from("reservations")
    .select("id,patient_name,service_label,starts_at,status")
    .eq("phone_suffix", phone.replace(/\D/g, "").slice(-8))
    .is("deleted_at", null)
    .gte("starts_at", now.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as UpcomingReservation[];
}
