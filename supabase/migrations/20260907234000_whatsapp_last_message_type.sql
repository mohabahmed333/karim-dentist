-- Last message type for Front desk inbox previews
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS last_message_type text NOT NULL DEFAULT 'text';

UPDATE public.whatsapp_conversations AS c
SET last_message_type = COALESCE(
  (
    SELECT m.message_type
    FROM public.whatsapp_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.wa_timestamp DESC, m.id DESC
    LIMIT 1
  ),
  'text'
);
