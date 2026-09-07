-- Last outbound/inbound delivery status for Front desk inbox ticks
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS last_message_status text NOT NULL DEFAULT 'received'
    CHECK (last_message_status IN (
      'pending', 'received', 'sent', 'delivered', 'read', 'failed'
    ));

UPDATE public.whatsapp_conversations AS c
SET last_message_status = COALESCE(
  (
    SELECT m.status
    FROM public.whatsapp_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.wa_timestamp DESC, m.id DESC
    LIMIT 1
  ),
  'received'
);
