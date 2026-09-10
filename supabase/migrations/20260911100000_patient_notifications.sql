-- Outbound patient notification outbox: settings, opt-outs, and the queue.
--
-- Nothing writes here yet — the reservations trigger arrives in the next
-- migration and the dispatcher in application code. This is the storage only,
-- so that it can be reviewed on its own.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.patient_notifications;
--   DROP TABLE IF EXISTS public.patient_notification_optouts;
--   DROP TABLE IF EXISTS public.patient_notification_settings;

-- ---------------------------------------------------------------------------
-- 1. Global settings. Deliberately NOT in site_settings, for the same reason
--    whatsapp_ai_settings is not: that table is in CMS_SINGLETONS, so the admin
--    chat LLM can write it. No model may switch on messaging to patients.
--
--    Ships with mode = 'off'. Rollout is off -> dry_run for a week -> send.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_notification_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-4000-8000-0000000000b1'::uuid,
  mode text NOT NULL DEFAULT 'off'
    CHECK (mode IN ('off', 'dry_run', 'send')),
  timezone text NOT NULL DEFAULT 'Africa/Cairo',
  -- Quiet hours are a half-open window [start, end) in local time, crossing
  -- midnight. 22 -> 9 means nothing is sent between 22:00 and 08:59.
  quiet_hours_start int NOT NULL DEFAULT 22
    CHECK (quiet_hours_start BETWEEN 0 AND 23),
  quiet_hours_end int NOT NULL DEFAULT 9
    CHECK (quiet_hours_end BETWEEN 0 AND 23),
  max_per_patient_per_day int NOT NULL DEFAULT 3
    CHECK (max_per_patient_per_day BETWEEN 0 AND 20),
  -- How far ahead of the appointment the reminder goes out. The approved
  -- reminder template says "tomorrow", so values far from 1440 make it lie;
  -- the dispatcher re-checks that the appointment really is tomorrow.
  reminder_lead_minutes int NOT NULL DEFAULT 1440
    CHECK (reminder_lead_minutes BETWEEN 60 AND 10080),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.patient_notification_settings (id)
SELECT '00000000-0000-4000-8000-0000000000b1'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.patient_notification_settings);

-- ---------------------------------------------------------------------------
-- 2. Opt-out, keyed on the last 8 digits so it survives the many shapes one
--    Egyptian number is written in: +20 100 555 1234, 0100-555-1234,
--    00201005551234. Same convention as reservations.phone_suffix and
--    phoneSuffixForLookup() in src/services/reservations/phoneSuffix.ts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_notification_optouts (
  phone_suffix text PRIMARY KEY,
  phone text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. The outbox.
--
--    Every patient-facing field is snapshotted at enqueue time. The dispatcher
--    must describe what was true when the event happened, not re-read a
--    reservation that may have changed again since — which also makes sending
--    a pure function of one row, and therefore testable.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES public.reservations (id) ON DELETE CASCADE,

  kind text NOT NULL CHECK (kind IN (
    'confirmation', 'reschedule', 'cancellation',
    'reminder_24h', 'followup', 'recall_6m', 'waitlist_offer'
  )),

  -- Exactly-once key, e.g. '<uuid>:reminder_24h:1784275200'.
  --
  -- Deliberately not (reservation_id, kind): a reservation may be rescheduled
  -- many times, and each move is a different thing to say and a new reminder to
  -- arm. Keying on the starts_at epoch makes each move its own event, while a
  -- webhook retry, a double-click, or a repeated UPDATE all collapse into one.
  dedupe_key text NOT NULL,

  -- Which actor caused this. The dispatcher uses it to stay quiet when the
  -- WhatsApp bot has already told the patient in its own words.
  source text NOT NULL DEFAULT 'unknown',

  phone text NOT NULL,
  phone_suffix text GENERATED ALWAYS AS
    (right(regexp_replace(phone, '[^0-9]', '', 'g'), 8)) STORED,
  patient_name text NOT NULL DEFAULT '',
  service_label text NOT NULL DEFAULT '',
  starts_at timestamptz,

  -- Resolved by the dispatcher rather than the trigger: language detection is
  -- JS, and recording the outcome makes "why did this go out in Arabic?"
  -- answerable after the fact.
  language text CHECK (language IN ('ar', 'en')),
  template_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  conversation_id uuid
    REFERENCES public.whatsapp_conversations (id) ON DELETE SET NULL,

  scheduled_for timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sending', 'sent', 'failed',
    'skipped', 'superseded', 'abandoned'
  )),
  skip_reason text,
  attempts int NOT NULL DEFAULT 0,
  lease_until timestamptz,

  -- Set immediately before the Kapso call, mirroring whatsapp_ai_jobs. Anything
  -- past this point is abandoned rather than retried: a provider timeout is
  -- ambiguous, and a duplicate WhatsApp message to a patient is worse than a
  -- missed one.
  send_started_at timestamptz,

  sent_at timestamptz,
  outbound_message_id uuid
    REFERENCES public.whatsapp_messages (id) ON DELETE SET NULL,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Exactly-once. Full, not partial: a superseded or failed row must still block
-- a duplicate, or a retried UPDATE would re-send what staff had cancelled.
CREATE UNIQUE INDEX IF NOT EXISTS patient_notifications_dedupe_idx
  ON public.patient_notifications (dedupe_key);

-- The dispatcher's claim query.
CREATE INDEX IF NOT EXISTS patient_notifications_due_idx
  ON public.patient_notifications (scheduled_for, created_at)
  WHERE status IN ('pending', 'sending');

-- Superseding everything still pending for one reservation, on cancel/reschedule.
CREATE INDEX IF NOT EXISTS patient_notifications_reservation_pending_idx
  ON public.patient_notifications (reservation_id)
  WHERE status = 'pending';

-- The per-patient daily cap.
CREATE INDEX IF NOT EXISTS patient_notifications_sent_per_phone_idx
  ON public.patient_notifications (phone_suffix, sent_at DESC)
  WHERE status = 'sent';

-- ---------------------------------------------------------------------------
-- 4. RLS. Admin-only reads, as everywhere else in this schema.
--
--    There is deliberately no insert policy for anon or authenticated: the only
--    writer is the SECURITY DEFINER trigger, and the only reader-writer at
--    runtime is the dispatcher's service-role client, which bypasses RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.patient_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notification_optouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_notifications_admin_all ON public.patient_notifications;
CREATE POLICY patient_notifications_admin_all ON public.patient_notifications
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS patient_notification_settings_admin_all
  ON public.patient_notification_settings;
CREATE POLICY patient_notification_settings_admin_all
  ON public.patient_notification_settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS patient_notification_optouts_admin_all
  ON public.patient_notification_optouts;
CREATE POLICY patient_notification_optouts_admin_all
  ON public.patient_notification_optouts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
