/**
 * Drain the low-stock alert outbox.
 *
 * Wires the real dependencies; kept separate from dispatchLowStockAlert so
 * the decisions stay testable without a database, the same split as
 * patient_notifications/runDispatch.ts vs dispatchNotification.ts.
 *
 * Sends via sendKapsoPayload directly (not sendWhatsappMessage): this is a
 * staff broadcast with no whatsapp_conversations row and no 24h customer-
 * service session to be inside of, so the patient-conversation transport
 * would reject it outright.
 */

import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import { sendKapsoPayload } from "@/services/whatsapp/sendKapso";
import type { createServiceClient } from "@/lib/supabase/service";
import {
  dispatchLowStockAlert,
  type LowStockAlertOutcome,
  type ResolvedItemInfo,
} from "./dispatchLowStockAlert";
import { claim, findDue, finish, hasRecentSend, loadSettings, markSendStarted, sweepExpiredLeases } from "./store";

type ServiceClient = ReturnType<typeof createServiceClient>;

const BATCH_SIZE = 20;
export const LOW_STOCK_TEMPLATE_NAME = "inventory_low_stock_alert";

async function resolveItemInfo(
  db: ServiceClient,
  itemId: string,
  supplierId: string | null,
): Promise<ResolvedItemInfo> {
  const [{ data: item }, { data: supplier }] = await Promise.all([
    db.from("inventory_items").select("name,name_ar,unit,last_unit_cost_egp").eq("id", itemId).maybeSingle(),
    supplierId
      ? db.from("suppliers").select("name,phone,whatsapp_phone").eq("id", supplierId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    itemName: item?.name ?? "Unknown item",
    itemNameAr: item?.name_ar ?? "",
    unit: item?.unit ?? "unit",
    supplierName: supplier?.name ?? null,
    supplierPhone: supplier?.whatsapp_phone || supplier?.phone || null,
    lastUnitCostEgp: item?.last_unit_cost_egp ?? null,
  };
}

export async function runInventoryAlertDispatch(
  db: ServiceClient,
  now: Date = new Date(),
): Promise<{ claimed: number; swept: number; outcomes: LowStockAlertOutcome[] }> {
  const swept = await sweepExpiredLeases(db, now);
  const settings = await loadSettings(db);
  const due = await findDue(db, now, BATCH_SIZE);

  let hasTransport = true;
  try {
    getKapsoConfig();
  } catch {
    hasTransport = false;
  }

  const outcomes: LowStockAlertOutcome[] = [];
  let claimed = 0;

  for (const row of due) {
    if (!(await claim(db, row.id, now, row.attempts))) continue;
    claimed += 1;

    outcomes.push(
      await dispatchLowStockAlert(
        {
          now: () => now,
          mode: settings.mode,
          managerPhone: settings.manager_whatsapp_phone,
          clinicName: "Clinic",
          hasTransport,
          resolveItemInfo: (itemId, supplierId) => resolveItemInfo(db, itemId, supplierId),
          hasRecentSend: (itemId, qtyOnHand) =>
            hasRecentSend(db, itemId, now, settings.realert_after_days, qtyOnHand),
          markSendStarted: (id) => markSendStarted(db, id),
          async send({ to, itemInfo, row: dueRow }) {
            const config = getKapsoConfig();
            const priceLine = itemInfo.lastUnitCostEgp
              ? `Last price: ${itemInfo.lastUnitCostEgp} EGP.`
              : "";
            const supplierLine = itemInfo.supplierName
              ? `Supplier: ${itemInfo.supplierName}${itemInfo.supplierPhone ? `, ${itemInfo.supplierPhone}` : ""}. ${priceLine}`
              : "No supplier on file for this item — add one from the item's settings.";
            const bodyText =
              `${itemInfo.itemName} is at ${dueRow.qty_on_hand} ${itemInfo.unit}` +
              `${itemInfo.unit === "unit" ? "s" : ""}, below the ${dueRow.min_stock_level} minimum. ` +
              `Suggested reorder: ${dueRow.suggested_reorder_qty}. ${supplierLine} Please reorder.`;

            const result = await sendKapsoPayload({
              client: createKapsoClient(),
              phoneNumberId: config.phoneNumberId,
              to,
              kind: "template",
              template: {
                name: LOW_STOCK_TEMPLATE_NAME,
                language: "en",
                body: [{ type: "text", text: bodyText }],
              },
            });
            return { id: result.wamid };
          },
          finish: (id, patch) => finish(db, id, patch),
        },
        row,
      ),
    );
  }

  return { claimed, swept, outcomes };
}
