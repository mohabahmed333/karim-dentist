-- Keep last_inbound_at in sync with the newest inbound message (24h window).
-- Rollback: no-op (column values only).

UPDATE public.whatsapp_conversations AS c
SET last_inbound_at = sub.last_at
FROM (
  SELECT conversation_id, max(wa_timestamp) AS last_at
  FROM public.whatsapp_messages
  WHERE direction = 'inbound'
  GROUP BY conversation_id
) AS sub
WHERE c.id = sub.conversation_id
  AND (c.last_inbound_at IS NULL OR c.last_inbound_at < sub.last_at);
