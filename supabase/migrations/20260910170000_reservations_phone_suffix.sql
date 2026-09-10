-- Indexed phone lookup for WhatsApp → patient linking.
--
-- resolvePatientKeyByPhone() pulled up to 500 reservations and filtered them in
-- JS on every inbound webhook message. This adds a generated last-8-digits
-- column so the same lookup is an indexed equality in Postgres.
--
-- The suffix is a *narrowing* filter only; phonesMatch() still decides in JS.
-- That is sound because the app's canonicalization (stripping `00`, expanding
-- local `01…` to `201…`) only ever rewrites the prefix, leaving the last 8
-- digits invariant. right(x, 8) on a shorter number returns the whole string,
-- matching phoneSuffixForLookup().
--
-- Rollback:
--   DROP INDEX IF EXISTS public.reservations_phone_suffix_idx;
--   ALTER TABLE public.reservations DROP COLUMN IF EXISTS phone_suffix;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS phone_suffix text
  GENERATED ALWAYS AS (right(regexp_replace(phone, '[^0-9]', '', 'g'), 8)) STORED;

CREATE INDEX IF NOT EXISTS reservations_phone_suffix_idx
  ON public.reservations (phone_suffix)
  WHERE deleted_at IS NULL;
