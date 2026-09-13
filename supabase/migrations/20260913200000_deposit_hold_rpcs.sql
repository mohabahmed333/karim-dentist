-- Holding a slot for a deposit, and what happens when one is paid or lapses.
--
-- The hard part is not the money, it is that this repo already tells every
-- patient their booking is confirmed. enqueue_patient_notifications fires on
-- every reservation INSERT that is future-dated and not cancelled, and
-- `status = 'pending'` was never excluded — so a slot merely held for a deposit
-- would have sent "your appointment is confirmed" before the patient paid, and
-- armed a 24h reminder for an appointment that may evaporate. This migration
-- re-issues that trigger so a held booking says nothing until it is paid.
--
-- A deposit therefore moves a reservation through pending -> confirmed, and it
-- is that transition, not the INSERT, that produces the confirmation message.
-- No new notification kind, no new Meta template: the existing outbox does it.
--
-- A hold that lapses is silent. The patient was never told they had an
-- appointment, so "your appointment is cancelled" would be worse than saying
-- nothing; the assistant explains it in the chat thread instead, where the
-- patient is actually looking.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.reject_deposit(uuid, uuid, text);
--   DROP FUNCTION IF EXISTS public.confirm_deposit_paid(uuid, uuid, text);
--   DROP FUNCTION IF EXISTS public.expire_deposit_hold(uuid);
--   DROP FUNCTION IF EXISTS public.book_slot_with_deposit_hold(
--     uuid, text, text, text, uuid, text, text, uuid, numeric, integer, jsonb);
--   ALTER TABLE public.reservations DROP COLUMN IF EXISTS deposit_hold;
--   -- then re-run 20260911110000_patient_notifications_trigger.sql to restore
--   -- enqueue_patient_notifications() to its previous body.

-- One boolean, because the notification trigger is the only code that sees the
-- INSERT and it has to know. Joining to deposit_requests from inside the trigger
-- would be a second lookup on the hot booking path for the same answer.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS deposit_hold boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- The notification trigger, re-issued
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enqueue_patient_notifications()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY DEFINER is load-bearing, not habit: createReservation() writes as
-- `authenticated`, and patient_notifications has no insert policy for that role.
-- An INVOKER trigger would be blocked by RLS on every admin-panel booking.
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_lead int;
  v_reminder_at timestamptz;
  v_source text;
