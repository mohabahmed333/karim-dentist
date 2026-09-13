-- Remove WhatsApp demo/seed conversations (and their cascaded messages,
-- notes, and AI state/jobs/events) from earlier UX and showreel seeding.
-- Real conversations synced from Kapso never carry this marker.
DELETE FROM public.whatsapp_conversations
WHERE (metadata->>'is_demo') = 'true';
