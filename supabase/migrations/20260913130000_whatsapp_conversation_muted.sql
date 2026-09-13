-- Allow muting/snoozing a WhatsApp conversation until a given time.
-- Rollback:
--   ALTER TABLE public.whatsapp_conversations DROP COLUMN IF EXISTS muted_until;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS muted_until timestamptz;