BEGIN
  -- Everything below runs in a subtransaction. A notification that cannot be
  -- queued must never fail the patient's booking, and an AFTER trigger raising
  -- an exception would abort the caller's whole transaction.
  BEGIN
    v_source := coalesce(
      nullif(current_setting('app.notify_source', true), ''),
      'unknown'
    );

    SELECT reminder_lead_minutes INTO v_lead
    FROM public.patient_notification_settings
    LIMIT 1;
    v_lead := coalesce(v_lead, 1440);

    -- ---------------------------------------------------------------------
    -- A booking that is no longer live: withdraw anything not yet sent.
    -- ---------------------------------------------------------------------
    IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL THEN
      -- Soft delete is a records operation, not a patient-facing one. Staff who
      -- want the patient told should cancel; deleting is how a row is tidied
      -- away. So: withdraw, say nothing.
      UPDATE public.patient_notifications
      SET status = 'superseded', updated_at = now()
      WHERE reservation_id = NEW.id AND status = 'pending';
      RETURN NULL;
    END IF;

    -- A held slot released without ever being paid for. The patient was never
    -- told they had this appointment, so they are not told it is gone. Must be
    -- tested before the general cancellation branch below, which does announce.
    IF TG_OP = 'UPDATE' AND NEW.deposit_hold
       AND OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
      UPDATE public.patient_notifications
      SET status = 'superseded', updated_at = now()
      WHERE reservation_id = NEW.id AND status = 'pending';
      RETURN NULL;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled'
       AND OLD.status IS DISTINCT FROM 'cancelled' THEN
      UPDATE public.patient_notifications
      SET status = 'superseded', updated_at = now()
      WHERE reservation_id = NEW.id AND status = 'pending';

      INSERT INTO public.patient_notifications
        (reservation_id, kind, dedupe_key, source,
         phone, patient_name, service_label, starts_at, scheduled_for)
      VALUES
        (NEW.id, 'cancellation', NEW.id || ':cancellation', v_source,
         NEW.phone, NEW.patient_name, NEW.service_label, NEW.starts_at, now())
      ON CONFLICT (dedupe_key) DO NOTHING;

      RETURN NULL;
    END IF;

    -- A visit that has happened, or been missed, needs no reminder.
    IF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'no_show')
       AND OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE public.patient_notifications
      SET status = 'superseded', updated_at = now()
      WHERE reservation_id = NEW.id
        AND status = 'pending'
        AND kind = 'reminder_24h';
      RETURN NULL;
    END IF;

    -- Nothing to say about a booking in the past or already cancelled.
    IF NEW.starts_at <= now() OR NEW.status = 'cancelled' THEN
      RETURN NULL;
    END IF;

    -- A slot held for a deposit is not a booking yet. Say nothing at all — no
    -- confirmation, and no reminder for an appointment that may never happen.
    -- The patient hears about the hold from the assistant, in the chat.
    IF TG_OP = 'INSERT' AND NEW.deposit_hold AND NEW.status = 'pending' THEN
      RETURN NULL;
    END IF;

    -- ---------------------------------------------------------------------
    -- A live booking: confirm it, and arm a reminder.
    -- ---------------------------------------------------------------------
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.patient_notifications
        (reservation_id, kind, dedupe_key, source,
         phone, patient_name, service_label, starts_at, scheduled_for)
      VALUES
        (NEW.id, 'confirmation', NEW.id || ':confirmation', v_source,
         NEW.phone, NEW.patient_name, NEW.service_label, NEW.starts_at, now())
      ON CONFLICT (dedupe_key) DO NOTHING;

    ELSIF OLD.starts_at IS DISTINCT FROM NEW.starts_at THEN
      -- Moved. Withdraw everything still pending for the old time, then say so
      -- once. The dedupe key carries the new epoch, so a second move is a
      -- second event while a repeated UPDATE of the same move is not.
      UPDATE public.patient_notifications
      SET status = 'superseded', updated_at = now()
      WHERE reservation_id = NEW.id AND status = 'pending';

      INSERT INTO public.patient_notifications
        (reservation_id, kind, dedupe_key, source,
         phone, patient_name, service_label, starts_at, scheduled_for)
      VALUES
        (NEW.id, 'reschedule',
         NEW.id || ':reschedule:' || extract(epoch FROM NEW.starts_at)::bigint,
         v_source,
         NEW.phone, NEW.patient_name, NEW.service_label, NEW.starts_at, now())
      ON CONFLICT (dedupe_key) DO NOTHING;

    ELSIF NEW.deposit_hold
          AND OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
      -- The deposit was paid. This is the first thing this patient is told
      -- about the appointment, so it is a confirmation, keyed exactly as the
      -- INSERT branch would have keyed it — a held booking that is later paid
      -- must not be able to produce two confirmations.
      INSERT INTO public.patient_notifications
        (reservation_id, kind, dedupe_key, source,
         phone, patient_name, service_label, starts_at, scheduled_for)
      VALUES
        (NEW.id, 'confirmation', NEW.id || ':confirmation', v_source,
         NEW.phone, NEW.patient_name, NEW.service_label, NEW.starts_at, now())
      ON CONFLICT (dedupe_key) DO NOTHING;

    ELSE
      -- An update that changed neither the time nor the lifecycle status.
      RETURN NULL;
    END IF;

    -- The reminder, for both branches above.
    --
    -- Skipped when it would land within the hour: the approved template says
    -- "tomorrow", and the confirmation the patient just received already told
    -- them the time. A reminder scheduled in the past would also fire instantly
    -- as a near-duplicate.
    v_reminder_at := NEW.starts_at - make_interval(mins => v_lead);
    IF v_reminder_at > now() + interval '1 hour' THEN
      INSERT INTO public.patient_notifications
        (reservation_id, kind, dedupe_key, source,
         phone, patient_name, service_label, starts_at, scheduled_for)
      VALUES
        (NEW.id, 'reminder_24h',
         NEW.id || ':reminder_24h:' || extract(epoch FROM NEW.starts_at)::bigint,
         v_source,
         NEW.phone, NEW.patient_name, NEW.service_label, NEW.starts_at,
         v_reminder_at)
      ON CONFLICT (dedupe_key) DO NOTHING;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Visible in the Postgres logs, invisible to the patient booking an
    -- appointment. Never RAISE EXCEPTION here.
    RAISE WARNING 'enqueue_patient_notifications failed for reservation %: %',
      NEW.id, SQLERRM;
  END;

  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.enqueue_patient_notifications() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Booking a slot and holding it for a deposit, in one transaction
-- ---------------------------------------------------------------------------

