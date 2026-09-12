-- The assistant carries the whole conversation, until a person switches it.
--
-- Requested by the clinic: the assistant was stopping on its own — an unknown
-- question, a complaint, a low-confidence turn — and every stop left a patient
-- waiting for a human who might be hours away. With this on, the Off / Draft /
-- Replies switch is the only thing that hands a thread back.
--
-- Two things it deliberately does NOT change, because neither is ours to waive:
-- pain, swelling, bleeding and anything else clinical still wait for a person,
-- and free text outside Meta's 24-hour window is still a policy violation.
ALTER TABLE public.whatsapp_ai_settings
  ADD COLUMN IF NOT EXISTS full_conversation boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.whatsapp_ai_settings.full_conversation IS
  'Answer every turn except clinical and emergency, and ignore the '
  'per-conversation hourly cap. A person switches the assistant off; it no '
  'longer bows out by itself.';
