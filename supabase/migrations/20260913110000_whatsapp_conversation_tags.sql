-- Add a real tags column, replacing the front-end dummy tag data.
-- Rollback:
--   ALTER TABLE public.whatsapp_conversations DROP COLUMN IF EXISTS tags;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS whatsapp_conversations_tags_idx
  ON public.whatsapp_conversations USING gin (tags);
