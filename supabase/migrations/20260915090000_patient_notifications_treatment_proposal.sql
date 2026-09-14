-- Allow a treatment_proposal notification (discovered missing during
-- treatment-proposals smoke testing: patient_notifications.kind has a CHECK
-- constraint that must list every kind explicitly, same as
-- 20260911180000_patient_notifications_review_request.sql added
-- review_request).
--
-- Rollback:
--   ALTER TABLE public.patient_notifications DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;
--   ALTER TABLE public.patient_notifications ADD CONSTRAINT patient_notifications_kind_check
--     CHECK (kind IN ('confirmation','reschedule','cancellation','reminder_24h','followup','recall_6m','waitlist_offer','review_request'));

ALTER TABLE public.patient_notifications
  DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;

ALTER TABLE public.patient_notifications
  ADD CONSTRAINT patient_notifications_kind_check CHECK (kind IN (
    'confirmation', 'reschedule', 'cancellation', 'reminder_24h',
    'followup', 'recall_6m', 'waitlist_offer', 'review_request',
    'treatment_proposal'
  ));