-- Deliberately a separate function rather than a p_deposit_hold parameter on
-- book_open_appointment_slot. Adding a defaulted argument there would create a
-- second overload of the same name, and PostgREST's named-argument rpc() then
-- fails with `42725 function is not unique` — at runtime, in production, only
-- once both are deployed. Forty duplicated lines are cheaper than that.
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
    starts_at, notes, status, deposit_hold
  ) VALUES (
    trim(p_patient_name),
    trim(p_phone),
    NULLIF(trim(coalesce(p_email, '')), ''),
    p_service_id,
    trim(p_service_label),
    v_slot.starts_at,
    coalesce(p_notes, ''),
    'pending',
    true
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

REVOKE ALL ON FUNCTION public.book_slot_with_deposit_hold(
  uuid, text, text, text, uuid, text, text, uuid, numeric, integer, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_slot_with_deposit_hold(
  uuid, text, text, text, uuid, text, text, uuid, numeric, integer, jsonb
) TO service_role;

-- ---------------------------------------------------------------------------
-- Letting a hold lapse
-- ---------------------------------------------------------------------------

-- Releasing the slot flips it booked -> open, which fires
-- appointment_slots_offer_waitlist and offers it to the three longest-waiting
-- matching patients. The no-show protection and the revenue recovery are the
-- same mechanism; nothing extra is needed here to get it.
CREATE OR REPLACE FUNCTION public.expire_deposit_hold(p_deposit_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.deposit_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.deposit_requests
  WHERE id = p_deposit_request_id
  FOR UPDATE;

  -- Idempotent: two dispatcher ticks racing must not cancel twice, and a
  -- receipt that landed a moment ago must not be undone by a stale sweep.
  IF NOT FOUND
     OR v_request.status <> 'awaiting_receipt'
     OR v_request.expires_at > now() THEN
    RETURN false;
  END IF;

  UPDATE public.deposit_requests
  SET status = 'expired', decided_at = now(),
      decision_reason = 'hold expired', updated_at = now()
  WHERE id = p_deposit_request_id;

  UPDATE public.reservations
  SET status = 'cancelled', updated_at = now()
  WHERE id = v_request.reservation_id
    AND status = 'pending';

  UPDATE public.appointment_slots
  SET status = 'open', reservation_id = NULL, updated_at = now()
  WHERE reservation_id = v_request.reservation_id
    AND status = 'booked';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_deposit_hold(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_deposit_hold(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Paid, and rejected
-- ---------------------------------------------------------------------------

-- The only writer of reservations.status = 'confirmed' on this path, which is
-- what makes "confirmed" mean "the deposit was accepted" and lets the
-- notification trigger key the confirmation message off that one transition.
CREATE OR REPLACE FUNCTION public.confirm_deposit_paid(
  p_deposit_request_id uuid,
  p_decided_by uuid DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.deposit_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.deposit_requests
  WHERE id = p_deposit_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'deposit request not found';
  END IF;

  -- Idempotent on an already-paid row: a webhook redelivery or a staff
  -- double-click must not raise, and must not queue a second confirmation.
  IF v_request.status = 'paid' THEN
    RETURN false;
  END IF;
  IF v_request.status NOT IN ('awaiting_receipt', 'in_review') THEN
    RAISE EXCEPTION 'deposit request is %', v_request.status;
  END IF;

  UPDATE public.deposit_requests
  SET status = 'paid', decided_at = now(), decided_by = p_decided_by,
      decision_reason = coalesce(p_reason, ''), updated_at = now()
  WHERE id = p_deposit_request_id;

  UPDATE public.reservations
  SET status = 'confirmed', updated_at = now()
  WHERE id = v_request.reservation_id
    AND status = 'pending';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_deposit_paid(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_deposit_paid(uuid, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.reject_deposit(
  p_deposit_request_id uuid,
  p_decided_by uuid DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.deposit_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.deposit_requests
  WHERE id = p_deposit_request_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.status NOT IN ('awaiting_receipt', 'in_review') THEN
    RETURN false;
  END IF;

  UPDATE public.deposit_requests
  SET status = 'rejected', decided_at = now(), decided_by = p_decided_by,
      decision_reason = coalesce(p_reason, ''), updated_at = now()
  WHERE id = p_deposit_request_id;

  UPDATE public.reservations
  SET status = 'cancelled', updated_at = now()
  WHERE id = v_request.reservation_id
    AND status = 'pending';

  UPDATE public.appointment_slots
  SET status = 'open', reservation_id = NULL, updated_at = now()
  WHERE reservation_id = v_request.reservation_id
    AND status = 'booked';

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_deposit(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_deposit(uuid, uuid, text) TO service_role;
