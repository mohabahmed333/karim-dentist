import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import { deductRecipeForCompletion } from "@/services/inventory/mutations";
import type { ConsumableUsage } from "@/services/inventory/types";
import { shiftStartsAtToDate } from "./timeline";
import type { Reservation, ReservationInsert, ReservationUpdate } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createReservation(
  supabase: AnySupabase,
  payload: ReservationInsert,
): Promise<Reservation> {
  const { data, error } = await supabase
    .from("reservations")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReservation(
  supabase: AnySupabase,
  id: string,
  payload: ReservationUpdate,
): Promise<Reservation> {
  const { data, error } = await supabase
    .from("reservations")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function rescheduleReservation(
  supabase: AnySupabase,
  reservation: Reservation,
  targetDate: string,
): Promise<Reservation> {
  const starts_at = shiftStartsAtToDate(reservation.starts_at, targetDate);
  return updateReservation(supabase, reservation.id, { starts_at });
}

export async function softDeleteReservation(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * The only path to status = 'completed'. Fixed-kit recipe rows deduct
 * silently; variable rows must already carry a qty_used > 0 in `usages`
 * (validated by the caller — see reservations/actions.ts) or
 * deductRecipeForCompletion throws before status ever changes, so a
 * required consumable prompt cannot be skipped by completing the visit
 * first and logging inventory later.
 *
 * Only reservations with no patient_treatments rows for the visit should
 * call this — one with treatment rows is completed by completing those
 * treatments instead, so the same service isn't deducted twice (also
 * enforced by inventory_transactions' partial unique indexes).
 */
export async function completeReservation(
  supabase: AnySupabase,
  id: string,
  usages: ConsumableUsage[],
  createdBy: string,
): Promise<Reservation> {
  const { data: existing, error: fetchError } = await supabase
    .from("reservations")
    .select("id, status, service_id")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;
  if (existing.status === "completed") {
    throw new Error("Reservation is already completed");
  }

  if (existing.service_id) {
    await deductRecipeForCompletion(supabase, {
      serviceId: existing.service_id,
      reservationId: id,
      patientTreatmentId: null,
      usages,
      createdBy,
    });
  }

  return updateReservation(supabase, id, { status: "completed" });
}
