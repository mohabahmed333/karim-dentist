-- Closing the waitlist loop: booked, lost, and ignored.
--
-- The fan-out works — a freed slot is offered to the three longest-waiting
-- patients whose window fits — but nothing ever moved them off 'offered'.
-- `booked` and `expired` existed only in the CHECK constraint. So:
--
--   * the patient who took the slot stayed 'offered' for ever, and staff had no
--     way to see the waitlist had actually worked;
--   * the two who lost the race also stayed 'offered', and since the fan-out
--     only considers 'waiting', they were never offered anything again — one
--     race they did not know they were in removed them from the list for good;
--   * an offer nobody answered did the same thing, quietly.
--
-- Three changes. The fan-out body becomes a function so it can be called again
-- rather than only by a trigger; taking a slot marks the winner and frees the
-- losers; and a sweep returns stale offers to the pool and re-offers the slot if
-- it is still going begging.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.release_stale_waitlist_offers(interval);
--   DROP TRIGGER IF EXISTS appointment_slots_claim_waitlist ON public.appointment_slots;
--   DROP FUNCTION IF EXISTS public.claim_waitlist_offer();
--   DROP FUNCTION IF EXISTS public.offer_slot_to_waitlist(uuid);
--   -- then re-run 20260911160000_appointment_waitlist.sql for the trigger body.

-- ---------------------------------------------------------------------------
-- The fan-out, callable
-- ---------------------------------------------------------------------------

-- Same body the trigger always had, lifted out so the sweep below can offer a
-- slot a second time. The dedupe key still stops anyone being offered the same
-- slot twice, so calling it again is safe.
CREATE OR REPLACE FUNCTION public.offer_slot_to_waitlist(p_slot_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_slot public.appointment_slots%ROWTYPE;
  v_offered integer := 0;
BEGIN
  SELECT * INTO v_slot FROM public.appointment_slots WHERE id = p_slot_id;
  IF NOT FOUND OR v_slot.status <> 'open' THEN
    RETURN 0;
  END IF;

  -- Not worth offering a slot nobody could reach in time.
  IF v_slot.starts_at <= now() + interval '1 hour' THEN
    RETURN 0;
  END IF;

  WITH chosen AS (
    SELECT w.id, w.phone, w.patient_name, w.service_label
    FROM public.appointment_waitlist w
    WHERE w.status = 'waiting'
      AND (w.preferred_from IS NULL OR v_slot.starts_at >= w.preferred_from)
      AND (w.preferred_to IS NULL OR v_slot.starts_at <= w.preferred_to)
    ORDER BY w.created_at
    LIMIT 3
    FOR UPDATE SKIP LOCKED
  ),
  queued AS (
    INSERT INTO public.patient_notifications
      (kind, dedupe_key, source, phone, patient_name, service_label,
       starts_at, scheduled_for, waitlist_id, slot_id)
    SELECT 'waitlist_offer', c.id || ':waitlist_offer:' || v_slot.id, 'waitlist',
           c.phone, c.patient_name, c.service_label,
           v_slot.starts_at, now(), c.id, v_slot.id
    FROM chosen c
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING waitlist_id
  )
  UPDATE public.appointment_waitlist w
  SET status = 'offered', offered_slot_id = v_slot.id, offered_at = now(),
      updated_at = now()
  WHERE w.id IN (SELECT waitlist_id FROM queued);

  GET DIAGNOSTICS v_offered = ROW_COUNT;
  RETURN v_offered;
END;
$fn$;

REVOKE ALL ON FUNCTION public.offer_slot_to_waitlist(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.offer_slot_to_waitlist(uuid) TO service_role;

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
    PERFORM public.offer_slot_to_waitlist(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'offer_freed_slot_to_waitlist failed for slot %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.offer_freed_slot_to_waitlist() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Somebody took it
-- ---------------------------------------------------------------------------

-- The winner is marked booked; everyone else offered that slot goes back to
-- waiting rather than being stranded by a race they never knew they were in.
CREATE OR REPLACE FUNCTION public.claim_waitlist_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_suffix text;
BEGIN
  BEGIN
    SELECT r.phone_suffix INTO v_suffix
    FROM public.reservations r
    WHERE r.id = NEW.reservation_id;

    -- Whoever booked it, if they were on the list for this slot. Matched on the
    -- last eight digits, the same way every other phone comparison here works.
    IF v_suffix IS NOT NULL THEN
      UPDATE public.appointment_waitlist w
      SET status = 'booked', updated_at = now()
      WHERE w.offered_slot_id = NEW.id
        AND w.status = 'offered'
        AND w.phone_suffix = v_suffix;
    END IF;

    -- The others lost the race. Back to the pool, and eligible for the next
    -- slot that frees up — being outbid must not cost them their place.
    UPDATE public.appointment_waitlist w
    SET status = 'waiting', offered_slot_id = NULL, offered_at = NULL,
        updated_at = now()
    WHERE w.offered_slot_id = NEW.id
      AND w.status = 'offered';

  EXCEPTION WHEN OTHERS THEN
    -- Never fail the booking over bookkeeping.
    RAISE WARNING 'claim_waitlist_offer failed for slot %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.claim_waitlist_offer() FROM PUBLIC;

DROP TRIGGER IF EXISTS appointment_slots_claim_waitlist ON public.appointment_slots;
CREATE TRIGGER appointment_slots_claim_waitlist
  AFTER UPDATE OF status ON public.appointment_slots
  FOR EACH ROW
  WHEN (OLD.status = 'open' AND NEW.status = 'booked')
  EXECUTE FUNCTION public.claim_waitlist_offer();

-- ---------------------------------------------------------------------------
-- Nobody answered
-- ---------------------------------------------------------------------------

-- Returns offers older than the claim window to the pool, then offers their
-- slot again if it is still free — the round two the first version never had.
-- Anyone already offered that slot is skipped by the dedupe key, so the second
-- round reaches the next people in line rather than the same three.
CREATE OR REPLACE FUNCTION public.release_stale_waitlist_offers(
  p_max_age interval DEFAULT interval '30 minutes'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_slot_id uuid;
  v_slots uuid[];
  v_released integer := 0;
BEGIN
  -- The slot ids are collected in the same statement that frees the offers, so
  -- the count is of people returned to the pool rather than of slots touched.
  WITH stale AS (
    UPDATE public.appointment_waitlist w
    SET status = 'waiting', offered_slot_id = NULL, offered_at = NULL,
        updated_at = now()
    WHERE w.status = 'offered'
      AND w.offered_at IS NOT NULL
      AND w.offered_at <= now() - p_max_age
    RETURNING w.offered_slot_id AS slot_id
  )
  SELECT count(*)::int,
         array_agg(DISTINCT slot_id) FILTER (WHERE slot_id IS NOT NULL)
  INTO v_released, v_slots
  FROM stale;

  IF v_slots IS NOT NULL THEN
    FOREACH v_slot_id IN ARRAY v_slots LOOP
      PERFORM public.offer_slot_to_waitlist(v_slot_id);
    END LOOP;
  END IF;

  RETURN coalesce(v_released, 0);
END;
$fn$;

REVOKE ALL ON FUNCTION public.release_stale_waitlist_offers(interval) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_stale_waitlist_offers(interval) TO service_role;
