/**
 * Database access for the low-stock alert outbox.
 *
 * Mirrors src/services/patient_notifications/store.ts's claim/lease
 * discipline, scoped down: there is exactly one recipient (the clinic
 * manager), so there is no per-patient opt-out, marketing consent, or
 * quiet-hours check here — those stay specific to the patient pipeline.
 */

import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";
import type { InventorySettings } from "./types";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Long enough for a slow Kapso call, short enough that a crash frees the row. */
const LEASE_SECONDS = 90;

const DEFAULT_SETTINGS: InventorySettings = {
  id: "00000000-0000-4000-8000-0000000000c1",
  mode: "off",
  manager_whatsapp_phone: null,
  wastage_approval_threshold_egp: 500,
  wastage_photo_threshold_egp: 1000,
  realert_after_days: 3,
  updated_at: new Date(0).toISOString(),
};

export async function loadSettings(db: ServiceClient): Promise<InventorySettings> {
  const { data } = await db.from("inventory_settings").select("*").limit(1).maybeSingle();
  // Absent settings must read as "off", never as "send".
  return data ?? DEFAULT_SETTINGS;
}

export type DueAlert = {
  id: string;
  item_id: string;
  qty_on_hand: number;
  min_stock_level: number;
  suggested_reorder_qty: number;
  supplier_id: string | null;
  payload: Record<string, unknown>;
  scheduled_for: string;
  attempts: number;
};

export async function findDue(
  db: ServiceClient,
  now: Date,
  limit: number,
): Promise<DueAlert[]> {
  const { data } = await db
    .from("inventory_alerts")
    .select(
      "id,item_id,qty_on_hand,min_stock_level,suggested_reorder_qty,supplier_id,payload,scheduled_for,attempts",
    )
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);
  return (data ?? []) as unknown as DueAlert[];
}

/** The status filter is the lock: two dispatchers racing on the same row
 * means exactly one UPDATE matches, and the loser gets no row back. */
export async function claim(
  db: ServiceClient,
  id: string,
  now: Date,
  attempts: number,
): Promise<boolean> {
  const { data } = await db
    .from("inventory_alerts")
    .update({
      status: "sending",
      lease_until: new Date(now.getTime() + LEASE_SECONDS * 1000).toISOString(),
      attempts: attempts + 1,
      updated_at: now.toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  return Boolean(data?.length);
}

export type FinishPatch = {
  status: "sent" | "failed" | "skipped";
  skipReason?: string | null;
  lastError?: string | null;
  sentAt?: string | null;
};

export async function finish(db: ServiceClient, id: string, patch: FinishPatch): Promise<void> {
  const row: TablesUpdate<"inventory_alerts"> = {
    status: patch.status,
    updated_at: new Date().toISOString(),
    lease_until: null,
  };
  if (patch.skipReason !== undefined) row.skip_reason = patch.skipReason;
  if (patch.lastError !== undefined) row.last_error = patch.lastError;
  if (patch.sentAt !== undefined) row.sent_at = patch.sentAt;
  await db.from("inventory_alerts").update(row).eq("id", id);
}

export async function markSendStarted(db: ServiceClient, id: string): Promise<void> {
  await db.from("inventory_alerts").update({ send_started_at: new Date().toISOString() }).eq("id", id);
}

/** Rows whose lease expired: returned to the queue, or failed if mid-send —
 * a stock alert can safely retry (unlike a patient message, a duplicate
 * WhatsApp ping to staff about low stock is a non-issue), so nothing here
 * is permanently abandoned. */
export async function sweepExpiredLeases(db: ServiceClient, now: Date): Promise<number> {
  const { data } = await db
    .from("inventory_alerts")
    .update({ status: "pending", lease_until: null })
    .eq("status", "sending")
    .lt("lease_until", now.toISOString())
    .select("id");
  return data?.length ?? 0;
}

/** Has this item had a real 'sent' alert within the settings' re-alert
 * window, at a stock level no lower than today's? If so, today's row should
 * be skipped rather than sent — the daily dedupe key still gets created (so
 * a further drop escalates same-day), but actual WhatsApp sends stay
 * throttled to at most one per realert_after_days unless stock worsens. */
export async function hasRecentSend(
  db: ServiceClient,
  itemId: string,
  now: Date,
  realertAfterDays: number,
  qtyOnHand: number,
): Promise<boolean> {
  const since = new Date(now.getTime() - realertAfterDays * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db
    .from("inventory_alerts")
    .select("qty_on_hand")
    .eq("item_id", itemId)
    .eq("status", "sent")
    .gte("sent_at", since)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  return qtyOnHand >= data.qty_on_hand;
}
