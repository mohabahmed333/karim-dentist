-- Charting workspace: 5-surface map, CDT phase/fee, primary FDI, imaging FDI
-- Rollback:
--   DROP TABLE IF EXISTS public.patient_tooth_surfaces;
--   ALTER TABLE public.patient_treatments DROP COLUMN IF EXISTS cdt_code;
--   ALTER TABLE public.patient_treatments DROP COLUMN IF EXISTS phase;
--   ALTER TABLE public.patient_treatments DROP COLUMN IF EXISTS fee_amount;
--   ALTER TABLE public.patient_imaging DROP COLUMN IF EXISTS tooth_fdi;

CREATE TABLE IF NOT EXISTS public.patient_tooth_surfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  fdi_number text NOT NULL
    CHECK (fdi_number ~ '^([1-4][1-8]|[5-8][1-5])$'),
  dentition text NOT NULL DEFAULT 'adult'
    CHECK (dentition IN ('adult', 'primary')),
  mesial text NOT NULL DEFAULT 'unmarked'
    CHECK (mesial IN ('unmarked', 'decay', 'filling')),
  distal text NOT NULL DEFAULT 'unmarked'
    CHECK (distal IN ('unmarked', 'decay', 'filling')),
  occlusal text NOT NULL DEFAULT 'unmarked'
    CHECK (occlusal IN ('unmarked', 'decay', 'filling')),
  facial text NOT NULL DEFAULT 'unmarked'
    CHECK (facial IN ('unmarked', 'decay', 'filling')),
  lingual text NOT NULL DEFAULT 'unmarked'
    CHECK (lingual IN ('unmarked', 'decay', 'filling')),
  whole text NOT NULL DEFAULT 'none'
    CHECK (whole IN ('none', 'crown', 'missing')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_key, fdi_number)
);

CREATE INDEX IF NOT EXISTS patient_tooth_surfaces_patient_key_idx
  ON public.patient_tooth_surfaces (patient_key);

ALTER TABLE public.patient_tooth_surfaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_tooth_surfaces_admin_all
  ON public.patient_tooth_surfaces;
CREATE POLICY patient_tooth_surfaces_admin_all
  ON public.patient_tooth_surfaces
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.patient_treatments
  ADD COLUMN IF NOT EXISTS cdt_code text,
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'restorative',
  ADD COLUMN IF NOT EXISTS fee_amount integer NOT NULL DEFAULT 0;

ALTER TABLE public.patient_treatments
  DROP CONSTRAINT IF EXISTS patient_treatments_cdt_code_check;
ALTER TABLE public.patient_treatments
  ADD CONSTRAINT patient_treatments_cdt_code_check
  CHECK (cdt_code IS NULL OR cdt_code ~ '^D[0-9]{4}$');

ALTER TABLE public.patient_treatments
  DROP CONSTRAINT IF EXISTS patient_treatments_phase_check;
ALTER TABLE public.patient_treatments
  ADD CONSTRAINT patient_treatments_phase_check
  CHECK (phase IN ('urgent', 'restorative', 'prosthodontic'));

ALTER TABLE public.patient_treatments
  DROP CONSTRAINT IF EXISTS patient_treatments_fee_amount_check;
ALTER TABLE public.patient_treatments
  ADD CONSTRAINT patient_treatments_fee_amount_check
  CHECK (fee_amount >= 0);

ALTER TABLE public.patient_treatments
  DROP CONSTRAINT IF EXISTS patient_treatments_tooth_fdi_check;
ALTER TABLE public.patient_treatments
  ADD CONSTRAINT patient_treatments_tooth_fdi_check
  CHECK (
    tooth_fdi IS NULL
    OR tooth_fdi ~ '^([1-4][1-8]|[5-8][1-5])$'
  );

ALTER TABLE public.patient_tooth_notes
  DROP CONSTRAINT IF EXISTS patient_tooth_notes_fdi_number_check;
ALTER TABLE public.patient_tooth_notes
  ADD CONSTRAINT patient_tooth_notes_fdi_number_check
  CHECK (fdi_number ~ '^([1-4][1-8]|[5-8][1-5])$');

ALTER TABLE public.patient_imaging
  ADD COLUMN IF NOT EXISTS tooth_fdi text;

ALTER TABLE public.patient_imaging
  DROP CONSTRAINT IF EXISTS patient_imaging_tooth_fdi_check;
ALTER TABLE public.patient_imaging
  ADD CONSTRAINT patient_imaging_tooth_fdi_check
  CHECK (
    tooth_fdi IS NULL
    OR tooth_fdi ~ '^([1-4][1-8]|[5-8][1-5])$'
  );
