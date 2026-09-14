-- Stage 2 of multi-doctor: the WhatsApp booking flow gains a doctor step
-- (Service -> Doctor -> Date/time -> Confirm), so the persisted step enum
-- needs a new value between "collecting" and "awaiting_slot".
--
-- Rollback:
--   ALTER TABLE public.whatsapp_ai_state DROP CONSTRAINT IF EXISTS whatsapp_ai_state_step_check;
--   ALTER TABLE public.whatsapp_ai_state
--     ADD CONSTRAINT whatsapp_ai_state_step_check
--     CHECK (step IN ('idle', 'collecting', 'awaiting_slot', 'awaiting_confirm'));
--   (first UPDATE any 'awaiting_doctor' rows back to 'collecting')

ALTER TABLE public.whatsapp_ai_state
  DROP CONSTRAINT IF EXISTS whatsapp_ai_state_step_check;

ALTER TABLE public.whatsapp_ai_state
  ADD CONSTRAINT whatsapp_ai_state_step_check
  CHECK (step IN ('idle', 'collecting', 'awaiting_doctor', 'awaiting_slot', 'awaiting_confirm'));
