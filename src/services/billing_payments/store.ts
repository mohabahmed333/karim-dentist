/**
 * Database access for billing payments. Mirrors src/services/deposits/store.ts.
 */

import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type BillingPaymentRequest = Tables<"billing_payment_requests">;

const UNIQUE_VIOLATION = "23505";

/**
 * The billing payment this conversation is currently waiting on.
 *
 * At most one exists: a partial unique index on (conversation_id) over the
 * two live statuses guarantees it.
 */
export async function findOpenBillingRequestByConversation(
  db: ServiceClient,
  conversationId: string,
): Promise<BillingPaymentRequest | null> {
  const { data } = await db
    .from("billing_payment_requests")
    .select("*")
    .eq("conversation_id", conversationId)
    .in("status", ["awaiting_receipt", "in_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export type InsertBillingRequestResult =
  | { ok: true; id: string }
  | { ok: false; duplicate: true }
  | { ok: false; duplicate: false; error: string };

export async function insertBillingPaymentRequest(
  db: ServiceClient,
  row: TablesInsert<"billing_payment_requests">,
): Promise<InsertBillingRequestResult> {
  const { data, error } = await db
    .from("billing_payment_requests")
    .insert(row)
    .select("id")
    .single();
  if (!error) return { ok: true, id: data.id };

  const code = (error as { code?: string }).code;
  if (code === UNIQUE_VIOLATION || /duplicate key/i.test(error.message)) {
    return { ok: false, duplicate: true };
  }
  return { ok: false, duplicate: false, error: error.message };
}

export type InsertBillingReceiptResult =
  | { ok: true }
  | { ok: false; duplicate: "image" | "reference" | "message" }
  | { ok: false; duplicate: null; error: string };

/**
 * Record what we were sent and what we made of it — before deciding, so two
 * webhooks carrying the same screenshot race in the database.
 */
export async function insertBillingReceipt(
  db: ServiceClient,
  row: TablesInsert<"billing_payment_receipts">,
): Promise<InsertBillingReceiptResult> {
  const { error } = await db.from("billing_payment_receipts").insert(row);
  if (!error) return { ok: true };

  const code = (error as { code?: string }).code;
  if (code === UNIQUE_VIOLATION || /duplicate key/i.test(error.message)) {
    if (/image_unique/.test(error.message)) return { ok: false, duplicate: "image" };
    if (/reference_unique/.test(error.message)) return { ok: false, duplicate: "reference" };
    return { ok: false, duplicate: "message" };
  }
  return { ok: false, duplicate: null, error: error.message };
}

export async function markBillingRequestInReview(
  db: ServiceClient,
  requestId: string,
  reason: string,
): Promise<void> {
  await db
    .from("billing_payment_requests")
    .update({ status: "in_review", decision_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", requestId);
}

/**
 * `changed` is false when the row was already decided — the RPC is
 * idempotent, so a webhook redelivery or a staff double-click must not raise.
 */
export async function confirmBillingPayment(
  db: ServiceClient,
  requestId: string,
  decidedBy: string | null,
  reason: string,
): Promise<{ ok: boolean; changed: boolean; error?: string }> {
  const { data, error } = await db.rpc("confirm_billing_payment", {
    p_billing_payment_request_id: requestId,
    p_decided_by: decidedBy ?? undefined,
    p_reason: reason,
  });
  return error
    ? { ok: false, changed: false, error: error.message }
    : { ok: true, changed: data === true };
}

export async function rejectBillingPayment(
  db: ServiceClient,
  requestId: string,
  decidedBy: string | null,
  reason: string,
): Promise<{ ok: boolean; changed: boolean; error?: string }> {
  const { data, error } = await db.rpc("reject_billing_payment", {
    p_billing_payment_request_id: requestId,
    p_decided_by: decidedBy ?? undefined,
    p_reason: reason,
  });
  return error
    ? { ok: false, changed: false, error: error.message }
    : { ok: true, changed: data === true };
}
