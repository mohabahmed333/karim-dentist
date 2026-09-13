-- Deposits, and the receipts patients send to prove they paid one.
--
-- A no-show costs the clinic a chair hour it can never sell again. The cheapest
-- deterrent available here is a small deposit: the assistant books the slot but
-- holds it, tells the patient where to transfer the money, and waits for a
-- screenshot of the receipt. There is no payment gateway — Egyptian clinics take
-- InstaPay and wallet transfers, and a merchant account is weeks of paperwork
-- for money that is already arriving.
--
-- A screenshot is a picture of a claim, not proof of payment. Nothing here
-- changes that, and the honest framing is that this converts no-shows into a
-- small amount of fraud, capped by the deposit amount. What the schema can do is
-- make the cheap attacks impossible: the same image can never be accepted twice,
-- and neither can the same transaction reference. Both are enforced by unique
-- indexes rather than by application logic, because two webhooks carrying the
-- same screenshot can race and only the database can settle that.
--
-- Settings live in their own table, not in site_settings: that singleton is
-- writable by the admin chat model through cms.update_singleton, and no model
-- should be able to edit the account the clinic's money is sent to. Same
-- reasoning as 20260910190000_whatsapp_ai_core.sql.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.deposit_receipts;
--   DROP TABLE IF EXISTS public.deposit_requests;
--   DROP TABLE IF EXISTS public.deposit_settings;

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deposit_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-4000-8000-0000000000d1',
  -- Ships off. Turning it on starts asking patients for money.
  enabled boolean NOT NULL DEFAULT false,
  amount_egp numeric(10, 2) NOT NULL DEFAULT 0 CHECK (amount_egp >= 0),
  -- Only EGP for now; the column exists so a receipt in another currency can be
  -- compared against something rather than assumed.
  currency text NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  instapay_handle text NOT NULL DEFAULT '',
  wallet_number text NOT NULL DEFAULT '',
  -- How the clinic's own name prints on a receipt, including in Arabic. Without
  -- at least one entry here the recipient check can never pass and every receipt
  -- lands in the staff queue, so Settings surfaces this as its own condition.
  recipient_names text[] NOT NULL DEFAULT '{}',
  hold_minutes integer NOT NULL DEFAULT 30
    CHECK (hold_minutes BETWEEN 5 AND 240),
  -- A second, independent switch. Deposits can be collected and reviewed by
  -- hand long before anyone trusts the model to confirm a booking by itself.
  auto_confirm boolean NOT NULL DEFAULT false,
  min_confidence numeric NOT NULL DEFAULT 0.75
    CHECK (min_confidence BETWEEN 0 AND 1),
  -- Slack for a patient who rounds the transfer up, or a fee taken off the top.
  amount_tolerance_egp numeric(10, 2) NOT NULL DEFAULT 0
    CHECK (amount_tolerance_egp >= 0),
  receipt_max_age_hours integer NOT NULL DEFAULT 48
    CHECK (receipt_max_age_hours BETWEEN 1 AND 720),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.deposit_settings (id)
SELECT '00000000-0000-4000-8000-0000000000d1'
WHERE NOT EXISTS (SELECT 1 FROM public.deposit_settings);

ALTER TABLE public.deposit_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deposit_settings_admin_all ON public.deposit_settings;
CREATE POLICY deposit_settings_admin_all ON public.deposit_settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- One deposit being waited for
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL UNIQUE
    REFERENCES public.reservations (id) ON DELETE CASCADE,
  conversation_id uuid
    REFERENCES public.whatsapp_conversations (id) ON DELETE SET NULL,
  slot_id uuid REFERENCES public.appointment_slots (id) ON DELETE SET NULL,
  phone text NOT NULL,
  amount_egp numeric(10, 2) NOT NULL CHECK (amount_egp > 0),
  status text NOT NULL DEFAULT 'awaiting_receipt'
    CHECK (status IN (
      'awaiting_receipt', 'in_review', 'paid', 'expired', 'rejected', 'cancelled'
    )),
  -- Absolute, computed once when the hold is taken. Never created_at plus the
  -- current hold_minutes: an admin shortening that setting must not retroactively
  -- kill holds that patients were already promised.
  expires_at timestamptz NOT NULL,
  -- The handle and amount as quoted to this patient. A later Settings edit must
  -- not invalidate money already sent to the old account, and staff reviewing a
  -- receipt need to see what the patient was actually told to do.
  settings_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  decision_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- At most one live deposit per conversation. This is what turns "which deposit
