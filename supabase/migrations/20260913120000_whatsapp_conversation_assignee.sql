-- Allow assigning a WhatsApp conversation to a staff member (profiles.role = 'admin').
-- Rollback:
--   ALTER TABLE public.whatsapp_conversations DROP COLUMN IF EXISTS assignee_id;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_assignee_id_idx
  ON public.whatsapp_conversations (assignee_id);
