-- Inventory & Consumables, part 3: the FEFO/FIFO consumption ledger.
--
-- Append-only by design (see the RLS policies below — INSERT + SELECT only,
-- no UPDATE/DELETE grant even to admins): a correction is a new offsetting
-- row, never an edit to history, because this table IS the loss-prevention
-- audit trail, not just something system_action_log happens to also track.
--
-- FEFO consumption: consume_inventory_stock() draws from inventory_batches
-- ordered by (expires_on NULLS LAST, received_at) — expiry-first, not
-- strictly arrival-first, since a rush shipment can land after older stock
-- with a longer shelf life. It writes one row per batch it had to touch; a
-- single logical deduction spanning two batches becomes two rows sharing
-- deduction_group_id, so the UI can still show "1 fixture used" as one line
-- while the ledger underneath stays fully batch-traceable (which patient
-- got which lot of anesthesia/Botox, for a recall).
--
-- Rollback:
--   DELETE FROM public.permissions WHERE key IN ('inventory.restock', 'inventory.adjustment.record', 'inventory.wastage.log', 'inventory.wastage.approve');
--   DROP FUNCTION IF EXISTS public.approve_inventory_transaction(uuid, text, text);
--   DROP FUNCTION IF EXISTS public.consume_inventory_stock(uuid, numeric, text, text, text, uuid, uuid, uuid, uuid, text);
--   DROP TRIGGER IF EXISTS inventory_transactions_log_action ON public.inventory_transactions;
--   DROP TABLE IF EXISTS public.inventory_transactions;

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deduction_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id            uuid NOT NULL REFERENCES public.inventory_items (id) ON DELETE RESTRICT,
  batch_id           uuid REFERENCES public.inventory_batches (id) ON DELETE RESTRICT,
  type               text NOT NULL CHECK (type IN (
    'consumption', 'wastage', 'restock', 'adjustment', 'return'
  )),
  -- Always positive; `type` carries the direction (consumption/wastage draw
  -- down, restock/return top up, adjustment can do either — see reason_code).
  qty                numeric NOT NULL CHECK (qty > 0),
  unit_cost_egp      numeric NOT NULL DEFAULT 0,
  total_cost_egp     numeric GENERATED ALWAYS AS (qty * unit_cost_egp) STORED,

  -- What clinical event caused a consumption row. At most one is set; both
  -- are null for wastage/restock/adjustment/return.
  reservation_id       uuid REFERENCES public.reservations (id) ON DELETE SET NULL,
  patient_treatment_id uuid REFERENCES public.patient_treatments (id) ON DELETE SET NULL,

  -- Mandatory reason code for anything that isn't a plain visit-driven
  -- consumption — the app layer (logWastage/recordAdjustment) refuses to
  -- write wastage/adjustment rows without one.
  reason_code   text CHECK (reason_code IS NULL OR reason_code IN (
    'dropped_contaminated', 'expired', 'damaged_packaging', 'patient_no_show_opened',
    'equipment_failure', 'recount_correction', 'received_shipment',
    'returned_to_supplier', 'other'
  )),
  reason_note   text NOT NULL DEFAULT '',
  photo_url     text,

  -- Dual control for high-value wastage/adjustment. Mirrors
  -- treatment_proposals' sent/accepted/declined + decided_by shape.
  approval_status text NOT NULL DEFAULT 'auto_approved' CHECK (approval_status IN (
    'auto_approved', 'pending_review', 'confirmed', 'rejected'
  )),
  approved_by     uuid REFERENCES public.profiles (id),
  approved_at     timestamptz,

  created_by     uuid NOT NULL REFERENCES public.profiles (id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_transactions_item_idx
  ON public.inventory_transactions (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_transactions_batch_idx
  ON public.inventory_transactions (batch_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_group_idx
  ON public.inventory_transactions (deduction_group_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_pending_review_idx
  ON public.inventory_transactions (created_at) WHERE approval_status = 'pending_review';
CREATE INDEX IF NOT EXISTS inventory_transactions_created_by_idx
  ON public.inventory_transactions (created_by, created_at DESC);

-- Idempotency backstop: a given visit can only be auto-deducted once per
-- (item, batch). completeTreatment/completeReservation check for existing
-- consumption rows before drawing stock; this constraint is what a retried
-- click or a race actually collides with.
CREATE UNIQUE INDEX IF NOT EXISTS inventory_transactions_no_double_deduct_trt_idx
  ON public.inventory_transactions (patient_treatment_id, item_id, batch_id)
  WHERE type = 'consumption' AND patient_treatment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_transactions_no_double_deduct_resv_idx
  ON public.inventory_transactions (reservation_id, item_id, batch_id)
  WHERE type = 'consumption' AND reservation_id IS NOT NULL AND patient_treatment_id IS NULL;

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Deliberately NOT the standard <table>_admin_all FOR ALL policy: this
-- ledger must be append-only even to admins, or "delete the evidence" is
-- one DELETE statement away. INSERT + SELECT only; the one allowed
-- transition (approving/rejecting a pending_review row) goes through
-- approve_inventory_transaction() below, itself still logged by
-- system_action_log since that reads the trigger, not RLS.
DROP POLICY IF EXISTS inventory_transactions_admin_select ON public.inventory_transactions;
CREATE POLICY inventory_transactions_admin_select ON public.inventory_transactions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS inventory_transactions_admin_insert ON public.inventory_transactions;
CREATE POLICY inventory_transactions_admin_insert ON public.inventory_transactions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS inventory_transactions_log_action ON public.inventory_transactions;
CREATE TRIGGER inventory_transactions_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

-- ---------------------------------------------------------------------------
-- FEFO draw: locks candidate batches (oldest-expiry-first, tiebreak
-- received_at), draws across as many as needed, writes one transaction row
-- per batch touched. SECURITY DEFINER + FOR UPDATE so two doctors completing
-- appointments for the same scarce item at once cannot both draw past zero.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_inventory_stock(
  p_item_id uuid,
  p_qty numeric,
  p_type text,                 -- 'consumption' | 'wastage'
  p_reason_code text,
  p_reason_note text,
  p_reservation_id uuid,
  p_patient_treatment_id uuid,
  p_deduction_group_id uuid,
  p_created_by uuid,
  p_photo_url text
) RETURNS SETOF public.inventory_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining numeric := p_qty;
  batch record;
  draw numeric;
  threshold numeric;
  approval text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_type NOT IN ('consumption', 'wastage') THEN
    RAISE EXCEPTION 'Invalid type: %', p_type;
  END IF;
  IF p_type = 'wastage' AND p_reason_code IS NULL THEN
    RAISE EXCEPTION 'Wastage requires a reason code';
  END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  SELECT i.wastage_approval_threshold_egp INTO threshold
    FROM public.inventory_items i WHERE i.id = p_item_id;
  IF threshold IS NULL THEN
    SELECT s.wastage_approval_threshold_egp INTO threshold
      FROM public.inventory_settings s LIMIT 1;
  END IF;

  FOR batch IN
    SELECT b.id, b.qty_remaining, b.unit_cost_egp
    FROM public.inventory_batches b
    WHERE b.item_id = p_item_id AND b.qty_remaining > 0
    ORDER BY b.expires_on NULLS LAST, b.received_at
    FOR UPDATE
  LOOP
    EXIT WHEN remaining <= 0;
    draw := LEAST(remaining, batch.qty_remaining);

    UPDATE public.inventory_batches
      SET qty_remaining = qty_remaining - draw, updated_at = now()
      WHERE id = batch.id;

    approval := CASE
      WHEN p_type = 'wastage' AND threshold IS NOT NULL AND draw * batch.unit_cost_egp > threshold
        THEN 'pending_review'
      ELSE 'auto_approved'
    END;

    RETURN QUERY
      INSERT INTO public.inventory_transactions (
        deduction_group_id, item_id, batch_id, type, qty, unit_cost_egp,
        reservation_id, patient_treatment_id, reason_code, reason_note,
        photo_url, approval_status, created_by
      ) VALUES (
        p_deduction_group_id, p_item_id, batch.id, p_type, draw, batch.unit_cost_egp,
        p_reservation_id, p_patient_treatment_id, p_reason_code, p_reason_note,
        p_photo_url, approval, p_created_by
      ) RETURNING *;

    remaining := remaining - draw;
  END LOOP;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock for item %: % short', p_item_id, remaining;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_inventory_stock(
  uuid, numeric, text, text, text, uuid, uuid, uuid, uuid, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_inventory_stock(
  uuid, numeric, text, text, text, uuid, uuid, uuid, uuid, text
) TO authenticated;

-- ---------------------------------------------------------------------------
-- Dual control: a second admin confirms or rejects a pending_review wastage
-- row. Self-approval is blocked here, server-side — not just by the
-- permission gate, since one person can hold both grants.
--
-- Rejecting does NOT reverse the stock draw (the item is physically gone
-- regardless of paperwork); it flags the row for the manager's variance
-- review. A genuinely wrong entry is corrected with a fresh offsetting
-- 'adjustment' row, keeping the ledger append-only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_inventory_transaction(
  p_transaction_id uuid,
  p_decision text,             -- 'confirmed' | 'rejected'
  p_note text
) RETURNS public.inventory_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  txn public.inventory_transactions%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_decision NOT IN ('confirmed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;

  SELECT * INTO txn FROM public.inventory_transactions
    WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  IF txn.approval_status <> 'pending_review' THEN
    RAISE EXCEPTION 'Transaction is not pending review';
  END IF;
  IF txn.created_by = auth.uid() THEN
    RAISE EXCEPTION 'Requires a second reviewer — you cannot approve your own entry';
  END IF;

  UPDATE public.inventory_transactions
  SET approval_status = p_decision,
      approved_by = auth.uid(),
      approved_at = now(),
      reason_note = CASE WHEN p_note IS NOT NULL AND p_note <> ''
        THEN reason_note || E'\n[review] ' || p_note
        ELSE reason_note END
  WHERE id = p_transaction_id
  RETURNING * INTO txn;

  RETURN txn;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_inventory_transaction(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_inventory_transaction(uuid, text, text) TO authenticated;

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('inventory.restock', 'inventory', 'Receive stock / record batches', 314),
  ('inventory.adjustment.record', 'inventory', 'Record a stock recount/adjustment', 315),
  ('inventory.wastage.log', 'inventory', 'Log wastage/spillage', 316),
  ('inventory.wastage.approve', 'inventory', 'Approve high-value wastage', 317)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key IN ('inventory.restock', 'inventory.adjustment.record', 'inventory.wastage.log', 'inventory.wastage.approve')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'front-desk'
  AND p.key IN ('inventory.restock', 'inventory.adjustment.record', 'inventory.wastage.log')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'doctor'
  AND p.key = 'inventory.wastage.log'
ON CONFLICT DO NOTHING;
