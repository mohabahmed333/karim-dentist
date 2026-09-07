import { createClient } from "@/lib/supabase/client";
import type { Reservation } from "./types";
import {
  isReservationStatus,
  sanitizeIlike,
  type ReservationListFilters,
} from "./listFilters";

export async function listReservations(): Promise<Reservation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getReservation(id: string): Promise<Reservation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

type ServerClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export async function listReservationsServer(
  supabase: ServerClient,
  filters?: Partial<ReservationListFilters> | null,
): Promise<Reservation[]> {
  let query = supabase
    .from("reservations")
    .select("*")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true });

  if (filters?.from) {
    query = query.gte(
      "starts_at",
      new Date(`${filters.from}T00:00:00`).toISOString(),
    );
  }
  if (filters?.to) {
    query = query.lte(
      "starts_at",
      new Date(`${filters.to}T23:59:59.999`).toISOString(),
    );
  }
  if (filters?.status && isReservationStatus(filters.status)) {
    query = query.eq("status", filters.status);
  }
  if (filters?.serviceIds && filters.serviceIds.length > 0) {
    query = query.in("service_id", filters.serviceIds);
  }
  if (filters?.q) {
    const safe = sanitizeIlike(filters.q);
    if (safe) {
      query = query.or(`patient_name.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function countPendingReservationsServer(
  supabase: ServerClient,
): Promise<number> {
  const { count, error } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}
