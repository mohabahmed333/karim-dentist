-- Let the admin UI see whether the dispatch job is actually scheduled.
--
-- The `cron` schema is not exposed through PostgREST, and pg_cron may not be
-- installed at all (it is not, locally). Without this the settings page cannot
-- distinguish "scheduled" from "nothing will ever drain the queue", which is
-- the single most likely reason for a silent system.
--
-- Returns NULL rather than false when it cannot tell, so the UI can say
-- "unknown" instead of asserting something wrong.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.patient_notifications_cron_scheduled();

CREATE OR REPLACE FUNCTION public.patient_notifications_cron_scheduled()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_found boolean;
BEGIN
  BEGIN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = $1)'
      INTO v_found
      USING 'patient-notifications-dispatch';
    RETURN v_found;
  EXCEPTION WHEN OTHERS THEN
    -- pg_cron absent, or the schema is not readable from here.
    RETURN NULL;
  END;
END;
$fn$;

REVOKE ALL ON FUNCTION public.patient_notifications_cron_scheduled() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.patient_notifications_cron_scheduled()
  TO authenticated, service_role;
