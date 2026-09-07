-- Attachments (files + X-rays) on required treatments
-- Rollback: DROP TABLE public.patient_treatment_attachments;

CREATE TABLE IF NOT EXISTS public.patient_treatment_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid NOT NULL
    REFERENCES public.patient_treatments (id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  kind text NOT NULL DEFAULT 'file'
    CHECK (kind IN ('file', 'image', 'xray')),
  imaging_id uuid
    REFERENCES public.patient_imaging (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_treatment_attachments_treatment_id_idx
  ON public.patient_treatment_attachments (treatment_id);

CREATE INDEX IF NOT EXISTS patient_treatment_attachments_imaging_id_idx
  ON public.patient_treatment_attachments (imaging_id)
  WHERE imaging_id IS NOT NULL;

ALTER TABLE public.patient_treatment_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_treatment_attachments_admin_all
  ON public.patient_treatment_attachments;
CREATE POLICY patient_treatment_attachments_admin_all
  ON public.patient_treatment_attachments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
