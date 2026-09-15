-- A doctor's note to the front desk, carried on the billing request itself.
--
-- The doctor now bills in one dialog (a service and a tap), so the one thing
-- they could previously only say by walking to reception — "patient asked to
-- pay half now", "waive the x-ray" — has nowhere else to live. Kept on the
-- proposal rather than in a separate table: it is one short string, written
-- once at creation, read once by whoever settles the request.
--
-- NOT NULL DEFAULT '' rather than nullable, so every reader gets a string and
-- "no note" has exactly one spelling.
--
-- Rollback:
--   ALTER TABLE public.treatment_proposals DROP COLUMN IF EXISTS note;

ALTER TABLE public.treatment_proposals
  ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '';
