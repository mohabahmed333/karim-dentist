import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { loadUpcomingReservations } from "@/services/reservations/upcomingReservations";
import {
  formatClinicAssistContext,
  MAX_CONTEXT_SLOTS,
  type ClinicAssistLocale,
  type ContextReservation,
} from "./clinicAssistContext";

const RESERVATION_COLUMNS = "id,patient_name,service_label,starts_at,status";
const HOUR_MS = 60 * 60 * 1000;

/**
 * Query what the context block needs, as the signed-in admin (RLS applies).
 *
 * The day window is deliberately wider than "today and tomorrow" in UTC — the
 * formatter decides which calendar day each visit falls on in clinic time.
 */
export async function loadClinicAssistContext(
  db: SupabaseClient<Database>,
  input: {
    locale: ClinicAssistLocale;
    page: string | null;
    activePatient: { name: string; phone: string; patientKey: string } | null;
    now?: Date;
  },
): Promise<string> {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();

  const [dayRes, pendingRes, slotRes, upcoming] = await Promise.all([
    db
      .from("reservations")
      .select(RESERVATION_COLUMNS)
      .is("deleted_at", null)
      .gte("starts_at", new Date(now.getTime() - 24 * HOUR_MS).toISOString())
      .lte("starts_at", new Date(now.getTime() + 48 * HOUR_MS).toISOString())
      .order("starts_at", { ascending: true })
      .limit(80),
    db
      .from("reservations")
      .select(RESERVATION_COLUMNS)
      .is("deleted_at", null)
      .eq("status", "pending")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(20),
    db
      .from("appointment_slots")
      .select("id,starts_at")
      .eq("status", "open")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(MAX_CONTEXT_SLOTS),
    input.activePatient?.phone
      ? loadUpcomingReservations(db, input.activePatient.phone, 5, now)
      : Promise.resolve([]),
  ]);

  const byId = new Map<string, ContextReservation>();
  for (const row of [...(dayRes.data ?? []), ...(pendingRes.data ?? [])]) {
    byId.set(row.id, row);
  }

  return formatClinicAssistContext({
    now,
    locale: input.locale,
    page: input.page,
    reservations: [...byId.values()],
    openSlots: slotRes.data ?? [],
    activePatient: input.activePatient
      ? { ...input.activePatient, upcoming }
      : null,
  });
}
