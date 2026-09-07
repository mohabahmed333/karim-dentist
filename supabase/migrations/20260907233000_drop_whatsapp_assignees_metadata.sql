-- Drop unused Front desk metadata keys (assignees / decorative tags no longer in UI)
UPDATE public.whatsapp_conversations
SET metadata = (metadata - 'assignees'),
    updated_at = now()
WHERE metadata ? 'assignees';
