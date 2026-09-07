import { createClient } from "@/lib/supabase/client";
import { shiftStartsAtToDate } from "./timeline";
import type { Reservation, ReservationInsert, ReservationUpdate } from "./types";

export async function createReservation(
  payload: ReservationInsert,
): Promise<Reservation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReservation(
  id: string,
  payload: ReservationUpdate,
): Promise<Reservation> {
  const supabase = createClient();
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
  reservation: Reservation,
  targetDate: string,
): Promise<Reservation> {
  const starts_at = shiftStartsAtToDate(reservation.starts_at, targetDate);
  return updateReservation(reservation.id, { starts_at });
}

export async function softDeleteReservation(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reservations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
