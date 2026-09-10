-- Realtime + RLS needs full row images so UPDATE/INSERT events reach the client.
ALTER TABLE public.whatsapp_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
