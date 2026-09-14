-- Case-based billing: a treatment proposal or a manual billing entry can now
-- be tied to the specific reservation/visit it belongs to, the same way
-- patient_treatments.reservation_id already works
-- (see 20260904150000_patient_treatments_reservation.sql — this copies that
-- exact shape). Nullable: an entry with no reservation picked behaves
-- exactly as it does today.
--
-- Rollback:
--   DROP INDEX IF EXISTS public.patient_billing_entries_reservation_idx;
--   ALTER TABLE public.patient_billing_entries DROP COLUMN IF EXISTS reservation_id;
--   DROP INDEX IF EXISTS public.treatment_proposals_reservation_idx;
--   ALTER TABLE public.treatment_proposals DROP COLUMN IF EXISTS reservation_id;

ALTER TABLE public.treatment_proposals
  ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS treatment_proposals_reservation_idx
  ON public.treatment_proposals (reservation_id) WHERE reservation_id IS NOT NULL;

ALTER TABLE public.patient_billing_entries
  ADD COLUMN IF NOT EXISTS reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS patient_billing_entries_reservation_idx
  ON public.patient_billing_entries (reservation_id) WHERE reservation_id IS NOT NULL;
