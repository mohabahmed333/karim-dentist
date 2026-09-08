-- Track last inbound WhatsApp message for Meta 24h customer-care window.
-- Rollback:
--   ALTER TABLE public.whatsapp_conversations DROP COLUMN IF EXISTS last_inbound_at;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz NULL;

UPDATE public.whatsapp_conversations c
SET last_inbound_at = sub.last_at
FROM (
  SELECT conversation_id, max(wa_timestamp) AS last_at
  FROM public.whatsapp_messages
  WHERE direction = 'inbound'
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id
  AND c.last_inbound_at IS NULL;
