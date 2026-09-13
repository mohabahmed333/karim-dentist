-- Who has agreed to be marketed to.
--
-- Meta separates UTILITY messages — a confirmation, a reminder, something the
-- patient asked for — from MARKETING, which needs explicit opt-in and is rate
-- limited. Sending marketing to people who never agreed is the fastest way to
-- get a clinic's WhatsApp number restricted, and a restricted number takes the
-- confirmations and reminders down with it.
--
-- So consent is a table, not a column: recorded per phone with where it came
-- from and when, and withdrawable. Keyed on the last eight digits like every
-- other patient lookup here, because the same person appears as +20 1xx, 01xx
-- and 201xx across the booking form, the bot and the clinic's own records.
--
-- Deliberately separate from patient_notification_optouts. Opting out of
-- everything and never having opted in to marketing are different states, and
-- collapsing them would let "I never agreed" read as "they unsubscribed".
--
-- Rollback:
--   DROP TABLE IF EXISTS public.patient_marketing_consent;

CREATE TABLE IF NOT EXISTS public.patient_marketing_consent (
  phone_suffix text PRIMARY KEY,
  phone text NOT NULL,
  /** How it was obtained: 'whatsapp_reply', 'booking_form', 'in_clinic', 'import'. */
  source text NOT NULL DEFAULT 'unknown',
  /** The patient's own words, when consent came from a message. */
  evidence text NOT NULL DEFAULT '',
  consented_at timestamptz NOT NULL DEFAULT now(),
  /** Set when they withdraw. A row is kept so the history survives. */
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The only question asked of this table at send time.
CREATE INDEX IF NOT EXISTS patient_marketing_consent_active_idx
  ON public.patient_marketing_consent (phone_suffix)
  WHERE withdrawn_at IS NULL;

ALTER TABLE public.patient_marketing_consent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS patient_marketing_consent_admin_all ON public.patient_marketing_consent;
CREATE POLICY patient_marketing_consent_admin_all ON public.patient_marketing_consent
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
