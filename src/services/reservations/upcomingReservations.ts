import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type UpcomingReservation = {
  id: string;
  patient_name: string;
  service_label: string;
  starts_at: string;
  status: string;
  doctor_id: string | null;
  doctor_name: string | null;
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
    .select(
      "id,patient_name,service_label,starts_at,status,doctor_id,doctor:profiles!reservations_doctor_id_fkey(display_name)",
    )
    .eq("phone_suffix", phone.replace(/\D/g, "").slice(-8))
    .is("deleted_at", null)
    .gte("starts_at", now.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true })
    .limit(limit);
  return (data ?? []).map((row) => {
    const doctor = row.doctor as { display_name: string | null } | null;
    return {
      id: row.id,
      patient_name: row.patient_name,
      service_label: row.service_label,
      starts_at: row.starts_at,
      status: row.status,
      doctor_id: row.doctor_id,
      doctor_name: doctor?.display_name ?? null,
    };
  });
}
