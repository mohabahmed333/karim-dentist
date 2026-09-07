-- Patient X-ray / CBCT / clinical photos
-- Rollback: DROP TABLE public.patient_imaging;

CREATE TABLE IF NOT EXISTS public.patient_imaging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  title text NOT NULL
    CHECK (char_length(trim(title)) > 0),
  kind text NOT NULL DEFAULT 'xray'
    CHECK (kind IN ('xray', 'cbct', 'photo')),
  tooth_number integer
    CHECK (tooth_number IS NULL OR (tooth_number BETWEEN 1 AND 32)),
  file_url text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  taken_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_imaging_patient_key_idx
  ON public.patient_imaging (patient_key);

CREATE INDEX IF NOT EXISTS patient_imaging_patient_taken_idx
  ON public.patient_imaging (patient_key, taken_at DESC NULLS LAST);

ALTER TABLE public.patient_imaging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_imaging_admin_all ON public.patient_imaging;
CREATE POLICY patient_imaging_admin_all
  ON public.patient_imaging
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
