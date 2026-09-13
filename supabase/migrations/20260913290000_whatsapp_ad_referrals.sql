-- Which ad a conversation came from, if WhatsApp ever tells us.
--
-- Meta attaches a `referral` object to the first inbound message after a
-- Click-to-WhatsApp ad is tapped. Two things say it may never reach us: no
-- production message has ever carried one, and the Kapso SDK does not model the
-- field at all. This exists anyway because the raw payload is already stored,
-- so capturing costs nothing and the alternative is finding out months later
-- that the data was arriving and being thrown away.
--
-- One row per conversation, not per message: the referral arrives once, on the
-- first message, and a second one would be a different conversation. The unique
-- constraint is what makes the insert safe to attempt on every inbound message.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.whatsapp_ad_referrals;

CREATE TABLE IF NOT EXISTS public.whatsapp_ad_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL UNIQUE
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.whatsapp_messages (id) ON DELETE SET NULL,
  /** Meta's click id — the join key back to the ad account. */
  ctwa_clid text,
  /** The ad or post id, which is what a report is grouped by. */
  source_id text,
  source_type text,
  source_url text,
  headline text,
  body text,
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_ad_referrals_source_idx
  ON public.whatsapp_ad_referrals (source_id, created_at DESC)
  WHERE source_id IS NOT NULL;

ALTER TABLE public.whatsapp_ad_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_ad_referrals_admin_all ON public.whatsapp_ad_referrals;
CREATE POLICY whatsapp_ad_referrals_admin_all ON public.whatsapp_ad_referrals
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
