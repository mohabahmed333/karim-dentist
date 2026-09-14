-- Rename patient_profiles -> patients (same columns, same patient_key values),
-- backfill any patient_key that only exists on reservations, and link
-- reservations to patients via a new nullable patient_id FK.
-- Rollback: see bottom of file.

ALTER TABLE public.patient_profiles RENAME TO patients;
ALTER INDEX IF EXISTS patient_profiles_patient_key_idx RENAME TO patients_patient_key_idx;
ALTER POLICY patient_profiles_admin_all ON public.patients RENAME TO patients_admin_all;

-- Backfill: one `patients` row per patient_key that shows up on a reservation
-- but has no profile row yet. Mirrors patientKeyFromReservation() exactly:
-- phone:<canonical-digits> when a phone is present, else name:<lowercased-name>.
WITH derived AS (
  SELECT
    r.patient_name,
    r.phone,
    r.email,
    r.starts_at,
    regexp_replace(r.phone, '\D', '', 'g') AS raw_digits
  FROM public.reservations r
  WHERE r.deleted_at IS NULL
),
-- Two sequential stages, mirroring canonicalPhoneDigits()'s two sequential
-- `if`s exactly: strip a leading international "00", THEN separately check
-- whether the (possibly-just-stripped) result looks like a local Egyptian
-- mobile number. A single mutually-exclusive CASE would mishandle a number
-- like "0001012345678" (00 + a local-format number) — it must fall through
-- both checks, not just the first one that matches.
after_00 AS (
  SELECT
    *,
    CASE WHEN raw_digits LIKE '00%' THEN substr(raw_digits, 3) ELSE raw_digits END
      AS after_00
  FROM derived
),
canon AS (
  SELECT
    *,
    CASE
      WHEN after_00 = '' THEN ''
      WHEN after_00 LIKE '01%' AND length(after_00) = 11
        THEN '20' || substr(after_00, 2)
      ELSE after_00
    END AS canon_digits
  FROM after_00
),
keyed AS (
  SELECT
    *,
    CASE
      WHEN canon_digits <> '' THEN 'phone:' || canon_digits
      ELSE 'name:' || lower(trim(patient_name))
    END AS patient_key
  FROM canon
),
ranked AS (
  SELECT DISTINCT ON (patient_key)
    patient_key, patient_name, phone, email
  FROM keyed
  ORDER BY patient_key, starts_at DESC
)
INSERT INTO public.patients (patient_key, display_name, phone, email)
SELECT ranked.patient_key, ranked.patient_name, ranked.phone, ranked.email
FROM ranked
WHERE NOT EXISTS (
  SELECT 1 FROM public.patients p WHERE p.patient_key = ranked.patient_key
);

-- Link reservations to patients.
ALTER TABLE public.reservations
  ADD COLUMN patient_id uuid REFERENCES public.patients (id);

CREATE INDEX IF NOT EXISTS reservations_patient_id_idx
  ON public.reservations (patient_id);

WITH derived AS (
  SELECT
    r.id,
    r.patient_name,
    r.phone,
    regexp_replace(r.phone, '\D', '', 'g') AS raw_digits
  FROM public.reservations r
),
after_00 AS (
  SELECT
    *,
    CASE WHEN raw_digits LIKE '00%' THEN substr(raw_digits, 3) ELSE raw_digits END
      AS after_00
  FROM derived
),
canon AS (
  SELECT
    *,
    CASE
      WHEN after_00 = '' THEN ''
      WHEN after_00 LIKE '01%' AND length(after_00) = 11
        THEN '20' || substr(after_00, 2)
      ELSE after_00
    END AS canon_digits
  FROM after_00
),
keyed AS (
  SELECT
    id,
    CASE
      WHEN canon_digits <> '' THEN 'phone:' || canon_digits
      ELSE 'name:' || lower(trim(patient_name))
    END AS patient_key
  FROM canon
)
UPDATE public.reservations r
SET patient_id = p.id
FROM keyed k
JOIN public.patients p ON p.patient_key = k.patient_key
WHERE r.id = k.id AND r.patient_id IS NULL;

-- Rollback:
-- ALTER TABLE public.reservations DROP COLUMN IF EXISTS patient_id;
-- ALTER POLICY patients_admin_all ON public.patients RENAME TO patient_profiles_admin_all;
-- ALTER INDEX IF EXISTS patients_patient_key_idx RENAME TO patient_profiles_patient_key_idx;
-- ALTER TABLE public.patients RENAME TO patient_profiles;
