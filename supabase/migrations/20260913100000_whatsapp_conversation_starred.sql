-- Add a starred flag so front desk can favorite important conversations.
-- Rollback:
--   ALTER TABLE public.whatsapp_conversations DROP COLUMN IF EXISTS starred;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;
