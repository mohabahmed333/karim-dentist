-- A separate switch for recall messages.
--
-- Confirmations and reminders are utility messages a patient expects. A
-- "you're due a cleaning" message is marketing, in Meta's classification and in
-- the patient's eyes, and needs its own deliberate decision — so it does not
-- ride along when mode is set to send.
--
-- Rollback:
--   ALTER TABLE public.patient_notification_settings DROP COLUMN IF EXISTS recall_enabled;

ALTER TABLE public.patient_notification_settings
  ADD COLUMN IF NOT EXISTS recall_enabled boolean NOT NULL DEFAULT false;
