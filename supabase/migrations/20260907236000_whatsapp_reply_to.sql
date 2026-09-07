-- Reply-to quote payload for WhatsApp-style replies
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS reply_to jsonb;

CREATE INDEX IF NOT EXISTS whatsapp_messages_kapso_wamid_idx
  ON public.whatsapp_messages (kapso_wamid)
  WHERE kapso_wamid IS NOT NULL;
