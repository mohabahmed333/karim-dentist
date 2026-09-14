-- Closes a real gap left by service_doctors: nothing actually stopped a
-- booking whose slot's doctor doesn't offer the requested service — the
-- mapping only ever filtered which doctors got *offered*, client-side. A
-- public form request built by hand, or a bug on any calling surface, could
-- still book a restricted service onto an ineligible doctor's slot.
--
-- Enforced once, here, rather than in every caller (the public route, the
-- WhatsApp job, the admin form) — this is the one place it can't be
-- bypassed. p_service_id NULL, or a service with no service_doctors rows,
-- both stay unrestricted (matches list_bookable_doctors_for_service's own
-- rule, so what a patient is offered and what the RPC accepts never
-- disagree). A legacy doctor-less slot (doctor_id IS NULL) against a
-- restricted service is correctly rejected too — NULL never satisfies the
-- "this doctor is in the eligible set" check.
--
-- Rollback: re-run 20260913320000_multi_doctor_scheduling.sql,
-- 20260913240000_deposit_hold_rpcs.sql and
-- 20260910180000_reservation_lifecycle_rpcs.sql to restore these RPCs to
-- their pre-eligibility-check bodies.

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

  IF p_service_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.service_doctors WHERE service_id = p_service_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.service_doctors
       WHERE service_id = p_service_id AND doctor_id = v_slot.doctor_id
     )
  THEN
    RAISE EXCEPTION 'This doctor does not offer the selected service';
  END IF;

  INSERT INTO public.reservations (
    patient_name,
    phone,
    email,
    service_id,
    service_label,
    starts_at,
    notes,
    status,
    doctor_id
  ) VALUES (
    trim(p_patient_name),
    trim(p_phone),
    NULLIF(trim(coalesce(p_email, '')), ''),
    p_service_id,
    trim(p_service_label),
    v_slot.starts_at,
    coalesce(p_notes, ''),
    'pending',
    v_slot.doctor_id
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

CREATE OR REPLACE FUNCTION public.book_slot_with_deposit_hold(
  p_slot_id uuid,
  p_patient_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_service_id uuid DEFAULT NULL,
  p_service_label text DEFAULT 'General consultation',
  p_notes text DEFAULT '',
  p_conversation_id uuid DEFAULT NULL,
  p_amount_egp numeric DEFAULT 0,
  p_hold_minutes integer DEFAULT 30,
  p_settings jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.appointment_slots%ROWTYPE;
  v_reservation_id uuid;
  v_request_id uuid;
  v_expires_at timestamptz;
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
  IF p_amount_egp IS NULL OR p_amount_egp <= 0 THEN
    RAISE EXCEPTION 'amount_egp required';
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

  IF p_service_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.service_doctors WHERE service_id = p_service_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.service_doctors
       WHERE service_id = p_service_id AND doctor_id = v_slot.doctor_id
     )
  THEN
    RAISE EXCEPTION 'This doctor does not offer the selected service';
  END IF;

  v_expires_at := now() + make_interval(mins => greatest(p_hold_minutes, 1));

  INSERT INTO public.reservations (
    patient_name, phone, email, service_id, service_label,
    starts_at, notes, status, deposit_hold, doctor_id
  ) VALUES (
    trim(p_patient_name),
    trim(p_phone),
    NULLIF(trim(coalesce(p_email, '')), ''),
    p_service_id,
    trim(p_service_label),
    v_slot.starts_at,
    coalesce(p_notes, ''),
    'pending',
    true,
    v_slot.doctor_id
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

  INSERT INTO public.deposit_requests (
    reservation_id, conversation_id, slot_id, phone,
    amount_egp, expires_at, settings_snapshot
  ) VALUES (
    v_reservation_id, p_conversation_id, p_slot_id, trim(p_phone),
    p_amount_egp, v_expires_at, coalesce(p_settings, '{}'::jsonb)
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'deposit_request_id', v_request_id,
    'expires_at', v_expires_at
  );
END;
$$;

-- reschedule_reservation_to_slot doesn't take a service_id — the
-- reservation already has one from booking, and it never changes on
-- reschedule. Same eligibility rule, checked against that existing
-- service_id and the *new* slot's doctor, so a reschedule (including a
-- deliberate doctor switch — see the multi-doctor plan's Stage 2 Phase D)
-- can't land on a doctor who doesn't offer the service being rescheduled.
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

  IF v_reservation.service_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.service_doctors WHERE service_id = v_reservation.service_id
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.service_doctors
       WHERE service_id = v_reservation.service_id AND doctor_id = v_slot.doctor_id
     )
  THEN
    RAISE EXCEPTION 'This doctor does not offer the reservation''s service';
  END IF;

  -- Release the old slot before taking the new one, so the unique index on
  -- (doctor_id, starts_at) cannot trip when moving within the same time.
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
  SET starts_at = v_slot.starts_at, doctor_id = v_slot.doctor_id, updated_at = now()
  WHERE id = p_reservation_id;

  RETURN v_reservation.id;
END;
$$;
