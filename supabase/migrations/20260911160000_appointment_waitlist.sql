-- Waitlist, and offering a freed slot to the people waiting for one.
--
-- A cancellation used to leave an empty chair. Now, when a booked slot is
-- released back to open, the first three waiting patients whose preferred window
-- contains it are queued a WhatsApp offer. Whoever answers first gets it, through
-- book_open_appointment_slot — already atomic, so the others lose cleanly with
-- "that time was just taken" rather than being double-booked.
--
-- Offers go through the same outbox, policy and quiet hours as every other
-- notification. Until a waitlist-offer template is approved in Meta they record
-- `no_approved_template` and nothing is sent.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS appointment_slots_offer_waitlist ON public.appointment_slots;
--   DROP FUNCTION IF EXISTS public.offer_freed_slot_to_waitlist();
--   ALTER TABLE public.patient_notifications DROP COLUMN IF EXISTS slot_id;
--   ALTER TABLE public.patient_notifications DROP COLUMN IF EXISTS waitlist_id;
--   DROP TABLE IF EXISTS public.appointment_waitlist;

CREATE TABLE IF NOT EXISTS public.appointment_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  phone text NOT NULL,
  phone_suffix text GENERATED ALWAYS AS
    (right(regexp_replace(phone, '[^0-9]', '', 'g'), 8)) STORED,
  service_id uuid REFERENCES public.services (id) ON DELETE SET NULL,
  service_label text NOT NULL DEFAULT '',
  -- Null on either side means "any time". A patient who can only do mornings
  -- next week should not be offered a Thursday evening.
  preferred_from timestamptz,
  preferred_to timestamptz,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'offered', 'booked', 'expired', 'removed')),
  offered_slot_id uuid REFERENCES public.appointment_slots (id) ON DELETE SET NULL,
  offered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (preferred_to IS NULL OR preferred_from IS NULL OR preferred_to > preferred_from)
);

-- First come, first offered.
CREATE INDEX IF NOT EXISTS appointment_waitlist_waiting_idx
  ON public.appointment_waitlist (created_at)
  WHERE status = 'waiting';

ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS appointment_waitlist_admin_all ON public.appointment_waitlist;
CREATE POLICY appointment_waitlist_admin_all ON public.appointment_waitlist
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- An offer is about a slot, not a reservation, so the outbox needs to say which
-- slot and which waitlist entry. Columns rather than payload: the dispatcher
-- overwrites payload with the rendered template parameters.
ALTER TABLE public.patient_notifications
  ADD COLUMN IF NOT EXISTS waitlist_id uuid
    REFERENCES public.appointment_waitlist (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS slot_id uuid
    REFERENCES public.appointment_slots (id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.offer_freed_slot_to_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Same rule as the reservations trigger: a failure here must never undo the
  -- cancellation that freed the slot.
  BEGIN
    -- Not worth offering a slot nobody could reach in time.
    IF NEW.starts_at <= now() + interval '1 hour' THEN
      RETURN NULL;
    END IF;

    WITH chosen AS (
      SELECT w.id, w.phone, w.patient_name, w.service_label
      FROM public.appointment_waitlist w
      WHERE w.status = 'waiting'
        AND (w.preferred_from IS NULL OR NEW.starts_at >= w.preferred_from)
        AND (w.preferred_to IS NULL OR NEW.starts_at <= w.preferred_to)
      ORDER BY w.created_at
      LIMIT 3
      FOR UPDATE SKIP LOCKED
    ),
    queued AS (
      INSERT INTO public.patient_notifications
        (kind, dedupe_key, source, phone, patient_name, service_label,
         starts_at, scheduled_for, waitlist_id, slot_id)
      SELECT 'waitlist_offer', c.id || ':waitlist_offer:' || NEW.id, 'waitlist',
             c.phone, c.patient_name, c.service_label,
             NEW.starts_at, now(), c.id, NEW.id
      FROM chosen c
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING waitlist_id
    )
    UPDATE public.appointment_waitlist w
    SET status = 'offered', offered_slot_id = NEW.id, offered_at = now(),
        updated_at = now()
    WHERE w.id IN (SELECT waitlist_id FROM queued);

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'offer_freed_slot_to_waitlist failed for slot %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.offer_freed_slot_to_waitlist() FROM PUBLIC;

DROP TRIGGER IF EXISTS appointment_slots_offer_waitlist ON public.appointment_slots;
CREATE TRIGGER appointment_slots_offer_waitlist
  AFTER UPDATE OF status ON public.appointment_slots
  FOR EACH ROW
  WHEN (OLD.status = 'booked' AND NEW.status = 'open')
  EXECUTE FUNCTION public.offer_freed_slot_to_waitlist();
