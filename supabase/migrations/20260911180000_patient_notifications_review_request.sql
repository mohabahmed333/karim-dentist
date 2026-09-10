-- Allow a review-request notification.
--
-- Queued only after a patient replies positively to a post-visit follow-up, so
-- a patient who is unhappy is never asked to rate the clinic in public.
--
-- Rollback:
--   ALTER TABLE public.patient_notifications DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;
--   ALTER TABLE public.patient_notifications ADD CONSTRAINT patient_notifications_kind_check
--     CHECK (kind IN ('confirmation','reschedule','cancellation','reminder_24h','followup','recall_6m','waitlist_offer'));

ALTER TABLE public.patient_notifications
  DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;

ALTER TABLE public.patient_notifications
  ADD CONSTRAINT patient_notifications_kind_check CHECK (kind IN (
    'confirmation', 'reschedule', 'cancellation', 'reminder_24h',
    'followup', 'recall_6m', 'waitlist_offer', 'review_request'
  ));
