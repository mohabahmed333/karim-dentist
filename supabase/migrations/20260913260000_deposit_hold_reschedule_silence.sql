-- A held slot that moves before it is paid for is still not an appointment.
--
-- The deposit work taught the notification trigger to stay quiet for a booking
-- held against a deposit, and to stay quiet when such a hold is cancelled. It
-- missed the third way a held reservation changes: being rescheduled. Moving an
-- unpaid hold fell through to the ordinary "your appointment has moved" branch,
-- which told the patient their appointment had changed — an appointment they
-- had never been told they had — and armed a 24h reminder for it.
--
-- Found by asking what reschedule does with a deposit. The answer to the other
-- half of that question is reassuring and needs no change: rescheduling does not
-- ask for a second deposit. The request is keyed to the reservation, not the
-- slot, so it carries over, and expire_deposit_hold releases whatever slot the
-- reservation currently holds because it matches on reservation_id.
--
-- It does leave deposit_requests.slot_id pointing at the slot that was given up,
-- which nothing reads today but would mislead the first person who does, so the
-- move is recorded here too — this trigger is the only place that sees it.
--
-- Rollback: re-run 20260913240000_deposit_hold_rpcs.sql, which contains the
-- previous body of this function.

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

    -- A held slot moved before it was paid for. Same reasoning: there is no
    -- appointment in the patient's world yet, so there is nothing to move. The
    -- assistant is talking to them in the thread; the outbox stays out of it.
    IF TG_OP = 'UPDATE' AND NEW.deposit_hold AND NEW.status = 'pending'
       AND OLD.starts_at IS DISTINCT FROM NEW.starts_at THEN
      UPDATE public.patient_notifications
      SET status = 'superseded', updated_at = now()
      WHERE reservation_id = NEW.id AND status = 'pending';

      -- Keep the deposit pointing at the slot actually being held. Nothing
      -- reads this column yet — the release matches on reservation_id — but a
      -- stale slot id is a trap for whoever reads it first.
      UPDATE public.deposit_requests
      SET slot_id = (
            SELECT s.id FROM public.appointment_slots s
            WHERE s.reservation_id = NEW.id AND s.status = 'booked'
            LIMIT 1
          ),
          updated_at = now()
      WHERE reservation_id = NEW.id
        AND status IN ('awaiting_receipt', 'in_review');

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
