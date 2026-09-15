"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { confirmBillingPayment, rejectBillingPayment } from "./store";
import { notifyBillingPaymentConfirmed } from "./notify";

/**
 * Confirm or reject a WhatsApp billing payment from the review queue.
 *
 * Uses the service client for the actual RPC call, same as the deposits
 * confirm/reject route — confirm_billing_payment/reject_billing_payment are
 * SECURITY DEFINER, service_role-only, because they must also be callable
 * from the unauthenticated webhook path. The permission check below is the
 * real gate.
 */
export async function decideBillingPayment(
  requestId: string,
  decision: "confirm" | "reject",
  reason = "",
): Promise<{ ok: boolean }> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const service = createServiceClient();
  const decidedBy = auth.session.user.id;
  const finalReason = reason || `${decision}ed by staff`;

  const result =
    decision === "confirm"
      ? await confirmBillingPayment(service, requestId, decidedBy, finalReason)
      : await rejectBillingPayment(service, requestId, decidedBy, finalReason);

  if (!result.ok) throw new Error(result.error ?? "Could not apply");

  // Only a decision that actually moved the row notifies: the RPC is
  // idempotent, so a double-click must not thank the patient twice.
  if (decision === "confirm" && result.changed) {
    await notifyBillingPaymentConfirmed(service, requestId);
  }

  return { ok: true };
}
