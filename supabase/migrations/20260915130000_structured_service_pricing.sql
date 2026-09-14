-- Structured pricing: a service's price becomes real numbers
-- (price_min_egp/price_max_egp) instead of only free text, and a doctor's
-- own override becomes a single real number (price_egp). price_label stays
-- on both tables as a generated display string — every existing reader
-- (WhatsApp prompt, public site, billing price-lookup) keeps working
-- unchanged; going forward the app writes price_label FROM the numbers,
-- never the other way around.
--
-- Backfill: wherever an existing price_label already contains one or two
-- plain numbers, extract them into the new columns. Anything that doesn't
-- parse that cleanly (free text, three+ numbers) is left NULL — its old
-- price_label is untouched until someone next edits that row's price.
--
-- Rollback:
--   ALTER TABLE public.service_doctors DROP COLUMN IF EXISTS price_egp;
--   ALTER TABLE public.services DROP COLUMN IF EXISTS price_max_egp;
--   ALTER TABLE public.services DROP COLUMN IF EXISTS price_min_egp;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS price_min_egp integer CHECK (price_min_egp >= 0),
  ADD COLUMN IF NOT EXISTS price_max_egp integer CHECK (price_max_egp >= price_min_egp);

ALTER TABLE public.service_doctors
  ADD COLUMN IF NOT EXISTS price_egp integer CHECK (price_egp >= 0);

WITH nums AS (
  SELECT s.id, array_agg((m[1])::numeric ORDER BY (m[1])::numeric) AS values
  FROM public.services s,
    LATERAL regexp_matches(s.price_label, '(\d+(?:\.\d+)?)', 'g') AS m
  WHERE s.price_label IS NOT NULL
  GROUP BY s.id
)
UPDATE public.services s
SET price_min_egp = ROUND(nums.values[1])::integer,
    price_max_egp = ROUND(nums.values[array_length(nums.values, 1)])::integer
FROM nums
WHERE s.id = nums.id
  AND array_length(nums.values, 1) BETWEEN 1 AND 2
  AND s.price_min_egp IS NULL
  AND s.price_max_egp IS NULL;

WITH nums AS (
  SELECT sd.service_id, sd.doctor_id, array_agg((m[1])::numeric) AS values
  FROM public.service_doctors sd,
    LATERAL regexp_matches(sd.price_label, '(\d+(?:\.\d+)?)', 'g') AS m
  WHERE sd.price_label IS NOT NULL
  GROUP BY sd.service_id, sd.doctor_id
)
UPDATE public.service_doctors sd
SET price_egp = ROUND(nums.values[1])::integer
FROM nums
WHERE sd.service_id = nums.service_id
  AND sd.doctor_id = nums.doctor_id
  AND array_length(nums.values, 1) = 1
  AND sd.price_egp IS NULL;
