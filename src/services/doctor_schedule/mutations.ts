import type { createClient as createServerClient } from "@/lib/supabase/server";
import { regenerateDoctorOpenSlotsWithClient } from "@/services/clinic_schedule";
import {
  doctorHoursUpsertSchema,
  type DoctorHoursUpsertValues,
} from "./schemas";
import type { DoctorHours } from "./types";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

const CLINIC_HOURS_ID = "00000000-0000-4000-8000-000000000001";

export async function saveDoctorHours(
  supabase: ServerSupabase,
  doctorId: string,
  input: DoctorHoursUpsertValues,
): Promise<DoctorHours> {
  const parsed = doctorHoursUpsertSchema.parse(input);
  const { data, error } = await supabase
    .from("doctor_hours")
    .upsert({
      doctor_id: doctorId,
      open_weekdays: parsed.open_weekdays,
      time_windows: parsed.time_windows,
      slot_minutes: parsed.slot_minutes,
      is_bookable: parsed.is_bookable,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DoctorHours;
}

async function clinicHorizonDays(supabase: ServerSupabase): Promise<number> {
  const { data, error } = await supabase
    .from("clinic_hours")
    .select("horizon_days")
    .eq("id", CLINIC_HOURS_ID)
    .maybeSingle();
  if (error) throw error;
  return data?.horizon_days ?? 21;
}

/** Regenerate one doctor's upcoming open slots; every other doctor is untouched. */
export async function regenerateOneDoctorSlots(
  supabase: ServerSupabase,
  doctorId: string,
): Promise<number> {
  const { data: hours, error } = await supabase
    .from("doctor_hours")
    .select("*")
    .eq("doctor_id", doctorId)
    .maybeSingle();
  if (error) throw error;
  if (!hours) {
    throw new Error("This doctor has no hours configured yet");
  }
  const horizonDays = await clinicHorizonDays(supabase);
  return regenerateDoctorOpenSlotsWithClient(
    supabase,
    doctorId,
    hours,
    horizonDays,
  );
}

/** Regenerate every bookable doctor's slots, one doctor at a time. */
export async function regenerateAllDoctorSlots(
  supabase: ServerSupabase,
): Promise<{ doctorId: string; created: number }[]> {
  const horizonDays = await clinicHorizonDays(supabase);
  const { data: rows, error } = await supabase
    .from("doctor_hours")
    .select("*")
    .eq("is_bookable", true);
  if (error) throw error;

  const results: { doctorId: string; created: number }[] = [];
  for (const hours of rows ?? []) {
    const created = await regenerateDoctorOpenSlotsWithClient(
      supabase,
      hours.doctor_id,
      hours,
      horizonDays,
    );
    results.push({ doctorId: hours.doctor_id, created });
  }
  return results;
}
