-- Doctor + service attribution on treatments, and a pre-treatment proposal
-- workflow (a doctor bundles services for a patient, sent over WhatsApp;
-- front desk accepts/declines) — see
-- docs/superpowers/specs/2026-09-14-treatment-proposals-design.md.
-- Rollback:
--   DROP TABLE IF EXISTS public.treatment_proposal_items;
--   DROP TABLE IF EXISTS public.treatment_proposals;
--   ALTER TABLE public.patient_treatments
--     DROP COLUMN IF EXISTS doctor_id,
--     DROP COLUMN IF EXISTS service_id;

ALTER TABLE public.patient_treatments
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.profiles (id),
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services (id);

CREATE INDEX IF NOT EXISTS patient_treatments_doctor_id_idx
  ON public.patient_treatments (doctor_id);

CREATE TABLE IF NOT EXISTS public.treatment_proposals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  doctor_id   uuid NOT NULL REFERENCES public.profiles (id),
  status      text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz,
  decided_by  uuid REFERENCES public.profiles (id)
);

CREATE INDEX IF NOT EXISTS treatment_proposals_patient_key_idx
  ON public.treatment_proposals (patient_key);

ALTER TABLE public.treatment_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treatment_proposals_admin_all ON public.treatment_proposals;
CREATE POLICY treatment_proposals_admin_all
  ON public.treatment_proposals
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.treatment_proposal_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.treatment_proposals (id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES public.services (id),
  description text NOT NULL CHECK (char_length(trim(description)) > 0),
  amount_egp  numeric NOT NULL CHECK (amount_egp > 0)
);

CREATE INDEX IF NOT EXISTS treatment_proposal_items_proposal_id_idx
  ON public.treatment_proposal_items (proposal_id);

ALTER TABLE public.treatment_proposal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treatment_proposal_items_admin_all ON public.treatment_proposal_items;
CREATE POLICY treatment_proposal_items_admin_all
  ON public.treatment_proposal_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
