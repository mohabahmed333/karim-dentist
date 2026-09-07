-- Public atomic book of an open appointment slot into a pending reservation
-- Rollback: DROP FUNCTION IF EXISTS public.book_open_appointment_slot;

CREATE OR REPLACE FUNCTION public.book_open_appointment_slot(
  p_slot_id uuid,
  p_patient_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_service_id uuid DEFAULT NULL,
  p_service_label text DEFAULT 'General consultation',
  p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.appointment_slots%ROWTYPE;
  v_reservation_id uuid;
BEGIN
  IF length(trim(p_patient_name)) < 1 THEN
    RAISE EXCEPTION 'patient_name required';
  END IF;
  IF length(trim(p_phone)) < 1 THEN
    RAISE EXCEPTION 'phone required';
  END IF;
  IF length(trim(coalesce(p_service_label, ''))) < 1 THEN
    RAISE EXCEPTION 'service_label required';
  END IF;

  SELECT * INTO v_slot
  FROM public.appointment_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;
  IF v_slot.status <> 'open' THEN
    RAISE EXCEPTION 'Slot is no longer available';
  END IF;
  IF v_slot.starts_at < now() THEN
    RAISE EXCEPTION 'Slot is in the past';
  END IF;

  INSERT INTO public.reservations (
    patient_name,
    phone,
    email,
    service_id,
    service_label,
    starts_at,
    notes,
    status
  ) VALUES (
    trim(p_patient_name),
    trim(p_phone),
    NULLIF(trim(coalesce(p_email, '')), ''),
    p_service_id,
    trim(p_service_label),
    v_slot.starts_at,
    coalesce(p_notes, ''),
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  UPDATE public.appointment_slots
  SET
    status = 'booked',
    reservation_id = v_reservation_id,
    updated_at = now()
  WHERE id = p_slot_id
    AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot is no longer available';
  END IF;

  RETURN v_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.book_open_appointment_slot(
  uuid, text, text, text, uuid, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_open_appointment_slot(
  uuid, text, text, text, uuid, text, text
) TO anon, authenticated;
