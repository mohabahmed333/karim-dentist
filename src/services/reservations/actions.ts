"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { Reservation, ReservationInsert, ReservationUpdate } from "./types";
import * as mutations from "./mutations";

export async function createReservation(
  payload: ReservationInsert,
): Promise<Reservation> {
  const auth = await requirePermission("reservations.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createReservation(auth.supabase, payload);
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
