import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
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
