-- Required treatments per patient
-- Rollback: DROP TABLE public.patient_treatments;

CREATE TABLE IF NOT EXISTS public.patient_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  tooth_name text NOT NULL
    CHECK (char_length(trim(tooth_name)) > 0),
  tooth_fdi text
    CHECK (
      tooth_fdi IS NULL
      OR tooth_fdi ~ '^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$'
    ),
  severity text NOT NULL DEFAULT 'Minor'
    CHECK (severity IN ('Critical', 'Minor')),
  last_treatment text NOT NULL DEFAULT '',
  ai_title text,
  ai_description text,
  ai_confidence integer
    CHECK (ai_confidence IS NULL OR (ai_confidence BETWEEN 0 AND 100)),
  ai_recommendation text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'scheduled', 'done')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_treatments_patient_key_idx
  ON public.patient_treatments (patient_key);

CREATE INDEX IF NOT EXISTS patient_treatments_patient_severity_idx
  ON public.patient_treatments (patient_key, severity);

ALTER TABLE public.patient_treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_treatments_admin_all ON public.patient_treatments;
CREATE POLICY patient_treatments_admin_all
  ON public.patient_treatments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
