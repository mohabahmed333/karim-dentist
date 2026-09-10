-- WhatsApp AI auto-responder: settings, per-conversation state, job queue,
-- decision log, and the draft message shape.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.whatsapp_ai_events;
--   DROP TABLE IF EXISTS public.whatsapp_ai_jobs;
--   DROP TABLE IF EXISTS public.whatsapp_ai_state;
--   DROP TABLE IF EXISTS public.whatsapp_ai_settings;
--   ALTER TABLE public.whatsapp_messages DROP COLUMN IF EXISTS sender_kind;
--   (the status CHECK would need restoring to its pre-draft list)

-- ---------------------------------------------------------------------------
-- 1. Global settings. Deliberately NOT in site_settings: that table is in
--    CMS_SINGLETONS, so the admin chat LLM can write it via cms.update_singleton
--    — one model must never be able to switch another model on.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-4000-8000-0000000000a1'::uuid,
  mode text NOT NULL DEFAULT 'off'
    CHECK (mode IN ('off', 'draft_only', 'auto')),
  max_replies_per_conversation_per_hour int NOT NULL DEFAULT 6
    CHECK (max_replies_per_conversation_per_hour BETWEEN 0 AND 60),
  max_replies_global_per_hour int NOT NULL DEFAULT 120
    CHECK (max_replies_global_per_hour BETWEEN 0 AND 5000),
  human_handoff_minutes int NOT NULL DEFAULT 30
    CHECK (human_handoff_minutes BETWEEN 0 AND 1440),
  -- Second switch, shipped OFF: booking writes stay disabled until transcripts
  -- have been reviewed, even once mode = 'auto'.
  allow_booking_writes boolean NOT NULL DEFAULT false,
  ack_media_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.whatsapp_ai_settings (id)
SELECT '00000000-0000-4000-8000-0000000000a1'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.whatsapp_ai_settings);

-- ---------------------------------------------------------------------------
-- 2. Per-conversation state: kill switch, handoff timer, and booking progress.
--    Booking state is written only by our code after validation, so a patient
--    cannot talk a slot id or a reservation into existence by asserting it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_state (
  conversation_id uuid PRIMARY KEY
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  autoreply_enabled boolean NOT NULL DEFAULT true,
  paused_until timestamptz,
  handoff_until timestamptz,
  step text NOT NULL DEFAULT 'idle'
    CHECK (step IN ('idle', 'collecting', 'awaiting_slot', 'awaiting_confirm')),
  pending jsonb NOT NULL DEFAULT '{}'::jsonb,
  offered_slot_ids uuid[] NOT NULL DEFAULT '{}',
  offered_at timestamptz,
  state_expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Job queue. Keyed uniquely on the inbound message, so a webhook retry or a
--    sweeper pass can never produce a second reply to the same message.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  inbound_message_id uuid NOT NULL UNIQUE
    REFERENCES public.whatsapp_messages (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','sent','drafted','skipped','failed','abandoned')),
  skip_reason text,
  attempts int NOT NULL DEFAULT 0,
  -- Set once the job reaches the send call. A crash after this point must never
  -- be retried: a Kapso timeout is ambiguous (Meta may have accepted), and a
  -- duplicate WhatsApp message to a patient is worse than a missed one.
  send_started_at timestamptz,
  lease_until timestamptz,
  outbound_message_id uuid
    REFERENCES public.whatsapp_messages (id) ON DELETE SET NULL,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_ai_jobs_pending_idx
  ON public.whatsapp_ai_jobs (status, lease_until)
  WHERE status IN ('queued', 'running');

-- ---------------------------------------------------------------------------
-- 4. Decision log. `envelope` keeps the raw model output so thresholds can be
--    tuned from real traffic by query rather than by re-running anything.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.whatsapp_ai_jobs (id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.whatsapp_messages (id) ON DELETE SET NULL,
  decision text NOT NULL CHECK (decision IN ('auto_send','draft','skip','error')),
  reason text NOT NULL DEFAULT '',
  intent text,
  confidence numeric,
  language text,
  handoff boolean NOT NULL DEFAULT false,
  injection_flags text[] NOT NULL DEFAULT '{}',
  model text,
  latency_ms int,
  envelope jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_ai_events_conversation_idx
  ON public.whatsapp_ai_events (conversation_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Draft messages live in whatsapp_messages so they reach the existing
--    realtime inbox with no client subscription changes.
-- ---------------------------------------------------------------------------
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS sender_kind text NOT NULL DEFAULT 'human'
    CHECK (sender_kind IN ('human', 'ai', 'system'));

ALTER TABLE public.whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_status_check;
ALTER TABLE public.whatsapp_messages ADD CONSTRAINT whatsapp_messages_status_check
  CHECK (status IN ('draft','pending','received','sent','delivered','read','failed'));

-- A draft must never be mistakable for something the patient received.
ALTER TABLE public.whatsapp_messages
  DROP CONSTRAINT IF EXISTS whatsapp_messages_draft_shape_check;
ALTER TABLE public.whatsapp_messages ADD CONSTRAINT whatsapp_messages_draft_shape_check
  CHECK (
    status <> 'draft'
    OR (direction = 'outbound' AND kapso_wamid IS NULL AND sent_by IS NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_messages_one_draft_per_conversation
  ON public.whatsapp_messages (conversation_id)
  WHERE status = 'draft';

-- Rate limiting counts AI messages in the last hour; keep that cheap.
CREATE INDEX IF NOT EXISTS whatsapp_messages_ai_recent_idx
  ON public.whatsapp_messages (conversation_id, wa_timestamp DESC)
  WHERE sender_kind = 'ai';

-- ---------------------------------------------------------------------------
-- 6. RLS — admin-only, matching every other whatsapp_* table.
-- ---------------------------------------------------------------------------
ALTER TABLE public.whatsapp_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ai_state    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ai_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ai_events   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_ai_settings_admin_all ON public.whatsapp_ai_settings;
CREATE POLICY whatsapp_ai_settings_admin_all ON public.whatsapp_ai_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS whatsapp_ai_state_admin_all ON public.whatsapp_ai_state;
CREATE POLICY whatsapp_ai_state_admin_all ON public.whatsapp_ai_state
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS whatsapp_ai_jobs_admin_all ON public.whatsapp_ai_jobs;
CREATE POLICY whatsapp_ai_jobs_admin_all ON public.whatsapp_ai_jobs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS whatsapp_ai_events_admin_all ON public.whatsapp_ai_events;
CREATE POLICY whatsapp_ai_events_admin_all ON public.whatsapp_ai_events
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Staff toggle the per-conversation switch live, so it needs realtime.
ALTER TABLE public.whatsapp_ai_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_ai_state;
