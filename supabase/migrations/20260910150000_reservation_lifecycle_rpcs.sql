-- Atomic cancel and reschedule, so the AI action adapters (and later the
-- WhatsApp bot) cannot strand a reservation or double-book a slot.
--
-- Authorization is enforced inside the function because SECURITY DEFINER
-- bypasses RLS: either the caller is an admin, or they prove ownership of the
-- reservation by phone. The service-role client (used by the WhatsApp webhook)
-- has no auth.uid(), so is_admin() is false for it and the phone check applies.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.cancel_reservation_and_release_slot(uuid, text);
--   DROP FUNCTION IF EXISTS public.reschedule_reservation_to_slot(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.assert_reservation_access(
  p_reservation public.reservations,
  p_phone text
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN;
  END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) = 0 THEN
    RAISE EXCEPTION 'Not authorised for this reservation';
  END IF;
  IF regexp_replace(p_reservation.phone, '[^0-9]', '', 'g')
     <> regexp_replace(p_phone, '[^0-9]', '', 'g') THEN
    RAISE EXCEPTION 'Not authorised for this reservation';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_reservation_and_release_slot(
  p_reservation_id uuid,
  p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation public.reservations%ROWTYPE;
BEGIN
  SELECT * INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  PERFORM public.assert_reservation_access(v_reservation, p_phone);

  IF v_reservation.status = 'cancelled' THEN
    RETURN v_reservation.id;  -- idempotent: a repeated cancel is not an error
  END IF;

  UPDATE public.reservations
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_reservation_id;

  UPDATE public.appointment_slots
  SET status = 'open', reservation_id = NULL, updated_at = now()
  WHERE reservation_id = p_reservation_id AND status = 'booked';

  RETURN v_reservation.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reschedule_reservation_to_slot(
  p_reservation_id uuid,
  p_slot_id uuid,
  p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation public.reservations%ROWTYPE;
  v_slot public.appointment_slots%ROWTYPE;
BEGIN
  SELECT * INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  PERFORM public.assert_reservation_access(v_reservation, p_phone);

  IF v_reservation.status = 'cancelled' THEN
    RAISE EXCEPTION 'Reservation is cancelled';
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

  -- Release the old slot before taking the new one, so the unique index on
  -- starts_at cannot trip when moving within the same time.
  UPDATE public.appointment_slots
  SET status = 'open', reservation_id = NULL, updated_at = now()
  WHERE reservation_id = p_reservation_id AND status = 'booked';

  UPDATE public.appointment_slots
  SET status = 'booked', reservation_id = p_reservation_id, updated_at = now()
  WHERE id = p_slot_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot is no longer available';
  END IF;

  UPDATE public.reservations
  SET starts_at = v_slot.starts_at, updated_at = now()
  WHERE id = p_reservation_id;

  RETURN v_reservation.id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_reservation_and_release_slot(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reschedule_reservation_to_slot(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_reservation_and_release_slot(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reschedule_reservation_to_slot(uuid, uuid, text) TO authenticated, service_role;
