"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { resolvePatientId } from "@/services/patient_profiles/mutations";
import { consumablesCheckoutSchema } from "@/services/inventory/schemas";
import type { Reservation, ReservationInsert, ReservationUpdate } from "./types";
import * as mutations from "./mutations";

export async function createReservation(
  payload: ReservationInsert,
): Promise<Reservation> {
  const auth = await requirePermission("reservations.create");
  if (auth.error) throw new Error("Forbidden");
  const patient_id = await resolvePatientId(auth.supabase, {
    patientId: payload.patient_id,
    displayName: payload.patient_name,
    phone: payload.phone,
    email: payload.email,
  });
  return mutations.createReservation(auth.supabase, { ...payload, patient_id });
}

export async function updateReservation(
  id: string,
  payload: ReservationUpdate,
): Promise<Reservation> {
  const auth = await requirePermission("reservations.edit");
  if (auth.error) throw new Error("Forbidden");
  // Completion now has an irreversible side effect (inventory deducts) and
  // must go through completeReservation, which checks the service's recipe
  // before flipping status. This generic action must not offer a bypass.
  if (payload.status === "completed") {
    throw new Error("Use completeReservation to mark a reservation complete");
  }
  return mutations.updateReservation(auth.supabase, id, payload);
}

/**
 * The only way to mark a reservation complete. `consumables` must include a
 * qty_used for every `kind: 'variable'` recipe row on the reservation's
 * service — enforced here via zod and again inside
 * deductRecipeForCompletion, so a direct call bypassing the checkout dialog
 * hits the same validation.
 */
export async function completeReservation(
  id: string,
  consumables: unknown,
): Promise<Reservation> {
  const auth = await requirePermission("reservations.complete");
  if (auth.error) throw new Error("Forbidden");
  const usages = consumablesCheckoutSchema.parse(consumables ?? []);
  return mutations.completeReservation(auth.supabase, id, usages, auth.session.user.id);
}

export async function rescheduleReservation(
  reservation: Reservation,
  targetDate: string,
): Promise<Reservation> {
  const auth = await requirePermission("reservations.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.rescheduleReservation(auth.supabase, reservation, targetDate);
}

export async function softDeleteReservation(id: string): Promise<void> {
  const auth = await requirePermission("reservations.cancel");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteReservation(auth.supabase, id);
}
