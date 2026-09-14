-- One-click revert for system_action_log entries — writes the stored
-- "before" snapshot back (update), deletes the row (insert), or re-inserts
-- it (delete). Guarded by a hardcoded revertible-tables list (kept separate
-- from which tables are merely tracked — role_permissions and messaging
-- metadata are tracked but excluded here) and a staleness check so a revert
-- can't silently clobber a newer edit. See
-- docs/superpowers/specs/2026-09-14-system-action-log-design.md.
--
-- jsonb_populate_record (not a hand-built SET clause) does the type
-- coercion, because several tracked tables have array columns
-- (patient_profiles.medical_history text[], doctor_hours.time_windows
-- text[]) that a naive text-literal UPDATE would mangle.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.revert_system_action(uuid);

CREATE OR REPLACE FUNCTION public.revert_system_action(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_row public.system_action_log%ROWTYPE;
  revertible_tables text[] := ARRAY[
    'reservations', 'appointment_slots', 'clinic_hours', 'doctor_hours',
    'clinic_cdt_fees', 'clinic_treatment_presets',
    'patient_profiles', 'patient_clinical_notes', 'patient_treatments',
    'patient_imaging', 'patient_tooth_notes', 'patient_tooth_note_attachments',
    'patient_tooth_surfaces',
    'profiles', 'roles', 'permissions'
  ];
  pk_column text;
  cols text;
  current_row jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO log_row FROM public.system_action_log WHERE id = p_log_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Log entry not found';
  END IF;
  IF log_row.reverted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already reverted';
  END IF;
  IF NOT (log_row.table_name = ANY(revertible_tables)) THEN
    RAISE EXCEPTION 'Table % is not revertible', log_row.table_name;
  END IF;

  pk_column := CASE log_row.table_name
    WHEN 'doctor_hours' THEN 'doctor_id'
    WHEN 'clinic_cdt_fees' THEN 'code'
    WHEN 'clinic_treatment_presets' THEN 'slot'
    ELSE 'id'
  END;

  IF log_row.operation = 'insert' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %I::text = $1', log_row.table_name, pk_column)
      INTO current_row USING log_row.row_id;
    IF current_row IS NULL THEN
      RAISE EXCEPTION 'Row already gone — nothing to revert';
    END IF;
    EXECUTE format('DELETE FROM %I WHERE %I::text = $1', log_row.table_name, pk_column)
      USING log_row.row_id;

  ELSIF log_row.operation = 'update' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %I::text = $1', log_row.table_name, pk_column)
      INTO current_row USING log_row.row_id;
    IF current_row IS DISTINCT FROM log_row.after THEN
      RAISE EXCEPTION 'Row changed since this action — refresh and try again';
    END IF;

    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
      INTO cols
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = log_row.table_name;

    EXECUTE format(
      'UPDATE %I AS t SET (%s) = (SELECT %s FROM jsonb_populate_record(null::%I, $1)) WHERE t.%I::text = $2',
      log_row.table_name, cols, cols, log_row.table_name, pk_column
    ) USING log_row.before, log_row.row_id;

  ELSIF log_row.operation = 'delete' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %I::text = $1', log_row.table_name, pk_column)
      INTO current_row USING log_row.row_id;
    IF current_row IS NOT NULL THEN
      RAISE EXCEPTION 'A row with this id already exists — cannot restore';
    END IF;
    EXECUTE format(
      'INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1)',
      log_row.table_name, log_row.table_name
    ) USING log_row.before;
  END IF;

  UPDATE public.system_action_log
  SET reverted_at = now(), reverted_by = auth.uid()
  WHERE id = p_log_id;
END;
$$;
