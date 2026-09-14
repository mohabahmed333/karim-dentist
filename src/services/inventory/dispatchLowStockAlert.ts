/**
 * Send one queued low-stock alert.
 *
 * Dependencies are injected, mirroring dispatchNotification.ts: the ordering
 * of side effects is the interesting behaviour, and that's only testable if
 * they're substitutable. Never throws — every path resolves to a recorded
 * status, since the caller runs on a cron where an exception is invisible.
 */

import type { InventoryAlertsMode } from "./types";
import type { DueAlert, FinishPatch } from "./store";

export type LowStockAlertOutcome = {
  status: "sent" | "skipped" | "failed";
  reason: string;
  messageId?: string | null;
};

export type ResolvedItemInfo = {
  itemName: string;
  itemNameAr: string;
  unit: string;
  supplierName: string | null;
  supplierPhone: string | null;
  lastUnitCostEgp: number | null;
};

export type LowStockDispatchDeps = {
  now: () => Date;
  mode: InventoryAlertsMode;
  managerPhone: string | null;
  clinicName: string;
  hasTransport: boolean;
  resolveItemInfo: (itemId: string, supplierId: string | null) => Promise<ResolvedItemInfo>;
  hasRecentSend: (itemId: string, qtyOnHand: number) => Promise<boolean>;
  markSendStarted: (id: string) => Promise<void>;
  send: (input: {
    to: string;
    itemInfo: ResolvedItemInfo;
    row: DueAlert;
  }) => Promise<{ id: string | null }>;
  finish: (id: string, patch: FinishPatch) => Promise<void>;
};

export async function dispatchLowStockAlert(
  deps: LowStockDispatchDeps,
  row: DueAlert,
): Promise<LowStockAlertOutcome> {
  try {
    if (deps.mode === "off") {
      await deps.finish(row.id, { status: "skipped", skipReason: "mode_off" });
      return { status: "skipped", reason: "mode_off" };
    }
    if (!deps.managerPhone) {
      await deps.finish(row.id, { status: "skipped", skipReason: "no_manager_phone" });
      return { status: "skipped", reason: "no_manager_phone" };
    }

    // Throttle real sends: stock that has sat below threshold and already
    // triggered a recent send is skipped unless it has dropped further —
    // the daily dedupe key still recorded the condition; this just decides
    // whether to actually message about it again today.
    if (await deps.hasRecentSend(row.item_id, row.qty_on_hand)) {
      await deps.finish(row.id, { status: "skipped", skipReason: "recently_sent" });
      return { status: "skipped", reason: "recently_sent" };
    }

    if (!deps.hasTransport) {
      await deps.finish(row.id, { status: "failed", lastError: "WhatsApp transport not configured" });
      return { status: "failed", reason: "no_transport" };
    }

    const itemInfo = await deps.resolveItemInfo(row.item_id, row.supplier_id);

    if (deps.mode === "dry_run") {
      // Record exactly what would have gone out, send nothing.
      await deps.finish(row.id, { status: "sent", sentAt: deps.now().toISOString() });
      return { status: "sent", reason: "dry_run" };
    }

    await deps.markSendStarted(row.id);
    const result = await deps.send({ to: deps.managerPhone, itemInfo, row });
    await deps.finish(row.id, { status: "sent", sentAt: deps.now().toISOString() });
    return { status: "sent", reason: "ok", messageId: result.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dispatch failed";
    await deps.finish(row.id, { status: "failed", lastError: message }).catch(() => undefined);
    return { status: "failed", reason: message };
  }
}
