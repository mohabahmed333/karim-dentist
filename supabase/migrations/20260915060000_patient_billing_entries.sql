-- Patient billing ledger: manual charges/payments only. Treatment charges
-- and deposit payments are computed live from patient_treatments/
-- deposit_requests, not duplicated here — see
-- docs/superpowers/specs/2026-09-14-patient-billing-ledger-design.md.
-- Rollback:
--   UPDATE public.roles SET description = 'Reservations, waitlist, patients (read), and support.' WHERE key = 'front-desk';
--   DELETE FROM public.role_permissions WHERE permission_id IN (SELECT id FROM public.permissions WHERE key = 'patients.billing.edit');
--   DELETE FROM public.permissions WHERE key = 'patients.billing.edit';
--   DROP POLICY IF EXISTS patient_billing_entries_admin_all ON public.patient_billing_entries;
--   DROP TABLE IF EXISTS public.patient_billing_entries;

CREATE TABLE IF NOT EXISTS public.patient_billing_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('charge', 'payment')),
  amount_egp  numeric NOT NULL CHECK (amount_egp > 0),
  description text NOT NULL CHECK (char_length(trim(description)) > 0),
  method      text,
  created_by  uuid REFERENCES public.profiles (id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_billing_entries_patient_key_idx
  ON public.patient_billing_entries (patient_key);

ALTER TABLE public.patient_billing_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_billing_entries_admin_all ON public.patient_billing_entries;
CREATE POLICY patient_billing_entries_admin_all
  ON public.patient_billing_entries
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.permissions (key, category, label, sort_order)
VALUES ('patients.billing.edit', 'patients', 'Record a patient payment or charge', 46)
ON CONFLICT (key) DO NOTHING;

-- owner's blanket grant was a one-time CROSS JOIN in
-- 20260913150000_seed_rbac_catalog.sql that already ran — a permission
-- added afterward needs its own explicit grant, same as
-- 20260913320000_multi_doctor_scheduling.sql did for the doctor role.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key = 'patients.billing.edit'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'front-desk'
  AND p.key = 'patients.billing.edit'
ON CONFLICT DO NOTHING;

UPDATE public.roles
SET description = 'Reservations, waitlist, patients (read + billing), and support.'
WHERE key = 'front-desk';
