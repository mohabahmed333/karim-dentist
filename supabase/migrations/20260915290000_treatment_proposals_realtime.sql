-- Realtime for the front desk's billing queue.
--
-- A doctor billing a visit inserts a treatment_proposals row with status
-- 'sent'. Until now nothing told the front desk: /admin/billing only refreshed
-- on navigation, so a bill could sit uncollected until someone thought to look.
--
-- RLS on this table is is_admin(), which every staff role satisfies, so the
-- change reaches any signed-in staff session — the same reach the WhatsApp
-- inbox already has.
ALTER PUBLICATION supabase_realtime ADD TABLE public.treatment_proposals;

-- Without this an UPDATE/DELETE payload carries only the primary key, so a
-- settled bill could not be told apart from an unrelated edit.
ALTER TABLE public.treatment_proposals REPLICA IDENTITY FULL;
