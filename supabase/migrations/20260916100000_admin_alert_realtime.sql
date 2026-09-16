-- Live admin alerts for low stock, new bookings and payments awaiting review.
--
-- The topbar bell already counts these on every page load; realtime is what
-- turns them into a toast the moment they happen, for whoever is not looking
-- at the relevant page — which is exactly who needs telling.
--
-- Rollback:
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.inventory_alerts;
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.reservations;
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.billing_payment_requests;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'inventory_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_alerts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'billing_payment_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_payment_requests;
  END IF;
END $$;
