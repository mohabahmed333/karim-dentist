-- Let the public booking UI see open + booked slot times (no patient data).
-- Booked rows stay non-bookable via book_open_appointment_slot.

DROP POLICY IF EXISTS appointment_slots_public_read_open ON public.appointment_slots;
DROP POLICY IF EXISTS appointment_slots_public_read_availability ON public.appointment_slots;

CREATE POLICY appointment_slots_public_read_availability
  ON public.appointment_slots
  FOR SELECT TO anon, authenticated
  USING (
    status IN ('open', 'booked')
    AND starts_at >= now() - interval '1 hour'
  );
