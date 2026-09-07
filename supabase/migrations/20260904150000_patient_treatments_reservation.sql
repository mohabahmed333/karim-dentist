-- Link required treatments to their booked reservation
-- Rollback: ALTER TABLE public.patient_treatments DROP COLUMN IF EXISTS reservation_id;

ALTER TABLE public.patient_treatments
  ADD COLUMN IF NOT EXISTS reservation_id uuid
    REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS patient_treatments_reservation_id_idx
  ON public.patient_treatments (reservation_id)
  WHERE reservation_id IS NOT NULL;
