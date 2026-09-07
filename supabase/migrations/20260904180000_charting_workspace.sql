-- Charting workspace: 5-surface map, CDT phase/fee, primary FDI, imaging FDI
-- Remote recorded this version before 20260904190000 (idempotent follow-up).
-- Rollback:
--   DROP TABLE IF EXISTS public.patient_tooth_surfaces;
--   ALTER TABLE public.patient_treatments DROP COLUMN IF EXISTS cdt_code;
--   ALTER TABLE public.patient_treatments DROP COLUMN IF EXISTS phase;
--   ALTER TABLE public.patient_treatments DROP COLUMN IF EXISTS fee_amount;
--   ALTER TABLE public.patient_imaging DROP COLUMN IF EXISTS tooth_fdi;

SELECT 1;
