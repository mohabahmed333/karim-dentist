-- Multiple doctors: per-doctor hours and per-doctor slots/reservations.
--
-- Stage 1 (internal only — see the approved plan). The clinic used to assume
-- one dentist: appointment_slots had one non-cancelled row per instant,
-- clinic-wide. That is what appointment_slots_starts_at_unique enforced, and
-- it is what made bookOpenSlotMatchingStartsAt() safe to match a slot by
-- starts_at alone. Both are replaced here: uniqueness moves to
-- (doctor_id, starts_at), and the app-side matching gains a doctor_id.
--
-- roles.is_doctor is a flag, not a hardcoded key = 'doctor' check, so the
-- Owner role (or any other) can also be marked a doctor.
--
-- clinic_hours (the existing singleton) is left completely untouched — it
-- still drives the legacy doctor_id IS NULL slots exactly as before, so the
-- existing ClinicHoursEditor / clinic-hours settings page keep working
-- unmodified. doctor_hours is a new, separate table for the new per-doctor
-- schedule; horizon_days and timezone stay clinic-wide on clinic_hours.
--
-- Rollback:
--   ALTER TABLE public.reservations DROP COLUMN IF EXISTS doctor_id;
--   DROP INDEX IF EXISTS public.appointment_slots_doctor_starts_at_unique;
--   DROP INDEX IF EXISTS public.appointment_slots_open_doctor_idx;
--   ALTER TABLE public.appointment_slots DROP COLUMN IF EXISTS doctor_id;
--   CREATE UNIQUE INDEX appointment_slots_starts_at_unique
--     ON public.appointment_slots (starts_at) WHERE status <> 'cancelled';
--   DROP TABLE IF EXISTS public.doctor_hours;
--   ALTER TABLE public.roles DROP COLUMN IF EXISTS is_doctor;
--   -- then re-run 20260906200000_book_open_slot_rpc.sql,
--   -- 20260913240000_deposit_hold_rpcs.sql and
--   -- 20260910180000_reservation_lifecycle_rpcs.sql to restore the RPCs.

ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS is_doctor boolean NOT NULL DEFAULT false;

INSERT INTO public.roles (key, name, description, is_admin_role, is_system, is_doctor)
VALUES (
  'doctor',
  'Doctor',
  'Clinical work on assigned patients: charting, notes, treatments, imaging.',
  true,
  true,
  true
)
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_admin_role = true,
    is_system = true,
    is_doctor = true,
    deleted_at = NULL,
    updated_at = now();

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'doctor'
  AND p.key IN (
    'dashboard.view',
    'reservations.view',
    'patients.view',
    'patients.chart.edit',
    'patients.notes.edit',
    'patients.treatments.edit',
    'patients.imaging.upload'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Per-doctor hours
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.doctor_hours (
  doctor_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  -- Same shape as clinic_hours, one row per doctor. No row => that doctor
  -- generates no slots.
  open_weekdays int[] NOT NULL DEFAULT '{0,1,2,3,4}',
  time_windows text[] NOT NULL DEFAULT '{"10:00-13:00","14:00-18:00"}',
  slot_minutes int NOT NULL DEFAULT 60
    CHECK (slot_minutes IN (15, 30, 45, 60, 90, 120)),
  is_bookable boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doctor_hours_admin_all ON public.doctor_hours;
CREATE POLICY doctor_hours_admin_all
  ON public.doctor_hours
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- appointment_slots.doctor_id — the blocker
-- ---------------------------------------------------------------------------

ALTER TABLE public.appointment_slots
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.profiles (id);

DROP INDEX IF EXISTS public.appointment_slots_starts_at_unique;

-- NULLS NOT DISTINCT: legacy rows with no doctor still can't collide with
-- each other, matching the old clinic-wide uniqueness for that subset.
CREATE UNIQUE INDEX IF NOT EXISTS appointment_slots_doctor_starts_at_unique
  ON public.appointment_slots (doctor_id, starts_at)
  NULLS NOT DISTINCT
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS appointment_slots_open_doctor_idx
  ON public.appointment_slots (doctor_id, starts_at)
  WHERE status = 'open';

-- ---------------------------------------------------------------------------
-- reservations.doctor_id
-- ---------------------------------------------------------------------------

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reservations_doctor_id_idx
  ON public.reservations (doctor_id)
  WHERE doctor_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RPCs: carry the doctor from slot to reservation. Same signatures as
-- before (CREATE OR REPLACE keeps the existing REVOKE/GRANT in place — a
-- signature change would be a second overload PostgREST can't resolve).
-- ---------------------------------------------------------------------------

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
