-- Schedule the per-minute notification dispatch.
--
-- DELIBERATELY NOT A MIGRATION. `scripts/dev-local.sh` runs `supabase db reset
-- --local` on every start and the e2e suite runs against a local Supabase, so a
-- migration scheduling a per-minute POST to the production URL would fire from
-- every developer laptop and from CI — with real patient messages at the other
-- end. The URL and the secret are per-environment deployment config, not schema.
--
-- Run once per environment, by hand, in the Supabase dashboard SQL editor.
--
-- Why not Vercel Cron: vercel.json is capped at one daily job on the Hobby plan
-- (see the comment in src/app/api/v1/whatsapp/webhook/route.ts). pg_cron gives
-- minute granularity without adding another vendor.
--
-- STEP 1 — create the secrets (dashboard only, never committed):
--
--   select vault.create_secret(
--     'https://<your-domain>/api/v1/notifications/dispatch',
--     'notifications_dispatch_url');
--   select vault.create_secret('<the same value as CRON_SECRET on Vercel>',
--     'notifications_cron_secret');
--
-- STEP 2 — run everything below.
--
-- Rollback:
--   SELECT cron.unschedule('patient-notifications-dispatch');
--   -- Leave the extensions in place; other things use pg_net.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron unavailable - skipping dispatch schedule';
    RETURN;
  END IF;

  EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_cron';
  EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions';

  -- The guard that makes this safe to run anywhere: the secret exists only
  -- where an operator deliberately created it, so a local database is a no-op.
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'notifications_dispatch_url'
  ) THEN
    RAISE NOTICE 'vault secret notifications_dispatch_url absent - not scheduling';
    RETURN;
  END IF;

  PERFORM cron.unschedule('patient-notifications-dispatch')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'patient-notifications-dispatch');

  -- The inner tag must differ from the outer one. Using $$ for both silently
  -- truncates the block rather than failing.
  PERFORM cron.schedule(
    'patient-notifications-dispatch',
    '* * * * *',
    $cron$
      SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets
                WHERE name = 'notifications_dispatch_url'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret
                                         FROM vault.decrypted_secrets
                                         WHERE name = 'notifications_cron_secret')
        ),
        body := jsonb_build_object('source', 'pg_cron'),
        timeout_milliseconds := 5000
      );
    $cron$
  );
END $$;
