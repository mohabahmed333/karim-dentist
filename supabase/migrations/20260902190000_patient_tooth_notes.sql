-- Multiple notes per tooth with file attachments
-- Rollback: DROP TABLE patient_tooth_note_attachments; DROP TABLE patient_tooth_notes;

CREATE TABLE IF NOT EXISTS public.patient_tooth_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  fdi_number text NOT NULL
    CHECK (fdi_number ~ '^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$'),
  body text NOT NULL
    CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_tooth_notes_patient_key_idx
  ON public.patient_tooth_notes (patient_key);

CREATE INDEX IF NOT EXISTS patient_tooth_notes_patient_fdi_idx
  ON public.patient_tooth_notes (patient_key, fdi_number);

CREATE TABLE IF NOT EXISTS public.patient_tooth_note_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL
    REFERENCES public.patient_tooth_notes (id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  kind text NOT NULL DEFAULT 'file'
    CHECK (kind IN ('image', 'file')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_tooth_note_attachments_note_id_idx
  ON public.patient_tooth_note_attachments (note_id);

ALTER TABLE public.patient_tooth_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_tooth_note_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_tooth_notes_admin_all ON public.patient_tooth_notes;
CREATE POLICY patient_tooth_notes_admin_all
  ON public.patient_tooth_notes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS patient_tooth_note_attachments_admin_all
  ON public.patient_tooth_note_attachments;
CREATE POLICY patient_tooth_note_attachments_admin_all
  ON public.patient_tooth_note_attachments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.patient_tooth_notes (patient_key, fdi_number, body, created_at, updated_at)
SELECT patient_key, fdi_number, note, created_at, updated_at
FROM public.patient_tooth_findings;

DROP TABLE IF EXISTS public.patient_tooth_findings;

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-records', 'patient-records', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_public_read_patient_records ON storage.objects;
CREATE POLICY storage_public_read_patient_records ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'patient-records');

DROP POLICY IF EXISTS storage_admin_write_patient_records ON storage.objects;
CREATE POLICY storage_admin_write_patient_records ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'patient-records' AND public.is_admin())
  WITH CHECK (bucket_id = 'patient-records' AND public.is_admin());
