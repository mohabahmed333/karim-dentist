import type { createClient as createServerClient } from "@/lib/supabase/server";
import {
  DAY_SCHEDULE_SLOT_MS,
  isReservationExpired,
} from "@/features/admin/lib/dayScheduleModel";
import type { Reservation } from "@/services/reservations/types";
import type { AdminNotificationCounts } from "./groups";

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

async function countSent(supabase: ServerClient): Promise<number> {
  try {
    const { count } = await supabase
      .from("treatment_proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent");
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countPaymentsToReview(supabase: ServerClient): Promise<number> {
  try {
    const { count } = await supabase
      .from("billing_payment_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countPendingBookings(supabase: ServerClient): Promise<number> {
  try {
    const { count } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Inventory on hand comes from batches, so low stock cannot be a plain count. */
async function countLowStock(supabase: ServerClient): Promise<number> {
  try {
    const [items, batches] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("id, min_stock_level")
        .is("deleted_at", null)
        .gt("min_stock_level", 0),
      supabase.from("inventory_batches").select("item_id, qty_remaining"),
    ]);
    const onHand = new Map<string, number>();
    for (const row of batches.data ?? []) {
      onHand.set(row.item_id, (onHand.get(row.item_id) ?? 0) + row.qty_remaining);
    }
    return (items.data ?? []).filter(
      (item) => (onHand.get(item.id) ?? 0) <= item.min_stock_level,
    ).length;
  } catch {
    return 0;
  }
}

/**
 * Visits whose slot ran out while nobody closed them off.
 *
 * Derived from the clock exactly as the My Day rail derives it, so the bell and
 * the rail can never disagree about what "overdue" means. Only today's: an
 * appointment from last month is a records problem, not something to chase now.
 */
async function countOverdue(supabase: ServerClient): Promise<number> {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("reservations")
      .select("id, starts_at, status")
      .is("deleted_at", null)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", new Date(now.getTime() - DAY_SCHEDULE_SLOT_MS).toISOString())
      .in("status", ["pending", "confirmed"]);
    return (data ?? []).filter((row) =>
      isReservationExpired(row as Reservation, now.getTime()),
    ).length;
  } catch {
    return 0;
  }
}

/**
 * Everything the bell counts, in one round trip's worth of parallel queries.
 *
 * Each leg swallows its own failure: a bell that throws would take the whole
 * admin shell down with it, and a missing count is a far smaller problem than
 * a blank screen.
 */
export async function loadAdminNotificationCounts(
  supabase: ServerClient,
): Promise<AdminNotificationCounts> {
  const [bills, payments, pendingBookings, overdue, lowStock] = await Promise.all([
    countSent(supabase),
    countPaymentsToReview(supabase),
    countPendingBookings(supabase),
    countOverdue(supabase),
    countLowStock(supabase),
  ]);

  return { bills, payments, pendingBookings, overdue, lowStock };
}
