-- Clinic CDT fee schedule + 4 chairside treatment chips
-- Rollback:
--   DROP TABLE IF EXISTS public.clinic_treatment_presets;
--   DROP TABLE IF EXISTS public.clinic_cdt_fees;

CREATE TABLE IF NOT EXISTS public.clinic_cdt_fees (
  code text PRIMARY KEY
    CHECK (code ~ '^D[0-9]{4}$'),
  fee_egp integer NOT NULL DEFAULT 0
    CHECK (fee_egp >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinic_treatment_presets (
  slot smallint PRIMARY KEY
    CHECK (slot BETWEEN 1 AND 4),
  code text NOT NULL REFERENCES public.clinic_cdt_fees (code),
  label text NOT NULL
    CHECK (char_length(trim(label)) > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_cdt_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_treatment_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinic_cdt_fees_admin_all ON public.clinic_cdt_fees;
CREATE POLICY clinic_cdt_fees_admin_all
  ON public.clinic_cdt_fees
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS clinic_treatment_presets_admin_all
  ON public.clinic_treatment_presets;
CREATE POLICY clinic_treatment_presets_admin_all
  ON public.clinic_treatment_presets
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.clinic_cdt_fees (code, fee_egp) VALUES
  ('D0140', 0),
  ('D9110', 0),
  ('D3220', 0),
  ('D7510', 0),
  ('D7140', 200),
  ('D7210', 0),
  ('D2391', 150),
  ('D2392', 0),
  ('D2393', 0),
  ('D2330', 0),
  ('D3310', 0),
  ('D3320', 0),
  ('D3330', 650),
  ('D2740', 900),
  ('D2950', 0),
  ('D4341', 0),
  ('D6010', 0),
  ('D6058', 0),
  ('D6240', 0),
  ('D9944', 0),
  ('D9972', 0)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.clinic_treatment_presets (slot, code, label) VALUES
  (1, 'D2391', '+ Fill'),
  (2, 'D2740', '+ Crown'),
  (3, 'D3330', '+ Root Canal'),
  (4, 'D7140', '+ Extract')
ON CONFLICT (slot) DO NOTHING;