-- does this screenshot belong to?" into a single-row lookup with no ambiguity
-- and no guessing, which is why the inbound-image path stays small.
CREATE UNIQUE INDEX IF NOT EXISTS deposit_requests_open_per_conversation
  ON public.deposit_requests (conversation_id)
  WHERE status IN ('awaiting_receipt', 'in_review') AND conversation_id IS NOT NULL;

-- The expiry sweep's only query.
CREATE INDEX IF NOT EXISTS deposit_requests_awaiting_idx
  ON public.deposit_requests (expires_at)
  WHERE status = 'awaiting_receipt';

ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deposit_requests_admin_all ON public.deposit_requests;
CREATE POLICY deposit_requests_admin_all ON public.deposit_requests
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Every screenshot we were sent, and what we made of it
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deposit_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_request_id uuid NOT NULL
    REFERENCES public.deposit_requests (id) ON DELETE CASCADE,
  message_id uuid NOT NULL UNIQUE
    REFERENCES public.whatsapp_messages (id) ON DELETE CASCADE,
  -- Hashed from the bytes we fetched ourselves, never the hash the vendor
  -- reported: the index below is only as trustworthy as what it is computed over.
  image_sha256 text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  -- The model's whole answer, kept verbatim. When a patient disputes a
  -- rejection months later this is the only evidence of what we read.
  extracted jsonb NOT NULL DEFAULT '{}'::jsonb,
  amount_egp numeric(10, 2),
  reference text,
  sender_name text,
  recipient_name text,
  recipient_handle text,
  transferred_at timestamptz,
  confidence numeric CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  -- 'unreadable' is not a rejection: it means we could not see, and a person
  -- should look. Only the verifier writes 'confirm'.
  verdict text NOT NULL
    CHECK (verdict IN ('confirm', 'review', 'reject', 'unreadable')),
  verdict_reason text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  prompt_version text NOT NULL DEFAULT '',
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The same bytes can never be accepted twice — globally, not per request, so a
-- screenshot cannot be recycled against a different patient's deposit either.
-- The flow inserts the receipt row BEFORE deciding and reads a 23505 here as
-- "duplicate image", which is what makes Postgres rather than application code
-- the arbiter when two webhooks carry the same screenshot at once.
CREATE UNIQUE INDEX IF NOT EXISTS deposit_receipts_image_unique
  ON public.deposit_receipts (image_sha256)
  WHERE image_sha256 <> '';

-- A reference that was accepted, or is sitting in the staff queue, is spent.
-- One on an outright-rejected or unreadable image is not: otherwise a single OCR
-- misread would permanently burn a real transaction number the patient cannot
-- change. This means `verdict` must be treated as IMMUTABLE after insert —
-- staff decisions are written to deposit_requests, never back onto a receipt.
-- A partial unique index over a mutable predicate would be a quiet footgun.
CREATE UNIQUE INDEX IF NOT EXISTS deposit_receipts_reference_unique
  ON public.deposit_receipts (lower(btrim(reference)))
  WHERE reference IS NOT NULL
    AND btrim(reference) <> ''
    AND verdict IN ('confirm', 'review');

CREATE INDEX IF NOT EXISTS deposit_receipts_request_idx
  ON public.deposit_receipts (deposit_request_id, created_at DESC);

ALTER TABLE public.deposit_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deposit_receipts_admin_all ON public.deposit_receipts;
CREATE POLICY deposit_receipts_admin_all ON public.deposit_receipts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
