-- WhatsApp-verified billing payments: a patient replies to a billing request
-- with a receipt screenshot, which is read and verified by the exact same
-- pipeline appointment deposits use (src/services/deposits/{readReceipt,
-- verifyReceipt,ocrCorroborate}.ts — reused unmodified, not copied).
--
-- Deliberately a standalone table rather than reusing deposit_requests: that
-- table's reservation_id is NOT NULL UNIQUE (one deposit per reservation,
-- ever) and its only row-creation path is the atomic
-- book_slot_with_deposit_hold RPC, which books an appointment slot as part
-- of the same transaction. A bill has no slot to hold and no reservation
-- requirement, so none of that machinery applies — only the pure
-- verification logic and the deposit_settings singleton (InstaPay/wallet
-- identity, OCR thresholds) are shared.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.reject_billing_payment(uuid, uuid, text);
--   DROP FUNCTION IF EXISTS public.confirm_billing_payment(uuid, uuid, text);
--   DROP TABLE IF EXISTS public.billing_payment_receipts;
--   DROP TABLE IF EXISTS public.billing_payment_requests;

CREATE TABLE IF NOT EXISTS public.billing_payment_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     uuid NOT NULL REFERENCES public.treatment_proposals (id) ON DELETE CASCADE,
  patient_key     text NOT NULL,
  patient_name    text NOT NULL DEFAULT '',
  reservation_id  uuid REFERENCES public.reservations (id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.whatsapp_conversations (id) ON DELETE SET NULL,
  phone           text NOT NULL,
  amount_egp      numeric(10, 2) NOT NULL CHECK (amount_egp > 0),
  description     text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'awaiting_receipt'
    CHECK (status IN ('awaiting_receipt', 'in_review', 'paid', 'rejected', 'cancelled')),
  -- The InstaPay handle/wallet/amount as quoted to this patient, same
  -- reasoning as deposit_requests.settings_snapshot: a later Settings edit
  -- must not invalidate money already sent to the old account.
  settings_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  decided_at      timestamptz,
  decided_by      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  decision_reason text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- At most one live request per conversation — same protection
-- deposit_requests has, scoped to this table. A patient with both an open
-- deposit hold and an open billing request in the same conversation is a
-- rare, accepted edge case: the inbound-image router (see the queries/store
-- task) checks deposits first, so a billing screenshot sent while a deposit
-- hold is also open would be misrouted to the deposit path. Not solved here.
CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_requests_open_per_conversation
  ON public.billing_payment_requests (conversation_id)
  WHERE status IN ('awaiting_receipt', 'in_review') AND conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_payment_requests_proposal_idx
  ON public.billing_payment_requests (proposal_id);

CREATE INDEX IF NOT EXISTS billing_payment_requests_status_idx
  ON public.billing_payment_requests (status, created_at DESC);

ALTER TABLE public.billing_payment_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_payment_requests_admin_all ON public.billing_payment_requests;
CREATE POLICY billing_payment_requests_admin_all
  ON public.billing_payment_requests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.billing_payment_receipts (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_payment_request_id uuid NOT NULL
    REFERENCES public.billing_payment_requests (id) ON DELETE CASCADE,
  message_id      uuid NOT NULL UNIQUE REFERENCES public.whatsapp_messages (id) ON DELETE CASCADE,
  image_sha256    text NOT NULL DEFAULT '',
  image_url       text NOT NULL DEFAULT '',
  extracted       jsonb NOT NULL DEFAULT '{}'::jsonb,
  amount_egp      numeric(10, 2),
  reference       text,
  sender_name     text,
  recipient_name  text,
  recipient_handle text,
  transferred_at  timestamptz,
  confidence      numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  verdict         text NOT NULL CHECK (verdict IN ('confirm', 'review', 'reject', 'unreadable')),
  verdict_reason  text NOT NULL DEFAULT '',
  model           text NOT NULL DEFAULT '',
  prompt_version  text NOT NULL DEFAULT '',
  latency_ms      integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Same anti-replay pair deposit_receipts has, scoped to this table only: the
-- same image or reference accepted once against a deposit and once against a
-- billing payment is a known, accepted gap (see the table comment above) —
-- closing it would require a shared table across both features, out of
-- scope for this change.
CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_receipts_image_unique
  ON public.billing_payment_receipts (image_sha256)
  WHERE image_sha256 <> '';

CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_receipts_reference_unique
  ON public.billing_payment_receipts (lower(btrim(reference)))
  WHERE reference IS NOT NULL
    AND btrim(reference) <> ''
    AND verdict IN ('confirm', 'review');

CREATE INDEX IF NOT EXISTS billing_payment_receipts_request_idx
  ON public.billing_payment_receipts (billing_payment_request_id, created_at DESC);

ALTER TABLE public.billing_payment_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_payment_receipts_admin_all ON public.billing_payment_receipts;
CREATE POLICY billing_payment_receipts_admin_all
  ON public.billing_payment_receipts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Confirm / reject
-- ---------------------------------------------------------------------------

-- The only writer of the ledger's WhatsApp-payment side: confirming a
-- billing payment both settles the request and inserts the payment row in
-- one transaction, so the two can never disagree.
CREATE OR REPLACE FUNCTION public.confirm_billing_payment(
  p_billing_payment_request_id uuid,
  p_decided_by uuid DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.billing_payment_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.billing_payment_requests
  WHERE id = p_billing_payment_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'billing payment request not found';
  END IF;

  -- Idempotent: a webhook redelivery or a staff double-click must not raise,
  -- and must not double-pay the ledger.
  IF v_request.status = 'paid' THEN
    RETURN false;
  END IF;
  IF v_request.status NOT IN ('awaiting_receipt', 'in_review') THEN
    RAISE EXCEPTION 'billing payment request is %', v_request.status;
  END IF;

  UPDATE public.billing_payment_requests
  SET status = 'paid', decided_at = now(), decided_by = p_decided_by,
      decision_reason = coalesce(p_reason, ''), updated_at = now()
  WHERE id = p_billing_payment_request_id;

  INSERT INTO public.patient_billing_entries (
    patient_key, kind, amount_egp, description, method, created_by, reservation_id
  ) VALUES (
    v_request.patient_key, 'payment', v_request.amount_egp,
    coalesce(nullif(v_request.description, ''), 'WhatsApp payment'),
    'whatsapp', p_decided_by, v_request.reservation_id
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_billing_payment(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_billing_payment(uuid, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.reject_billing_payment(
  p_billing_payment_request_id uuid,
  p_decided_by uuid DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.billing_payment_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM public.billing_payment_requests
  WHERE id = p_billing_payment_request_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.status NOT IN ('awaiting_receipt', 'in_review') THEN
    RETURN false;
  END IF;

  UPDATE public.billing_payment_requests
  SET status = 'rejected', decided_at = now(), decided_by = p_decided_by,
      decision_reason = coalesce(p_reason, ''), updated_at = now()
  WHERE id = p_billing_payment_request_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_billing_payment(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_billing_payment(uuid, uuid, text) TO service_role;
