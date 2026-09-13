/**
 * Returning waitlist offers nobody answered to the pool.
 *
 * An offer that is never acted on used to strand the patient on `offered` for
 * good: the fan-out only ever considers `waiting`, so one unanswered message
 * quietly removed them from the list. This runs on the dispatcher's existing
 * per-minute tick and puts them back, then offers the slot to the next people
 * in line if it is still free.
 *
 * The work is a SECURITY DEFINER function because it spans two tables and has
 * to be atomic — freeing an offer and re-offering its slot in separate
 * statements would let a slot be offered to somebody who is already holding an
 * offer for it.
 */

import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * How long a patient has to answer before the slot goes back on the market.
 *
 * Matches the claim window the assistant already holds offered slots for, so a
 * patient replying at minute 29 is still honoured.
 */
export const OFFER_CLAIM_WINDOW = "30 minutes";

export async function releaseStaleWaitlistOffers(
  db: ServiceClient,
  maxAge: string = OFFER_CLAIM_WINDOW,
): Promise<number> {
  const { data, error } = await db.rpc("release_stale_waitlist_offers", {
    p_max_age: maxAge,
  });
  if (error) return 0;
  return typeof data === "number" ? data : 0;
}
