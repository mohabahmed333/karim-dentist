-- Allow soft-hide archive on WhatsApp conversations.
-- Rollback:
--   UPDATE public.whatsapp_conversations SET status = 'active' WHERE status = 'archived';
--   ALTER TABLE public.whatsapp_conversations DROP CONSTRAINT whatsapp_conversations_status_check;
--   ALTER TABLE public.whatsapp_conversations
--     ADD CONSTRAINT whatsapp_conversations_status_check
--     CHECK (status IN ('active', 'ended'));

ALTER TABLE public.whatsapp_conversations
  DROP CONSTRAINT IF EXISTS whatsapp_conversations_status_check;

ALTER TABLE public.whatsapp_conversations
  ADD CONSTRAINT whatsapp_conversations_status_check
  CHECK (status IN ('active', 'ended', 'archived'));
