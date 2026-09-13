/**
 * Reads for the admin deposits screen.
 *
 * Shaped for the one question staff actually have in front of a receipt: does
 * this pay for that appointment? So each row carries the amount asked beside
 * the amount read, the reason the machine was unsure, and the appointment it
 * belongs to — rather than making someone open three screens to find out.
 */

import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type DepositQueueRow = {
  id: string;
  status: string;
  amountAskedEgp: number;
  expiresAt: string;
  createdAt: string;
  decisionReason: string;
  phone: string;
  patientName: string;
  serviceLabel: string;
  startsAt: string | null;
  conversationId: string | null;
  /** The latest receipt, which is the one a decision is about. */
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
    suspiciousText: string;
    createdAt: string;
  } | null;
  receiptCount: number;
};

const SELECT = `
  id, status, amount_egp, expires_at, created_at, decision_reason, phone,
  conversation_id,
  reservations ( patient_name, service_label, starts_at ),
  deposit_receipts (
    id, image_url, amount_egp, reference, sender_name, recipient_name,
    recipient_handle, transferred_at, confidence, verdict, verdict_reason,
    extracted, created_at
  )
`;

type Raw = {
  id: string;
  status: string;
  amount_egp: number | string;
  expires_at: string;
  created_at: string;
  decision_reason: string;
  phone: string;
  conversation_id: string | null;
  reservations: { patient_name: string; service_label: string; starts_at: string } | null;
  deposit_receipts: {
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

/** Postgres returns numeric as a string; a UI comparing money must not guess. */
export function toQueueRow(raw: Raw): DepositQueueRow {
  const receipts = [...(raw.deposit_receipts ?? [])].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  const latest = receipts[0] ?? null;
  const extracted = (latest?.extracted ?? {}) as { suspiciousText?: unknown };

  return {
    id: raw.id,
    status: raw.status,
    amountAskedEgp: num(raw.amount_egp) ?? 0,
    expiresAt: raw.expires_at,
    createdAt: raw.created_at,
    decisionReason: raw.decision_reason ?? "",
    phone: raw.phone,
    patientName: raw.reservations?.patient_name ?? "",
    serviceLabel: raw.reservations?.service_label ?? "",
    startsAt: raw.reservations?.starts_at ?? null,
    conversationId: raw.conversation_id,
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
          suspiciousText:
            typeof extracted.suspiciousText === "string" ? extracted.suspiciousText : "",
          createdAt: latest.created_at,
        }
      : null,
    receiptCount: receipts.length,
  };
}

/**
 * The queue, newest first.
 *
 * `in_review` first by default because those are the ones waiting on a person;
 * the settled ones are history and only there for context.
 */
export async function listDeposits(
  db: ServiceClient,
  opts: { status?: string; limit?: number } = {},
): Promise<DepositQueueRow[]> {
  let query = db
    .from("deposit_requests")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Raw[]).map(toQueueRow);
}
