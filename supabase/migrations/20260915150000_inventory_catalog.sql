-- Inventory & Consumables (Loss Prevention), part 1: suppliers, trackable
-- items, and lot/expiry batches. Storage only — recipes and the consumption
-- ledger arrive in the next two migrations, so each lands reviewable on its
-- own, the same staging as 20260911100000_patient_notifications.sql.
--
-- Rollback:
--   DELETE FROM public.role_permissions WHERE permission_id IN (SELECT id FROM public.permissions WHERE key = 'inventory.view');
--   DELETE FROM public.permissions WHERE key = 'inventory.view';
--   DROP TRIGGER IF EXISTS inventory_batches_log_action ON public.inventory_batches;
--   DROP TRIGGER IF EXISTS inventory_items_log_action ON public.inventory_items;
--   DROP TRIGGER IF EXISTS suppliers_log_action ON public.suppliers;
--   DROP TABLE IF EXISTS public.inventory_batches;
--   DROP TABLE IF EXISTS public.inventory_items;
--   DROP TABLE IF EXISTS public.suppliers;

CREATE TABLE IF NOT EXISTS public.suppliers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL CHECK (char_length(trim(name)) > 0),
  contact_name   text NOT NULL DEFAULT '',
  phone          text NOT NULL DEFAULT '',
  whatsapp_phone text,
  email          text,
  notes          text NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL CHECK (char_length(trim(name)) > 0),
  name_ar             text NOT NULL DEFAULT '',
  sku                 text,
  category            text NOT NULL DEFAULT 'general'
    CHECK (category IN ('implant', 'anesthesia', 'injectable', 'suture',
      'bone_graft', 'disposable', 'ppe', 'instrument', 'general')),
  unit                text NOT NULL DEFAULT 'unit'
    CHECK (unit IN ('unit', 'vial', 'ampoule', 'box', 'ml', 'mg', 'syringe')),
  -- Items whose individual purchase batches carry a lot number / expiry date
  -- that matters clinically (anesthesia, Botox, bone graft, sutures). Bulk
  -- disposables (gloves, cotton rolls) still get one synthetic batch per
  -- restock for qty tracking, but false means the UI does not demand a lot
  -- number nobody wrote down for a bag of gauze.
  tracks_batches      boolean NOT NULL DEFAULT true,
  min_stock_level     numeric NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
  reorder_qty         numeric NOT NULL DEFAULT 0 CHECK (reorder_qty >= 0),
  default_supplier_id uuid REFERENCES public.suppliers (id) ON DELETE SET NULL,
  last_unit_cost_egp  numeric CHECK (last_unit_cost_egp IS NULL OR last_unit_cost_egp >= 0),
  -- Wastage of this item above this EGP value requires a second admin's
  -- confirmation. NULL defers to inventory_settings.wastage_approval_threshold_egp
  -- (added in 20260915180000_inventory_low_stock_alerts.sql).
  wastage_approval_threshold_egp numeric CHECK (
    wastage_approval_threshold_egp IS NULL OR wastage_approval_threshold_egp >= 0
  ),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

CREATE INDEX IF NOT EXISTS inventory_items_category_idx
  ON public.inventory_items (category) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_sku_idx
  ON public.inventory_items (sku) WHERE sku IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.inventory_batches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id       uuid NOT NULL REFERENCES public.inventory_items (id) ON DELETE CASCADE,
  supplier_id   uuid REFERENCES public.suppliers (id) ON DELETE SET NULL,
  lot_number    text,
  expires_on    date,
  received_at   timestamptz NOT NULL DEFAULT now(),
  qty_received  numeric NOT NULL CHECK (qty_received > 0),
  -- Running remainder. Only ever written by consume_inventory_stock() (added
  -- in 20260915170000_inventory_transactions.sql) or the restock/adjustment
  -- mutations in src/services/inventory/mutations.ts — never edited freehand,
  -- so "how much is left in this batch" always matches the transaction rows
  -- that drew from it.
  qty_remaining numeric NOT NULL CHECK (qty_remaining >= 0),
  unit_cost_egp numeric NOT NULL DEFAULT 0 CHECK (unit_cost_egp >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (qty_remaining <= qty_received)
);

CREATE INDEX IF NOT EXISTS inventory_batches_item_idx
  ON public.inventory_batches (item_id);
-- The FEFO picker's core query: earliest-expiry-with-stock-left, per item.
-- NULLS LAST so an un-dated batch never jumps ahead of dated stock.
CREATE INDEX IF NOT EXISTS inventory_batches_fefo_idx
  ON public.inventory_batches (item_id, expires_on NULLS LAST, received_at)
  WHERE qty_remaining > 0;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_admin_all ON public.suppliers;
CREATE POLICY suppliers_admin_all ON public.suppliers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS inventory_items_admin_all ON public.inventory_items;
CREATE POLICY inventory_items_admin_all ON public.inventory_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS inventory_batches_admin_all ON public.inventory_batches;
CREATE POLICY inventory_batches_admin_all ON public.inventory_batches
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Full system_action_log audit trail on all three — loss prevention is the
-- point of this module, so "who changed this item's reorder threshold, and
-- what was it before" must be answerable the same way a reservation edit is.
DROP TRIGGER IF EXISTS suppliers_log_action ON public.suppliers;
CREATE TRIGGER suppliers_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS inventory_items_log_action ON public.inventory_items;
CREATE TRIGGER inventory_items_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS inventory_batches_log_action ON public.inventory_batches;
CREATE TRIGGER inventory_batches_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_batches
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

-- suppliers and inventory_items join the revertible-tables list in
-- revert_system_action() (20260915010000_system_action_log_revert_rpc.sql).
-- inventory_batches does NOT: qty_remaining is a derived running total kept
-- in sync with inventory_transactions, and a naive revert would desync it —
-- corrections to a batch go through an 'adjustment' transaction instead.
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
    'profiles', 'roles', 'permissions',
    'suppliers', 'inventory_items'
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
