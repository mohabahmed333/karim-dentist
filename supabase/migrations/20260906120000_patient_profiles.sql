-- Patient intake / receptionist profile (one row per patient_key)
-- Rollback: DROP TABLE public.patient_profiles;

CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text,
  date_of_birth date,
  age_years integer
    CHECK (age_years IS NULL OR (age_years >= 0 AND age_years <= 130)),
  gender text NOT NULL DEFAULT ''
    CHECK (gender IN ('', 'female', 'male', 'other', 'prefer_not')),
  medical_history text[] NOT NULL DEFAULT '{}',
  allergies text[] NOT NULL DEFAULT '{}',
  medications text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_profiles_patient_key_idx
  ON public.patient_profiles (patient_key);

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_profiles_admin_all ON public.patient_profiles;
CREATE POLICY patient_profiles_admin_all
  ON public.patient_profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
