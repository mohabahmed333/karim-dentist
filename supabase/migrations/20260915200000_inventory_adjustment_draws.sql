-- Let consume_inventory_stock() draw down through 'adjustment' as well as
-- 'wastage', so a negative recount correction (staff finds less on the
-- shelf than the ledger says) goes through the same FEFO-locked, batch-
-- traceable draw as a real deduction, instead of a hand-rolled decrement
-- that could pick the wrong batch. A positive adjustment (found more than
-- expected) still goes through the plain restock-style insert in
-- src/services/inventory/mutations.ts, since there's no batch to draw from.
--
-- Same reason-code and dual-control-threshold treatment as wastage: an
-- unusually large "recount correction" is exactly the shrinkage signal this
-- module exists to catch.
--
-- Rollback: revert to the CREATE OR REPLACE in 20260915170000_inventory_transactions.sql.

CREATE OR REPLACE FUNCTION public.consume_inventory_stock(
  p_item_id uuid,
  p_qty numeric,
  p_type text,                 -- 'consumption' | 'wastage' | 'adjustment'
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
  IF p_type NOT IN ('consumption', 'wastage', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid type: %', p_type;
  END IF;
  IF p_type IN ('wastage', 'adjustment') AND p_reason_code IS NULL THEN
    RAISE EXCEPTION '% requires a reason code', p_type;
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
      WHEN p_type IN ('wastage', 'adjustment')
        AND threshold IS NOT NULL AND draw * batch.unit_cost_egp > threshold
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
