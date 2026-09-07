import { createClient } from "@/lib/supabase/client";
import { regenerateOpenSlotsWithClient } from "./regenerate";
import {
  clinicHoursUpsertSchema,
  type ClinicHoursUpsertValues,
} from "./schemas";
import type { AppointmentSlot, ClinicHours } from "./types";

const HOURS_ID = "00000000-0000-4000-8000-000000000001";

export async function saveClinicHours(
  input: ClinicHoursUpsertValues,
): Promise<ClinicHours> {
  const parsed = clinicHoursUpsertSchema.parse(input);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_hours")
    .upsert({
      id: HOURS_ID,
      open_weekdays: parsed.open_weekdays,
      time_windows: parsed.time_windows,
      slot_minutes: parsed.slot_minutes,
      horizon_days: parsed.horizon_days,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  await regenerateOpenSlots(data as ClinicHours);
  return data as ClinicHours;
}

/** Rebuild upcoming open slots from hours; keep booked rows. */
export async function regenerateOpenSlots(
  hours: ClinicHours,
): Promise<number> {
  return regenerateOpenSlotsWithClient(createClient(), hours);
}

export async function bookAppointmentSlot(input: {
  slotId: string;
  reservationId: string;
}): Promise<AppointmentSlot> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointment_slots")
    .update({
      status: "booked",
      reservation_id: input.reservationId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.slotId)
    .eq("status", "open")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Slot is no longer available");
  return data as AppointmentSlot;
}

export async function releaseAppointmentSlot(
  reservationId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("appointment_slots")
    .update({
      status: "open",
      reservation_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("reservation_id", reservationId)
    .eq("status", "booked");
  if (error) throw error;
}

/** Book the open slot whose starts_at matches (admin schedule sync). */
export async function bookOpenSlotMatchingStartsAt(input: {
  startsAtIso: string;
  reservationId: string;
}): Promise<AppointmentSlot | null> {
  const supabase = createClient();
  const { data: slot, error: findError } = await supabase
    .from("appointment_slots")
    .select("*")
    .eq("status", "open")
    .eq("starts_at", input.startsAtIso)
    .maybeSingle();
  if (findError) throw findError;
  if (!slot) return null;
  return bookAppointmentSlot({
    slotId: slot.id,
    reservationId: input.reservationId,
  });
}
