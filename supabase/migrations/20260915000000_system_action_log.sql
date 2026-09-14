-- Generic audit trail for every non-CMS admin write, with enough data to
-- write a row back to what it was before. See design doc
-- docs/superpowers/specs/2026-09-14-system-action-log-design.md.
--
-- Every one of the target tables is only writable by an authenticated admin
-- (each already has an `..._admin_all` RLS policy using is_admin()), so by
-- the time a trigger fires here the caller is already an admin — auth.uid()
-- resolves the same way it already does for public.is_admin() (see
-- 20260822201131_create_portfolio_cms.sql) and the trigger
-- enqueue_patient_notifications() in 20260911110000_patient_notifications_trigger.sql.
-- The one exception is accounts.createAccount's service-role profiles
-- upsert, which logs a null actor_id (service-role writes have no
-- auth.uid()) — acceptable, it's a single well-known write path.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS reservations_log_action ON public.reservations;
--   DROP TRIGGER IF EXISTS appointment_slots_log_action ON public.appointment_slots;
--   DROP TRIGGER IF EXISTS clinic_hours_log_action ON public.clinic_hours;
--   DROP TRIGGER IF EXISTS doctor_hours_log_action ON public.doctor_hours;
--   DROP TRIGGER IF EXISTS clinic_cdt_fees_log_action ON public.clinic_cdt_fees;
--   DROP TRIGGER IF EXISTS clinic_treatment_presets_log_action ON public.clinic_treatment_presets;
--   DROP TRIGGER IF EXISTS patient_profiles_log_action ON public.patient_profiles;
--   DROP TRIGGER IF EXISTS patient_clinical_notes_log_action ON public.patient_clinical_notes;
--   DROP TRIGGER IF EXISTS patient_treatments_log_action ON public.patient_treatments;
--   DROP TRIGGER IF EXISTS patient_imaging_log_action ON public.patient_imaging;
--   DROP TRIGGER IF EXISTS patient_tooth_notes_log_action ON public.patient_tooth_notes;
--   DROP TRIGGER IF EXISTS patient_tooth_note_attachments_log_action ON public.patient_tooth_note_attachments;
--   DROP TRIGGER IF EXISTS patient_tooth_surfaces_log_action ON public.patient_tooth_surfaces;
--   DROP TRIGGER IF EXISTS profiles_log_action ON public.profiles;
--   DROP TRIGGER IF EXISTS roles_log_action ON public.roles;
--   DROP TRIGGER IF EXISTS permissions_log_action ON public.permissions;
--   DROP TRIGGER IF EXISTS role_permissions_log_action ON public.role_permissions;
--   DROP TRIGGER IF EXISTS whatsapp_conversations_log_action ON public.whatsapp_conversations;
--   DROP TRIGGER IF EXISTS clinic_chat_threads_log_action ON public.clinic_chat_threads;
--   DROP FUNCTION IF EXISTS public.log_system_action();
--   DROP TABLE IF EXISTS public.system_action_log;

CREATE TABLE IF NOT EXISTS public.system_action_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text NOT NULL,
  row_id       text NOT NULL,
  operation    text NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  actor_id     uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  reverted_at  timestamptz,
  reverted_by  uuid
);

CREATE INDEX IF NOT EXISTS system_action_log_created_idx
  ON public.system_action_log (created_at DESC);
CREATE INDEX IF NOT EXISTS system_action_log_table_created_idx
  ON public.system_action_log (table_name, created_at DESC);

ALTER TABLE public.system_action_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_action_log_admin_all ON public.system_action_log;
CREATE POLICY system_action_log_admin_all
  ON public.system_action_log
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- One generic trigger function, attached below to every tracked table.
-- TG_ARGV[0] names the primary-key column(s), comma-separated for the one
-- composite-key table (role_permissions); defaults to 'id'. Never raises —
-- a logging failure must not roll back the write it's trying to record.
CREATE OR REPLACE FUNCTION public.log_system_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pk_columns text[] := string_to_array(COALESCE(TG_ARGV[0], 'id'), ',');
  row_data jsonb;
  row_id_value text;
  before_json jsonb;
  after_json jsonb;
  col text;
  parts text[] := '{}';
BEGIN
  IF TG_OP = 'DELETE' THEN
    before_json := to_jsonb(OLD);
    after_json := NULL;
    row_data := before_json;
  ELSIF TG_OP = 'INSERT' THEN
    before_json := NULL;
    after_json := to_jsonb(NEW);
    row_data := after_json;
  ELSE
    before_json := to_jsonb(OLD);
    after_json := to_jsonb(NEW);
    row_data := after_json;
  END IF;

  FOREACH col IN ARRAY pk_columns LOOP
    parts := parts || (row_data ->> col);
  END LOOP;
  row_id_value := array_to_string(parts, ':');

  INSERT INTO public.system_action_log (table_name, row_id, operation, actor_id, before, after)
  VALUES (TG_TABLE_NAME, COALESCE(row_id_value, ''), lower(TG_OP), auth.uid(), before_json, after_json);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Clinic ops
DROP TRIGGER IF EXISTS reservations_log_action ON public.reservations;
CREATE TRIGGER reservations_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS appointment_slots_log_action ON public.appointment_slots;
CREATE TRIGGER appointment_slots_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.appointment_slots
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS clinic_hours_log_action ON public.clinic_hours;
CREATE TRIGGER clinic_hours_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_hours
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS doctor_hours_log_action ON public.doctor_hours;
CREATE TRIGGER doctor_hours_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_hours
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('doctor_id');

DROP TRIGGER IF EXISTS clinic_cdt_fees_log_action ON public.clinic_cdt_fees;
CREATE TRIGGER clinic_cdt_fees_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_cdt_fees
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('code');

DROP TRIGGER IF EXISTS clinic_treatment_presets_log_action ON public.clinic_treatment_presets;
CREATE TRIGGER clinic_treatment_presets_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_treatment_presets
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('slot');

-- Patients / clinical
DROP TRIGGER IF EXISTS patient_profiles_log_action ON public.patient_profiles;
CREATE TRIGGER patient_profiles_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_clinical_notes_log_action ON public.patient_clinical_notes;
CREATE TRIGGER patient_clinical_notes_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_treatments_log_action ON public.patient_treatments;
CREATE TRIGGER patient_treatments_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_treatments
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_imaging_log_action ON public.patient_imaging;
CREATE TRIGGER patient_imaging_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_imaging
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_tooth_notes_log_action ON public.patient_tooth_notes;
CREATE TRIGGER patient_tooth_notes_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_tooth_notes
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_tooth_note_attachments_log_action ON public.patient_tooth_note_attachments;
CREATE TRIGGER patient_tooth_note_attachments_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_tooth_note_attachments
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_tooth_surfaces_log_action ON public.patient_tooth_surfaces;
CREATE TRIGGER patient_tooth_surfaces_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_tooth_surfaces
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

-- Access
DROP TRIGGER IF EXISTS profiles_log_action ON public.profiles;
CREATE TRIGGER profiles_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS roles_log_action ON public.roles;
CREATE TRIGGER roles_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS permissions_log_action ON public.permissions;
CREATE TRIGGER permissions_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS role_permissions_log_action ON public.role_permissions;
CREATE TRIGGER role_permissions_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('role_id,permission_id');

-- Messaging metadata (logged, not revertible — see revertPolicy.ts)
DROP TRIGGER IF EXISTS whatsapp_conversations_log_action ON public.whatsapp_conversations;
CREATE TRIGGER whatsapp_conversations_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS clinic_chat_threads_log_action ON public.clinic_chat_threads;
CREATE TRIGGER clinic_chat_threads_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();
