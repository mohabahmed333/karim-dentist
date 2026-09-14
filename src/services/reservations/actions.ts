"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { resolvePatientId } from "@/services/patient_profiles/mutations";
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
  return mutations.updateReservation(auth.supabase, id, payload);
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
