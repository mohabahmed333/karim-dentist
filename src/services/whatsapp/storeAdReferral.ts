/**
 * Recording where a conversation came from, once.
 *
 * Attempted on every inbound message and almost always a no-op: the referral
 * only exists on the first message after an ad click, and the unique constraint
 * on conversation_id makes a second attempt harmless. Failures are swallowed —
 * knowing which ad produced a patient is worth having and never worth losing
 * their message over.
 */

import type { createServiceClient } from "@/lib/supabase/service";
import { extractAdReferral } from "./adReferral";

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function storeAdReferral(
  db: ServiceClient,
  conversationId: string,
  messageId: string | null,
  raw: unknown,
): Promise<boolean> {
  const referral = extractAdReferral(raw);
  if (!referral) return false;

  const { error } = await db
    .from("whatsapp_ad_referrals")
    .upsert(
      {
        conversation_id: conversationId,
        message_id: messageId,
        ctwa_clid: referral.ctwaClid,
        source_id: referral.sourceId,
        source_type: referral.sourceType,
        source_url: referral.sourceUrl,
        headline: referral.headline,
        body: referral.body,
        media_url: referral.mediaUrl,
      },
      { onConflict: "conversation_id", ignoreDuplicates: true },
    );

  if (!error) {
    // Loud on purpose, and only ever once per conversation: this is the signal
    // that Click-to-WhatsApp attribution is actually possible here, which two
    // separate checks suggested it might not be.
    console.info(
      `[whatsapp] ad referral captured: source_id=${referral.sourceId ?? "-"} ctwa_clid=${referral.ctwaClid ?? "-"}`,
    );
  }
  return !error;
}
