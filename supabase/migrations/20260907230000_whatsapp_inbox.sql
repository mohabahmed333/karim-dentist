-- WhatsApp inbox (Kapso sync → Supabase source of truth)
-- Rollback:
--   DROP TABLE IF EXISTS public.whatsapp_webhook_events;
--   DROP TABLE IF EXISTS public.whatsapp_messages;
--   DROP TABLE IF EXISTS public.whatsapp_conversations;

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kapso_conversation_id text UNIQUE,
  phone_number text NOT NULL,
  contact_name text,
  patient_key text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  last_message_at timestamptz,
  last_message_preview text NOT NULL DEFAULT '',
  unread_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_conversations_last_message_idx
  ON public.whatsapp_conversations (last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS whatsapp_conversations_phone_idx
  ON public.whatsapp_conversations (phone_number);

CREATE INDEX IF NOT EXISTS whatsapp_conversations_patient_key_idx
  ON public.whatsapp_conversations (patient_key)
  WHERE patient_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  kapso_wamid text UNIQUE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  sent_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  wa_timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_conversation_time_idx
  ON public.whatsapp_messages (conversation_id, wa_timestamp);

CREATE TABLE IF NOT EXISTS public.whatsapp_webhook_events (
  idempotency_key text PRIMARY KEY,
  event text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_conversations_admin_all ON public.whatsapp_conversations;
CREATE POLICY whatsapp_conversations_admin_all ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS whatsapp_messages_admin_all ON public.whatsapp_messages;
CREATE POLICY whatsapp_messages_admin_all ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS whatsapp_webhook_events_admin_select ON public.whatsapp_webhook_events;
CREATE POLICY whatsapp_webhook_events_admin_select ON public.whatsapp_webhook_events
  FOR SELECT TO authenticated
  USING (public.is_admin());
