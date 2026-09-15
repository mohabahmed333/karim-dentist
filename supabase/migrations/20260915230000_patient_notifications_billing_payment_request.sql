-- Allow a billing_payment_request notification — the fallback used when a
-- WhatsApp billing-payment ask is sent while the patient's 24h session is
-- closed. Same pattern as 20260915090000_patient_notifications_treatment_proposal.sql.
--
-- Rollback:
--   ALTER TABLE public.patient_notifications DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;
--   ALTER TABLE public.patient_notifications ADD CONSTRAINT patient_notifications_kind_check
--     CHECK (kind IN ('confirmation','reschedule','cancellation','reminder_24h','followup','recall_6m','waitlist_offer','review_request','treatment_proposal'));

ALTER TABLE public.patient_notifications
  DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;

ALTER TABLE public.patient_notifications
  ADD CONSTRAINT patient_notifications_kind_check CHECK (kind IN (
    'confirmation', 'reschedule', 'cancellation', 'reminder_24h',
    'followup', 'recall_6m', 'waitlist_offer', 'review_request',
    'treatment_proposal', 'billing_payment_request'
  ));
