-- An off switch for each patient-facing feature.
--
-- Everything here was gated only by whether it *could* run: a template
-- approved, a key set, the right mode. That answers "is this possible" and
-- never "do we want it", so a clinic that wanted reminders but not follow-ups
-- had no way to say so short of withholding a template.
--
-- One row per feature, ANDed with every other condition: a switch that is off
-- stops the feature whatever else is configured. Seeded on, so nothing that
-- works today stops working when this lands — the switch adds a veto, it does
-- not withdraw consent already given.
--
-- Deposits keep their own switch in deposit_settings rather than gaining a
-- second one here; two switches for one feature is how a clinic ends up unable
-- to explain why nothing is sending.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.notification_feature_switches;

CREATE TABLE IF NOT EXISTS public.notification_feature_switches (
  feature_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The keys are the ones the readiness checklist already uses, so a switch and
-- the explanation of why a feature is not working sit on the same row.
INSERT INTO public.notification_feature_switches (feature_key) VALUES
  ('confirmations'),
  ('reminders'),
  ('cancellations'),
  ('reschedules'),
  ('waitlist'),
  ('followups'),
  ('recalls'),
  ('reviews'),
  ('cancel_by_reply'),
  ('voice_notes'),
  ('knowledge'),
  ('review_queue'),
  ('stop')
ON CONFLICT (feature_key) DO NOTHING;

ALTER TABLE public.notification_feature_switches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notification_feature_switches_admin_all
  ON public.notification_feature_switches;
CREATE POLICY notification_feature_switches_admin_all
  ON public.notification_feature_switches
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
