/**
 * Releasing slots whose deposit was never paid.
 *
 * Rides the dispatcher's existing per-minute tick rather than adding a cron:
 * Vercel's Hobby plan caps crons at one a day, and pg_cron already calls the
 * dispatch route every minute for the outbox.
 *
 * Releasing the slot is what makes the deposit worth collecting. It also feeds
 * the waitlist for free: `expire_deposit_hold` flips the slot back to open,
 * which fires `appointment_slots_offer_waitlist` and offers it to the three
 * longest-waiting matching patients. The no-show protection and the revenue
 * recovery are the same mechanism.
 *
 * Only `awaiting_receipt` rows are touched. A deposit sitting in `in_review` has
 * a receipt a person is still looking at, and its clock is deliberately stopped:
 * a patient must never lose their slot because our own reading failed.
 */

import type { createServiceClient } from "@/lib/supabase/service";
import { receiptOutcomeMessage, type Language } from "./receiptMessages";
import { expireDepositHold, findExpiredRequests, loadDepositSettings } from "./store";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Matches the dispatcher's own batch size. */
const BATCH_SIZE = 10;

export type SweepDeps = {
  /**
   * Tell the patient their hold lapsed. Optional, and only called after the
   * slot is already released: a send that fails must not keep a slot booked.
   */
  notify?: (input: {
    conversationId: string;
    text: string;
  }) => Promise<void>;
  language?: (request: { phone: string }) => Language;
};

export type SweepResult = { expired: number; notified: number };

export async function sweepExpiredHolds(
  db: ServiceClient,
  now: Date = new Date(),
  deps: SweepDeps = {},
): Promise<SweepResult> {
  const settings = await loadDepositSettings(db);
  // Nothing to sweep when the feature was never switched on. Note this is not
  // gated on the notification mode: releasing a held slot is a booking
  // operation, not a message, so holds still expire with messaging turned off.
  if (!settings) return { expired: 0, notified: 0 };

  const due = await findExpiredRequests(db, now, BATCH_SIZE);
  if (due.length === 0) return { expired: 0, notified: 0 };

  let expired = 0;
  let notified = 0;

  for (const request of due) {
    // The RPC re-checks the deadline under a row lock, so two ticks racing
    // cannot both release, and a receipt that landed a moment ago wins.
    const released = await expireDepositHold(db, request.id).catch(() => false);
    if (!released) continue;
    expired += 1;

    if (!deps.notify || !request.conversation_id) continue;
    const language = deps.language?.({ phone: request.phone }) ?? "ar";
    try {
      await deps.notify({
        conversationId: request.conversation_id,
        text: receiptOutcomeMessage({
          reason: "hold_expired",
          language,
          amountEgp: Number(request.amount_egp),
        }),
      });
      notified += 1;
    } catch {
      // The slot is already free, which is the part that matters. A patient who
      // is not told will simply find the time gone, and staff see the row.
    }
  }

  return { expired, notified };
}
