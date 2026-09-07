-- Admin AI proposals, audit, and persistent clinical records
-- Rollback:
--   DROP TABLE IF EXISTS public.ai_action_audit_events;
--   DROP TABLE IF EXISTS public.ai_action_proposals;
--   DROP TABLE IF EXISTS public.patient_lab_orders;
--   DROP TABLE IF EXISTS public.patient_prescriptions;
--   DROP TABLE IF EXISTS public.patient_chart_findings;
--   DROP TABLE IF EXISTS public.patient_clinical_notes;

CREATE TABLE IF NOT EXISTS public.patient_clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  category text NOT NULL
    CHECK (category IN ('SOAP', 'Quick Note', 'Alert', 'Lab')),
  content text NOT NULL
    CHECK (char_length(trim(content)) > 0),
  target_kind text NOT NULL DEFAULT 'visit'
    CHECK (target_kind IN ('visit', 'tooth', 'treatment')),
  target_id text NOT NULL DEFAULT 'visit',
  tooth_fdi text
    CHECK (
      tooth_fdi IS NULL
      OR tooth_fdi ~ '^([1-4][1-8]|[5-8][1-5])$'
    ),
  treatment_id uuid
    REFERENCES public.patient_treatments (id) ON DELETE SET NULL,
  author text NOT NULL DEFAULT 'Dentist',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_clinical_notes_patient_key_idx
  ON public.patient_clinical_notes (patient_key);
CREATE INDEX IF NOT EXISTS patient_clinical_notes_tooth_idx
  ON public.patient_clinical_notes (patient_key, tooth_fdi);

CREATE TABLE IF NOT EXISTS public.patient_chart_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  tooth_fdi text NOT NULL
    CHECK (tooth_fdi ~ '^([1-4][1-8]|[5-8][1-5])$'),
  condition_type text NOT NULL,
  severity text NOT NULL DEFAULT 'MED'
    CHECK (severity IN ('LOW', 'MED', 'HIGH', 'CRITICAL')),
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'RESOLVED', 'MONITORING')),
  vitality_index numeric,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_chart_findings_patient_key_idx
  ON public.patient_chart_findings (patient_key);
CREATE INDEX IF NOT EXISTS patient_chart_findings_tooth_idx
  ON public.patient_chart_findings (patient_key, tooth_fdi);

CREATE TABLE IF NOT EXISTS public.patient_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  medication text NOT NULL
    CHECK (char_length(trim(medication)) > 0),
  dose text NOT NULL
    CHECK (char_length(trim(dose)) > 0),
  frequency text NOT NULL
    CHECK (frequency IN ('ONCE_DAILY', 'TWICE_DAILY', 'NIGHT_ONLY')),
  duration_days integer NOT NULL DEFAULT 1
    CHECK (duration_days > 0),
  instructions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'EXPIRED')),
  tooth_fdi text
    CHECK (
      tooth_fdi IS NULL
      OR tooth_fdi ~ '^([1-4][1-8]|[5-8][1-5])$'
    ),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_prescriptions_patient_key_idx
  ON public.patient_prescriptions (patient_key);

CREATE TABLE IF NOT EXISTS public.patient_lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  appliance_type text NOT NULL,
  status text NOT NULL DEFAULT 'IMPRESSION'
    CHECK (status IN ('IMPRESSION', 'FABRICATION', 'SHIPPED', 'DELIVERED')),
  tooth_fdi text
    CHECK (
      tooth_fdi IS NULL
      OR tooth_fdi ~ '^([1-4][1-8]|[5-8][1-5])$'
    ),
  notes text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_lab_orders_patient_key_idx
  ON public.patient_lab_orders (patient_key);

CREATE TABLE IF NOT EXISTS public.ai_action_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'failed')),
  source text NOT NULL DEFAULT 'clinic-chat'
    CHECK (source IN ('clinic-chat', 'treatment-chat')),
  patient_key text,
  summary text NOT NULL DEFAULT '',
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  diffs jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshot_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_action_proposals_created_by_idx
  ON public.ai_action_proposals (created_by, status);
CREATE INDEX IF NOT EXISTS ai_action_proposals_expires_idx
  ON public.ai_action_proposals (expires_at);

CREATE TABLE IF NOT EXISTS public.ai_action_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid
    REFERENCES public.ai_action_proposals (id) ON DELETE SET NULL,
  actor_id uuid,
  action_kind text NOT NULL,
  target text NOT NULL DEFAULT '',
  outcome text NOT NULL
    CHECK (outcome IN ('proposed', 'confirmed', 'cancelled', 'failed', 'stale')),
  before_summary jsonb,
  after_summary jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_action_audit_events_proposal_idx
  ON public.ai_action_audit_events (proposal_id);
CREATE INDEX IF NOT EXISTS ai_action_audit_events_created_idx
  ON public.ai_action_audit_events (created_at DESC);

ALTER TABLE public.patient_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_chart_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_clinical_notes_admin_all ON public.patient_clinical_notes;
CREATE POLICY patient_clinical_notes_admin_all
  ON public.patient_clinical_notes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS patient_chart_findings_admin_all ON public.patient_chart_findings;
CREATE POLICY patient_chart_findings_admin_all
  ON public.patient_chart_findings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS patient_prescriptions_admin_all ON public.patient_prescriptions;
CREATE POLICY patient_prescriptions_admin_all
  ON public.patient_prescriptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS patient_lab_orders_admin_all ON public.patient_lab_orders;
CREATE POLICY patient_lab_orders_admin_all
  ON public.patient_lab_orders
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS ai_action_proposals_admin_all ON public.ai_action_proposals;
CREATE POLICY ai_action_proposals_admin_all
  ON public.ai_action_proposals
  FOR ALL TO authenticated
  USING (public.is_admin() AND created_by = auth.uid())
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS ai_action_audit_events_admin_all ON public.ai_action_audit_events;
CREATE POLICY ai_action_audit_events_admin_all
  ON public.ai_action_audit_events
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
