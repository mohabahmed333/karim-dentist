/**
 * Database access for deposits.
 *
 * The one unusual thing here is `insertReceipt`: the row is written *before*
 * anything is decided, and a unique-violation is a result rather than an error.
 * Two webhooks can carry the same screenshot at the same moment, and the only
 * thing that can settle that race is the database — so we ask it first and read
 * which index complained.
 */

import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type DepositSettings = Tables<"deposit_settings">;
export type DepositRequest = Tables<"deposit_requests">;

const UNIQUE_VIOLATION = "23505";

export async function loadDepositSettings(
  db: ServiceClient,
): Promise<DepositSettings | null> {
  const { data } = await db.from("deposit_settings").select("*").limit(1).maybeSingle();
  return data ?? null;
}

/**
 * The deposit this conversation is currently waiting on.
 *
 * At most one exists: a partial unique index on (conversation_id) over the two
 * live statuses guarantees it, which is what lets an inbound image be matched to
 * a deposit without any guessing.
 */
export async function findOpenRequestByConversation(
  db: ServiceClient,
  conversationId: string,
): Promise<DepositRequest | null> {
  const { data } = await db
    .from("deposit_requests")
    .select("*")
    .eq("conversation_id", conversationId)
    .in("status", ["awaiting_receipt", "in_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export type InsertReceiptResult =
  | { ok: true }
  | { ok: false; duplicate: "image" | "reference" | "message" }
  | { ok: false; duplicate: null; error: string };

/**
 * Record what we were sent and what we made of it.
 *
 * A duplicate is not a failure of ours, so it comes back as a named outcome the
 * caller turns into a verdict for the patient.
 */
export async function insertReceipt(
  db: ServiceClient,
  row: TablesInsert<"deposit_receipts">,
): Promise<InsertReceiptResult> {
  const { error } = await db.from("deposit_receipts").insert(row);
  if (!error) return { ok: true };

  const code = (error as { code?: string }).code;
  if (code === UNIQUE_VIOLATION || /duplicate key/i.test(error.message)) {
    if (/image_unique/.test(error.message)) return { ok: false, duplicate: "image" };
    if (/reference_unique/.test(error.message)) return { ok: false, duplicate: "reference" };
    return { ok: false, duplicate: "message" };
  }
  return { ok: false, duplicate: null, error: error.message };
}

/**
 * Park a deposit with staff.
 *
 * Moving to `in_review` also stops the clock: the expiry sweep only looks at
 * `awaiting_receipt`, so a patient whose receipt we could not read does not lose
 * their slot to a timer while a human is still looking at it.
 */
export async function markInReview(
  db: ServiceClient,
  requestId: string,
  reason: string,
): Promise<void> {
  await db
    .from("deposit_requests")
    .update({ status: "in_review", decision_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", requestId);
}

export async function confirmDepositPaid(
  db: ServiceClient,
  requestId: string,
  decidedBy: string | null,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.rpc("confirm_deposit_paid", {
    p_deposit_request_id: requestId,
    p_decided_by: decidedBy ?? undefined,
    p_reason: reason,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function rejectDeposit(
  db: ServiceClient,
  requestId: string,
  decidedBy: string | null,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.rpc("reject_deposit", {
    p_deposit_request_id: requestId,
    p_decided_by: decidedBy ?? undefined,
    p_reason: reason,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Holds whose time is up, oldest first. */
export async function findExpiredRequests(
  db: ServiceClient,
  now: Date,
  limit: number,
): Promise<DepositRequest[]> {
  const { data } = await db
    .from("deposit_requests")
    .select("*")
    .eq("status", "awaiting_receipt")
    .lte("expires_at", now.toISOString())
    .order("expires_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}

export async function expireDepositHold(
  db: ServiceClient,
  requestId: string,
): Promise<boolean> {
  const { data, error } = await db.rpc("expire_deposit_hold", {
    p_deposit_request_id: requestId,
  });
  return !error && data === true;
}
