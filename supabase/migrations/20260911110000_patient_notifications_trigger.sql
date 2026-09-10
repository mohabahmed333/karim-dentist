-- Enqueue patient notifications from a trigger on reservations.
--
-- Why a trigger, in a schema that has none: bookings arrive from four paths and
-- only three go through an RPC. createReservation(), updateReservation() and
-- rescheduleReservation() in src/services/reservations/mutations.ts are plain
-- browser-client writes with roughly ten call sites across the admin UI, and
-- new paths keep appearing. A trigger is the one place none of them can bypass.
--
-- It is also transactional: the outbox row is written inside the booking's own
-- transaction, so a booking that later raises "slot is no longer available"
-- takes its notification down with it. No message for an appointment that never
-- existed.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS reservations_notify_upd ON public.reservations;
--   DROP TRIGGER IF EXISTS reservations_notify_ins ON public.reservations;
--   DROP FUNCTION IF EXISTS public.enqueue_patient_notifications();

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

DROP TRIGGER IF EXISTS reservations_notify_ins ON public.reservations;
CREATE TRIGGER reservations_notify_ins
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL AND NEW.status <> 'cancelled')
  EXECUTE FUNCTION public.enqueue_patient_notifications();

-- `UPDATE OF` fires whenever a listed column appears in the SET list, even
-- unchanged — PostgREST sends only the columns given, and updateReservation()
-- always adds updated_at, which is deliberately not listed. The WHEN clause
-- does the real filtering.
DROP TRIGGER IF EXISTS reservations_notify_upd ON public.reservations;
CREATE TRIGGER reservations_notify_upd
  AFTER UPDATE OF starts_at, status, deleted_at ON public.reservations
  FOR EACH ROW
  WHEN (
    OLD.starts_at IS DISTINCT FROM NEW.starts_at
    OR OLD.status IS DISTINCT FROM NEW.status
    OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
  )
  EXECUTE FUNCTION public.enqueue_patient_notifications();
