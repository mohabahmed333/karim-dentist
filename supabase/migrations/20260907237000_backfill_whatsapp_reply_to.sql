-- Backfill reply_to from Kapso context.id on existing messages
WITH targets AS (
  SELECT
    m.id AS message_id,
    m.raw #>> '{context,id}' AS context_wamid,
    c.contact_name,
    q.direction AS quoted_direction,
    q.body AS quoted_body,
    q.message_type AS quoted_type
  FROM public.whatsapp_messages AS m
  JOIN public.whatsapp_conversations AS c
    ON c.id = m.conversation_id
  LEFT JOIN public.whatsapp_messages AS q
    ON q.kapso_wamid = m.raw #>> '{context,id}'
  WHERE m.reply_to IS NULL
    AND m.raw #>> '{context,id}' IS NOT NULL
)
UPDATE public.whatsapp_messages AS m
SET
  reply_to = jsonb_build_object(
    'wamid', t.context_wamid,
    'authorName',
      CASE
        WHEN t.quoted_direction = 'outbound' THEN 'Front desk'
        ELSE COALESCE(NULLIF(t.contact_name, ''), 'Patient')
      END,
    'body', left(COALESCE(NULLIF(t.quoted_body, ''), 'Original message'), 160),
    'messageType', COALESCE(t.quoted_type, 'text')
  ),
  updated_at = now()
FROM targets AS t
WHERE m.id = t.message_id;
