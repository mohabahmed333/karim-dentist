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

/**
 * Atomically create a reservation and book it into an open slot.
 *
 * Unlike `createReservation` + `bookAppointmentSlot` run back to back, this
 * cannot leave an orphaned "pending" reservation with no slot behind it if
 * the slot was taken between being offered and being confirmed — the RPC
 * does both writes as one transaction and fails the whole thing instead.
 */
export async function bookOpenSlotForNewReservation(input: {
  slotId: string;
  patientName: string;
  phone: string;
  serviceLabel: string;
  serviceId?: string | null;
  email?: string | null;
  notes?: string;
}): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("book_open_appointment_slot", {
    p_slot_id: input.slotId,
    p_patient_name: input.patientName,
    p_phone: input.phone,
    p_email: input.email ?? null,
    p_service_id: input.serviceId ?? null,
    p_service_label: input.serviceLabel,
    p_notes: input.notes ?? "",
  });
  if (error) throw error;
  if (!data) throw new Error("Booking did not return a reservation");
  return data as string;
}

/**
 * Atomically move a reservation onto a different open slot.
 *
 * Releases the reservation's current slot and books the new one in the same
 * transaction — `updateReservation` + `bookAppointmentSlot` run separately
 * books the new slot but never frees the old one, leaking it as permanently
 * "booked" with no reservation attached.
 */
export async function rescheduleReservationToSlot(input: {
  reservationId: string;
  slotId: string;
  phone?: string | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("reschedule_reservation_to_slot", {
    p_reservation_id: input.reservationId,
    p_slot_id: input.slotId,
    p_phone: input.phone ?? null,
  });
  if (error) throw error;
}

/**
 * Atomically cancel a reservation and free the slot it held, if any.
 *
 * A bare status update to "cancelled" leaves that slot stuck as "booked"
 * forever, quietly shrinking future availability.
 */
export async function cancelReservationAndReleaseSlot(input: {
  reservationId: string;
  phone?: string | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("cancel_reservation_and_release_slot", {
    p_reservation_id: input.reservationId,
    p_phone: input.phone ?? null,
  });
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
