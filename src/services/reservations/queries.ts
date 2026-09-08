import { createClient } from "@/lib/supabase/client";
import type { Reservation } from "./types";
import {
  isReservationStatus,
  sanitizeIlike,
  type ReservationListFilters,
  type ReservationSortKey,
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

function applyReservationFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: Partial<ReservationListFilters> | null,
  opts?: { applyDate?: boolean },
) {
  const applyDate = opts?.applyDate !== false;
  if (applyDate && filters?.from) {
    query = query.gte(
      "starts_at",
      new Date(`${filters.from}T00:00:00`).toISOString(),
    );
  }
  if (applyDate && filters?.to) {
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
      query = query.or(
        `patient_name.ilike.%${safe}%,phone.ilike.%${safe}%,service_label.ilike.%${safe}%`,
      );
    }
  }
  return query;
}

function sortColumn(sort?: ReservationSortKey): string {
  switch (sort) {
    case "patient_name":
    case "phone":
    case "service_label":
    case "status":
    case "starts_at":
      return sort;
    default:
      return "starts_at";
  }
}

/** Full list (calendar / history). Optional filters; no pagination. */
export async function listReservationsServer(
  supabase: ServerClient,
  filters?: Partial<ReservationListFilters> | null,
): Promise<Reservation[]> {
  let query = supabase
    .from("reservations")
    .select("*")
    .is("deleted_at", null);

  query = applyReservationFilters(query, filters);
  query = query.order(sortColumn(filters?.sort), {
    ascending: (filters?.dir ?? "asc") === "asc",
  });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Paginated table rows + exact total for the same filters. */
export async function listReservationsPageServer(
  supabase: ServerClient,
  filters: Partial<ReservationListFilters>,
): Promise<{ items: Reservation[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 8));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("reservations")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  query = applyReservationFilters(query, filters);
  query = query
    .order(sortColumn(filters.sort), {
      ascending: (filters.dir ?? "desc") === "asc",
    })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
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
