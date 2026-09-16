-- Where patients send money, as a list rather than two fixed fields.
--
-- deposit_settings carried exactly one instapay_handle and one wallet_number,
-- so a clinic with a second wallet had nowhere to put it and staff read the
-- number off a sticky note. This holds as many as the clinic has, with one
-- marked primary per kind — the primaries are what a patient is told to pay,
-- while every active row still counts as valid when a receipt is checked, so
-- paying to an older number does not bounce into manual review.
--
-- Cards are deliberately not a kind here: storing a full card number is a
-- different class of data, and InstaPay and wallets are how Egyptian patients
-- actually transfer.
--
-- Rollback: DROP TABLE public.payment_methods;

CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('instapay', 'wallet')),
  -- What staff call it: "Vodafone Cash — reception", "NBE InstaPay".
  label text NOT NULL DEFAULT '',
  -- The handle or number a patient transfers to, exactly as they must type it.
  value text NOT NULL CHECK (btrim(value) <> ''),
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- One primary per kind. A partial unique index rather than a trigger: the
-- database refuses a second primary outright, so no code path can create one.
CREATE UNIQUE INDEX payment_methods_one_primary_per_kind
  ON public.payment_methods (kind)
  WHERE is_primary AND deleted_at IS NULL;

CREATE INDEX payment_methods_active_idx
  ON public.payment_methods (kind, sort_order)
  WHERE deleted_at IS NULL;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_methods_admin_all ON public.payment_methods
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Carry over what the clinic already had, so nothing has to be retyped and
-- the first bill after this migration reads exactly as the last one did.
INSERT INTO public.payment_methods (kind, label, value, is_primary, sort_order)
SELECT 'instapay', 'InstaPay', btrim(s.instapay_handle), true, 0
FROM public.deposit_settings s
WHERE btrim(COALESCE(s.instapay_handle, '')) <> ''
LIMIT 1;

INSERT INTO public.payment_methods (kind, label, value, is_primary, sort_order)
SELECT 'wallet', 'Wallet', btrim(s.wallet_number), true, 0
FROM public.deposit_settings s
WHERE btrim(COALESCE(s.wallet_number, '')) <> ''
LIMIT 1;
