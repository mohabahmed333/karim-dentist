/**
 * Reads for the admin billing-payments review queue. Mirrors
 * src/services/deposits/queries.ts's toQueueRow/listDeposits shape.
 */

import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type BillingPaymentQueueRow = {
  id: string;
  status: string;
  amountEgp: number;
  description: string;
  createdAt: string;
  decisionReason: string;
  phone: string;
  patientName: string;
  receipt: {
    id: string;
    imageUrl: string;
    amountEgp: number | null;
    reference: string | null;
    senderName: string | null;
    recipientName: string | null;
    recipientHandle: string | null;
    transferredAt: string | null;
    confidence: number | null;
    verdict: string;
    verdictReason: string;
    createdAt: string;
  } | null;
  receiptCount: number;
};

const SELECT = `
  id, status, amount_egp, description, created_at, decision_reason, phone, patient_name,
  billing_payment_receipts (
    id, image_url, amount_egp, reference, sender_name, recipient_name,
    recipient_handle, transferred_at, confidence, verdict, verdict_reason,
    extracted, created_at
  )
`;

type Raw = {
  id: string;
  status: string;
  amount_egp: number | string;
  description: string;
  created_at: string;
  decision_reason: string;
  phone: string;
  patient_name: string;
  billing_payment_receipts: {
    id: string;
    image_url: string;
    amount_egp: number | string | null;
    reference: string | null;
    sender_name: string | null;
    recipient_name: string | null;
    recipient_handle: string | null;
    transferred_at: string | null;
    confidence: number | string | null;
    verdict: string;
    verdict_reason: string;
    extracted: unknown;
    created_at: string;
  }[];
};

const num = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function toQueueRow(raw: Raw): BillingPaymentQueueRow {
  const receipts = [...(raw.billing_payment_receipts ?? [])].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  const latest = receipts[0] ?? null;

  return {
    id: raw.id,
    status: raw.status,
    amountEgp: num(raw.amount_egp) ?? 0,
    description: raw.description,
    createdAt: raw.created_at,
    decisionReason: raw.decision_reason ?? "",
    phone: raw.phone,
    patientName: raw.patient_name,
    receipt: latest
      ? {
          id: latest.id,
          imageUrl: latest.image_url,
          amountEgp: num(latest.amount_egp),
          reference: latest.reference,
          senderName: latest.sender_name,
          recipientName: latest.recipient_name,
          recipientHandle: latest.recipient_handle,
          transferredAt: latest.transferred_at,
          confidence: num(latest.confidence),
          verdict: latest.verdict,
          verdictReason: latest.verdict_reason,
          createdAt: latest.created_at,
        }
      : null,
    receiptCount: receipts.length,
  };
}

/** Every billing payment request awaiting a decision, newest first. */
export async function listPendingBillingPayments(
  supabase: ServerSupabase,
): Promise<BillingPaymentQueueRow[]> {
  const { data, error } = await supabase
    .from("billing_payment_requests")
    .select(SELECT)
    .in("status", ["awaiting_receipt", "in_review"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Raw[]).map(toQueueRow);
}
