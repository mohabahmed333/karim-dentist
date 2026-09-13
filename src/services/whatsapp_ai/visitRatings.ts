/**
 * Keeping the score a patient gave a visit.
 *
 * The assistant already told us whether a follow-up reply was positive or
 * negative, which is enough to decide about a review request and not enough to
 * run a clinic by: "fine" and "excellent" are both positive, and a 2 is a phone
 * call waiting to happen.
 *
 * Writing is deliberately best-effort. A rating is worth having and never worth
 * failing a reply over, so every error is swallowed — the patient has already
 * been answered by the time this runs.
 */

import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** At or below this, someone should ring them rather than read a statistic. */
export const NEEDS_CALL_AT_OR_BELOW = 3;

export type RatingInput = {
  conversationId: string;
  reservationId?: string | null;
  /** The inbound message that carried the score; makes the write idempotent. */
  messageId: string;
  phone: string;
  rating: number | null | undefined;
  comment?: string | null;
};

/** Whether this is a score we can store, rather than the model's enthusiasm. */
export function isStorableRating(rating: number | null | undefined): rating is number {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export function needsCall(rating: number): boolean {
  return rating <= NEEDS_CALL_AT_OR_BELOW;
}

export async function recordVisitRating(
  db: ServiceClient,
  input: RatingInput,
): Promise<boolean> {
  if (!isStorableRating(input.rating)) return false;

  // message_id is unique, so a redelivered webhook updates rather than
  // duplicates — a patient does not get counted twice for one message.
  const { error } = await db.from("visit_ratings").upsert(
    {
      conversation_id: input.conversationId,
      reservation_id: input.reservationId ?? null,
      message_id: input.messageId,
      phone: input.phone,
      rating: input.rating,
      comment: (input.comment ?? "").slice(0, 2000),
      needs_call: needsCall(input.rating),
    },
    { onConflict: "message_id" },
  );
  return !error;
}
