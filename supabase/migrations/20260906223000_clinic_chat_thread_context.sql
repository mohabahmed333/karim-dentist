-- Persist receptionist active-patient context on the shared thread
-- Rollback: ALTER TABLE public.clinic_chat_threads DROP COLUMN IF EXISTS context;

ALTER TABLE public.clinic_chat_threads
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb;
