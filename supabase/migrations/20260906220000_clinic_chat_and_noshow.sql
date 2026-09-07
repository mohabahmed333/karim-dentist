-- Clinic receptionist chat (shared) + no_show reservation status
-- Rollback:
--   DROP TABLE IF EXISTS public.clinic_chat_messages;
--   DROP TABLE IF EXISTS public.clinic_chat_threads;
--   ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
--   ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check
--     CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

CREATE TABLE IF NOT EXISTS public.clinic_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Reception',
  kind text NOT NULL DEFAULT 'home'
    CHECK (kind IN ('home', 'session')),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clinic_chat_threads_home_unique
  ON public.clinic_chat_threads ((true))
  WHERE kind = 'home';

CREATE INDEX IF NOT EXISTS clinic_chat_threads_updated_at_idx
  ON public.clinic_chat_threads (updated_at DESC);

CREATE TABLE IF NOT EXISTS public.clinic_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.clinic_chat_threads (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL DEFAULT '',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinic_chat_messages_thread_created_idx
  ON public.clinic_chat_messages (thread_id, created_at);

ALTER TABLE public.clinic_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinic_chat_threads_admin_all ON public.clinic_chat_threads;
CREATE POLICY clinic_chat_threads_admin_all ON public.clinic_chat_threads
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS clinic_chat_messages_admin_all ON public.clinic_chat_messages;
CREATE POLICY clinic_chat_messages_admin_all ON public.clinic_chat_messages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
