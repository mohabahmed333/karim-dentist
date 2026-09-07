-- Tooth comments on the admin odontogram (keyed by reservation patient_key)
-- Rollback: DROP TABLE IF EXISTS public.patient_tooth_findings;

CREATE TABLE IF NOT EXISTS public.patient_tooth_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  fdi_number text NOT NULL
    CHECK (fdi_number ~ '^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$'),
  note text NOT NULL
    CHECK (char_length(trim(note)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_key, fdi_number)
);

CREATE INDEX IF NOT EXISTS patient_tooth_findings_patient_key_idx
  ON public.patient_tooth_findings (patient_key);

ALTER TABLE public.patient_tooth_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_tooth_findings_admin_all
  ON public.patient_tooth_findings;
CREATE POLICY patient_tooth_findings_admin_all
  ON public.patient_tooth_findings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.patient_tooth_findings (patient_key, fdi_number, note)
VALUES
  (
    'phone:+201001234567',
    '18',
    'Wisdom tooth — monitor for pericoronitis.'
  ),
  (
    'phone:+201001234567',
    '21',
    'Slight enamel chip on the mesial edge.'
  )
ON CONFLICT (patient_key, fdi_number) DO NOTHING;
