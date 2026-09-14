-- Inventory & Consumables, part 4: staff-facing low-stock WhatsApp outbox.
--
-- Modeled on patient_notifications (20260911100000_patient_notifications.sql)
-- but this is an internal alert to the clinic manager, not a patient
-- conversation — there is no whatsapp_conversations row for staff, so
-- dispatch bypasses sendWhatsappMessage's 24h-session logic entirely and
-- calls the lower-level sendKapsoPayload directly with an approved template
-- (see src/services/inventory/dispatchLowStockAlerts.ts).
--
-- Event-driven, not a periodic sweep: a stock level dropping below threshold
-- has a triggering row (the very UPDATE that dropped it), unlike
-- followupsAndRecalls.ts's scan, which exists because that domain has none.
--
-- Rollback:
--   DELETE FROM public.permissions WHERE key IN ('inventory.view', 'inventory.items.manage', 'inventory.suppliers.manage', 'inventory.reports.view');
--   DROP TRIGGER IF EXISTS inventory_batches_low_stock_check ON public.inventory_batches;
--   DROP FUNCTION IF EXISTS public.enqueue_low_stock_alert();
--   DROP TABLE IF EXISTS public.inventory_alerts;
--   DROP TABLE IF EXISTS public.inventory_settings;

CREATE TABLE IF NOT EXISTS public.inventory_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-4000-8000-0000000000c1'::uuid,
  mode text NOT NULL DEFAULT 'off' CHECK (mode IN ('off', 'dry_run', 'send')),
  manager_whatsapp_phone text,
  -- Clinic-wide fallback when inventory_items.wastage_approval_threshold_egp
  -- is null for the item being wasted.
  wastage_approval_threshold_egp numeric NOT NULL DEFAULT 500
    CHECK (wastage_approval_threshold_egp >= 0),
  -- Wastage at or above this EGP value additionally requires a photo.
  wastage_photo_threshold_egp numeric NOT NULL DEFAULT 1000
    CHECK (wastage_photo_threshold_egp >= 0),
  -- An item that stays below its min stock level gets at most one real send
  -- per this many days, unless it drops further — see dispatchLowStockAlerts.ts.
  realert_after_days int NOT NULL DEFAULT 3 CHECK (realert_after_days > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.inventory_settings (id)
SELECT '00000000-0000-4000-8000-0000000000c1'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_settings);

CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items (id) ON DELETE CASCADE,

  -- '<item_id>:<date>:<floor(qty_on_hand)>' — see enqueue_low_stock_alert().
  -- One alert row per item per day at a given stock level; a further drop
  -- within the same day mints a new bucket (new key), so a fast-draining
  -- item still escalates same-day instead of going quiet after the first.
  dedupe_key text NOT NULL,

  qty_on_hand numeric NOT NULL,
  min_stock_level numeric NOT NULL,
  suggested_reorder_qty numeric NOT NULL,
  supplier_id uuid REFERENCES public.suppliers (id) ON DELETE SET NULL,
  -- Snapshot at enqueue time; the dispatcher re-resolves current item/supplier
  -- data at send time and only trusts this for what was true when queued.
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  scheduled_for timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sending', 'sent', 'failed', 'skipped', 'abandoned'
  )),
  skip_reason text,
  attempts int NOT NULL DEFAULT 0,
  lease_until timestamptz,
  send_started_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_alerts_dedupe_idx
  ON public.inventory_alerts (dedupe_key);
CREATE INDEX IF NOT EXISTS inventory_alerts_due_idx
  ON public.inventory_alerts (scheduled_for) WHERE status IN ('pending', 'sending');
CREATE INDEX IF NOT EXISTS inventory_alerts_item_sent_idx
  ON public.inventory_alerts (item_id, sent_at DESC) WHERE status = 'sent';

ALTER TABLE public.inventory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_settings_admin_all ON public.inventory_settings;
CREATE POLICY inventory_settings_admin_all ON public.inventory_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin-read only for the outbox: the only writer is the SECURITY DEFINER
-- trigger below plus the dispatcher's service-role client (which bypasses
-- RLS), same reasoning as patient_notifications.
DROP POLICY IF EXISTS inventory_alerts_admin_all ON public.inventory_alerts;
CREATE POLICY inventory_alerts_admin_all ON public.inventory_alerts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.enqueue_low_stock_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item record;
  v_on_hand numeric;
  v_key text;
BEGIN
  BEGIN
    SELECT id, name, min_stock_level, reorder_qty, default_supplier_id, last_unit_cost_egp
      INTO v_item FROM public.inventory_items WHERE id = NEW.item_id;
    IF v_item.id IS NULL OR v_item.min_stock_level <= 0 THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(SUM(qty_remaining), 0) INTO v_on_hand
      FROM public.inventory_batches WHERE item_id = v_item.id;
    IF v_on_hand > v_item.min_stock_level THEN
      RETURN NEW;
    END IF;

    v_key := v_item.id || ':' || to_char(now(), 'YYYY-MM-DD') || ':' || floor(v_on_hand)::text;

    INSERT INTO public.inventory_alerts (
      item_id, dedupe_key, qty_on_hand, min_stock_level, suggested_reorder_qty,
      supplier_id, payload
    ) VALUES (
      v_item.id, v_key, v_on_hand, v_item.min_stock_level,
      GREATEST(v_item.reorder_qty, v_item.min_stock_level - v_on_hand),
      v_item.default_supplier_id,
      jsonb_build_object('item_name', v_item.name, 'last_unit_cost_egp', v_item.last_unit_cost_egp)
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- A logging/alerting failure must never roll back the stock write that
    -- triggered it. Visible in Postgres logs, invisible to the checkout flow.
    RAISE WARNING 'enqueue_low_stock_alert failed for item %: %', NEW.item_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inventory_batches_low_stock_check ON public.inventory_batches;
CREATE TRIGGER inventory_batches_low_stock_check
  AFTER INSERT OR UPDATE OF qty_remaining ON public.inventory_batches
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_low_stock_alert();

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('inventory.view', 'inventory', 'View inventory & stock levels', 310),
  ('inventory.items.manage', 'inventory', 'Create/edit/archive inventory items', 311),
  ('inventory.suppliers.manage', 'inventory', 'Manage suppliers', 312),
  ('inventory.reports.view', 'inventory', 'View variance/shrinkage reports', 318)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key IN ('inventory.view', 'inventory.items.manage', 'inventory.suppliers.manage', 'inventory.reports.view')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'front-desk'
  AND p.key IN ('inventory.view', 'inventory.suppliers.manage')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'doctor'
  AND p.key = 'inventory.view'
ON CONFLICT DO NOTHING;
