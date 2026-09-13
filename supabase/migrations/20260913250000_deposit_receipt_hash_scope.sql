-- A receipt we could not read must not burn its own screenshot.
--
-- deposit_receipts_image_unique covered every verdict, including 'unreadable' —
-- the row written when the fetch failed, no vision model was configured, or the
-- model returned nothing. That is our failure, not the patient's, and the reply
-- they get asks them to send the receipt again. Sending the same screenshot
-- again was then rejected as a duplicate, with no way out but a phone call.
--
-- Scoped now to the verdicts that actually spend a receipt — accepted, or
-- queued for staff — exactly as deposit_receipts_reference_unique already is.
-- Replay protection is unchanged: a screenshot can still only be accepted once,
-- because the accepted row is the one holding the lock.
--
-- Found by running scripts/deposit-smoke.mjs twice.
--
-- Rollback:
--   DROP INDEX IF EXISTS public.deposit_receipts_image_unique;
--   CREATE UNIQUE INDEX deposit_receipts_image_unique
--     ON public.deposit_receipts (image_sha256) WHERE image_sha256 <> '';

DROP INDEX IF EXISTS public.deposit_receipts_image_unique;

CREATE UNIQUE INDEX IF NOT EXISTS deposit_receipts_image_unique
  ON public.deposit_receipts (image_sha256)
  WHERE image_sha256 <> '' AND verdict IN ('confirm', 'review');
