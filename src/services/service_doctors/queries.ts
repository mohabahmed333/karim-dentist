import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { createServiceClient } from "@/lib/supabase/service";

type AnySupabase =
  | ReturnType<typeof createServiceClient>
  | Awaited<ReturnType<typeof createBrowserClient>>
  | Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export type BookableDoctorOption = {
  id: string;
  displayName: string | null;
  specialty: string | null;
  bio: string | null;
  avatarUrl: string | null;
  calendarColor: string | null;
  /** Null means fully booked out to the horizon — not ineligible, just nothing open right now. */
  nextSlot: { id: string; startsAt: string } | null;
  /**
   * What this doctor charges for the service just asked about — their own
   * override if set, else the service's clinic-wide price_label, else null.
   * Always null when serviceId was null (no service context to price).
   */
  priceLabel: string | null;
};

/**
 * Every bookable doctor eligible for a service, soonest-next-available
 * first — row 0 is "no preference / earliest available". `serviceId: null`,
 * and a service with no `service_doctors` rows at all, both mean "every
 * bookable doctor" (see the RPC's own comment for why that default matters).
 */
export async function listBookableDoctorsForService(
  supabase: AnySupabase,
  opts: { serviceId: string | null; fromIso?: string },
): Promise<BookableDoctorOption[]> {
  const { data, error } = await supabase.rpc("list_bookable_doctors_for_service", {
    p_service_id: opts.serviceId,
    p_from: opts.fromIso ?? new Date().toISOString(),
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    specialty: row.specialty,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    calendarColor: row.calendar_color,
    nextSlot: row.next_slot_id
      ? { id: row.next_slot_id, startsAt: row.next_slot_starts_at as string }
      : null,
    priceLabel: row.price_label,
  }));
}

/** Which service ids this doctor is currently mapped to. */
export async function listServiceIdsForDoctor(
  supabase: AnySupabase,
  doctorId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("service_doctors")
    .select("service_id")
    .eq("doctor_id", doctorId);
  if (error) throw error;
  return (data ?? []).map((row) => row.service_id);
}

/** One doctor's mapping to one service, with whatever price override they carry. */
export type ServiceDoctorMapping = { doctorId: string; priceLabel: string | null };

/**
 * The whole mapping table, service_id -> its doctors (each with their own
 * price override, if any). Used to compute the "open to all doctors" /
 * "restricted to N doctors" badge across every doctor's tab at once, and to
 * seed each doctor's price-override inputs without a second query.
 */
export async function listAllServiceDoctorMappings(
  supabase: AnySupabase,
): Promise<Record<string, ServiceDoctorMapping[]>> {
  const { data, error } = await supabase
    .from("service_doctors")
    .select("service_id, doctor_id, price_label");
  if (error) throw error;
  const out: Record<string, ServiceDoctorMapping[]> = {};
  for (const row of data ?? []) {
    (out[row.service_id] ??= []).push({ doctorId: row.doctor_id, priceLabel: row.price_label });
  }
  return out;
}
