-- Indexed phone lookup for WhatsApp conversations.
--
-- The notification dispatcher has to find the conversation belonging to a
-- reservation's phone number, and often to create one — a patient who booked on
-- the website may never have messaged the clinic. Scanning whatsapp_conversations
-- on every dispatch is what this avoids.
--
-- Mirrors 20260910170000_reservations_phone_suffix.sql exactly, including its
-- reasoning: canonicalization only rewrites the prefix (stripping `00`,
-- expanding local `01…` to `201…`), so the last 8 digits are invariant and the
-- suffix is a safe narrowing filter. phonesMatch() still makes the real decision
-- in JS — see pickConversation() in src/services/patient_notifications.
--
-- Rollback:
--   DROP INDEX IF EXISTS public.whatsapp_conversations_phone_suffix_idx;
--   ALTER TABLE public.whatsapp_conversations DROP COLUMN IF EXISTS phone_suffix;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS phone_suffix text
  GENERATED ALWAYS AS (right(regexp_replace(phone_number, '[^0-9]', '', 'g'), 8)) STORED;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_phone_suffix_idx
  ON public.whatsapp_conversations (phone_suffix);
