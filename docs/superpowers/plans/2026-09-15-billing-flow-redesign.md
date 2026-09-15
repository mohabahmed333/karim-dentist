# Billing Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a doctor propose billed services for a patient (already built), let front desk see every pending billing request clinic-wide and settle each one either by collecting cash on the spot or by sending a session-aware WhatsApp payment request that a patient answers with a receipt screenshot — verified by the same AI/OCR pipeline the appointment-deposit feature already uses, auto-confirmed or routed to a staff review queue — and remove the ad-hoc billing forms from the single-patient page.

**Architecture:** Two new tables, `billing_payment_requests` and `billing_payment_receipts`, mirror `deposit_requests`/`deposit_receipts` but stand alone (that table is 1:1-locked to a reservation and can't represent a bill). The verification pipeline itself — `readReceipt`, `verifyReceipt`, `ocrCorroborate` — is pure and fully reused unmodified from `src/services/deposits/`. A new `settleTreatmentProposal` server action on the existing `treatment_proposals` feature drives both settlement paths; a clinic-wide "Billing requests" section is added to the existing `/admin/billing` page.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), Supabase (Postgres + RLS), zod, `node:test`.

**Spec:** `/Users/mohab/.claude/plans/i-need-to-open-flickering-otter.md` (the approved plan from this session's planning phase — no separate spec doc was written; the plan below is authoritative for exact schema/interfaces, superseding minor details in that file where they differ, e.g. `patient_name` is stored directly on `billing_payment_requests`).

## Global Constraints

- Every `yarn` command needs `GITHUB_TOKEN=x` prefixed (repo convention).
- Every migration follows the header-comment + `-- Rollback:` block convention, `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` / `DROP POLICY IF EXISTS` idempotent style (see `supabase/migrations/20260915060000_patient_billing_entries.sql`).
- `src/lib/supabase/database.types.ts` must be **hand-patched**, never regenerated wholesale with `supabase gen types` — the installed Supabase CLI drops literal-union types for every check-constrained column across the whole file when regenerating.
- Do **not** touch `TemplateKind` / `PATIENT_TEMPLATES` / `buildTemplateForKind` (`src/services/patient_notifications/templates.ts`, `templateParams.ts`) — those only get a case once a template is Meta-approved. `patient_notifications.kind` is typed as plain `string` in `database.types.ts` (not a literal union), so no TS-side change is needed there — only the DB CHECK constraint.
- No new nav entries, no new top-level routes — everything lives on the existing `/admin/billing` page (clinic-wide) and the existing `/admin/patients/[patientKey]/billing` page (now read-only).
- No new permission keys: `patients.treatments.edit` (doctor, propose — already used) and `patients.billing.edit` (owner + front-desk, settle/confirm/reject) already have the right role grants.
- Re-read every file you are about to modify immediately before editing — this repo has had continuous, unrelated concurrent work landing all session. Adapt to what's actually on disk rather than forcing this plan's exact diff if it's drifted; flag a real conflict rather than silently overwriting.
- New RPCs (`confirm_billing_payment`, `reject_billing_payment`) are `SECURITY DEFINER`, granted to `service_role` only (not `authenticated`) — exactly like `confirm_deposit_paid`/`reject_deposit`. This is because they must be callable both from the authenticated staff action *and* from the unauthenticated WhatsApp-webhook path, and the established pattern in this repo solves that by always calling through `createServiceClient()` regardless of caller context, gating access with `requirePermission` in application code beforehand rather than via RLS. Follow this exactly; do not grant these to `authenticated`.

---

### Task 1: Migration — `billing_payment_requests` + `billing_payment_receipts` + RPCs

**Files:**
- Create: `supabase/migrations/20260915220000_billing_payment_requests.sql` — run `ls supabase/migrations | tail -5` first and confirm this timestamp is still after the newest one there; if not, pick a fresh one after it.

**Interfaces:**
- Produces: tables `public.billing_payment_requests`, `public.billing_payment_receipts`; functions `public.confirm_billing_payment(uuid, uuid, text) returns boolean`, `public.reject_billing_payment(uuid, uuid, text) returns boolean`. No new permission rows — reuses `patients.billing.edit`.

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Push the migration**

Run: `supabase db push --linked`
Expected: prompts to apply this file (and any other pending migrations already sitting in the folder from concurrent work — apply those too). Confirm with `Y`.

- [ ] **Step 3: Apply it locally too**

Run: `supabase migration up`
Expected: `Local database is up to date.` after applying.

- [ ] **Step 4: Verify**

```bash
node -e '
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const env = fs.readFileSync(".env.local","utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const sb = createClient(url, key);
(async () => {
  const { error: e1 } = await sb.from("billing_payment_requests").select("id").limit(1);
  console.log("billing_payment_requests error (should be null):", e1?.message ?? null);
  const { error: e2 } = await sb.from("billing_payment_receipts").select("id").limit(1);
  console.log("billing_payment_receipts error (should be null):", e2?.message ?? null);
})();
'
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260915220000_billing_payment_requests.sql
git commit -m "$(cat <<'EOF'
feat(billing): add billing_payment_requests schema + confirm/reject RPCs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Migration — allow `billing_payment_request` in `patient_notifications.kind`

**Files:**
- Create: `supabase/migrations/20260915230000_patient_notifications_billing_payment_request.sql`

**Interfaces:**
- Produces: widened CHECK on `patient_notifications.kind`. Consumed by Task 6's `notify.ts`.

- [ ] **Step 1: Write the migration**

```sql
-- Allow a billing_payment_request notification — the fallback used when a
-- WhatsApp billing-payment ask is sent while the patient's 24h session is
-- closed. Same pattern as 20260915090000_patient_notifications_treatment_proposal.sql.
--
-- Rollback:
--   ALTER TABLE public.patient_notifications DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;
--   ALTER TABLE public.patient_notifications ADD CONSTRAINT patient_notifications_kind_check
--     CHECK (kind IN ('confirmation','reschedule','cancellation','reminder_24h','followup','recall_6m','waitlist_offer','review_request','treatment_proposal'));

ALTER TABLE public.patient_notifications
  DROP CONSTRAINT IF EXISTS patient_notifications_kind_check;

ALTER TABLE public.patient_notifications
  ADD CONSTRAINT patient_notifications_kind_check CHECK (kind IN (
    'confirmation', 'reschedule', 'cancellation', 'reminder_24h',
    'followup', 'recall_6m', 'waitlist_offer', 'review_request',
    'treatment_proposal', 'billing_payment_request'
  ));
```

- [ ] **Step 2: Push, apply locally, verify, commit** — same as Task 1 Steps 2–3, then:

```bash
git add supabase/migrations/20260915230000_patient_notifications_billing_payment_request.sql
git commit -m "$(cat <<'EOF'
feat(billing): allow billing_payment_request in patient_notifications.kind

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Hand-patch `database.types.ts`

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces: `Tables<"billing_payment_requests">`, `Tables<"billing_payment_receipts">`, `TablesInsert<...>` for both, and `Functions["confirm_billing_payment"]`/`Functions["reject_billing_payment"]` — consumed by every later task.

- [ ] **Step 1: Add the two table blocks**

Find where `deposit_requests`/`deposit_receipts` sit (`grep -n '^      deposit_re' src/lib/supabase/database.types.ts`) and insert `billing_payment_receipts`/`billing_payment_requests` alphabetically nearby (both sort near "billing_" — check exact neighbors with `grep -n '^      [a-z_]*: {' src/lib/supabase/database.types.ts | sort`):

```ts
      billing_payment_receipts: {
        Row: {
          amount_egp: number | null
          billing_payment_request_id: string
          confidence: number | null
          created_at: string
          extracted: Json
          id: string
          image_sha256: string
          image_url: string
          latency_ms: number | null
          message_id: string
          model: string
          prompt_version: string
          recipient_handle: string | null
          recipient_name: string | null
          reference: string | null
          sender_name: string | null
          transferred_at: string | null
          verdict: string
          verdict_reason: string
        }
        Insert: {
          amount_egp?: number | null
          billing_payment_request_id: string
          confidence?: number | null
          created_at?: string
          extracted?: Json
          id?: string
          image_sha256?: string
          image_url?: string
          latency_ms?: number | null
          message_id: string
          model?: string
          prompt_version?: string
          recipient_handle?: string | null
          recipient_name?: string | null
          reference?: string | null
          sender_name?: string | null
          transferred_at?: string | null
          verdict: string
          verdict_reason?: string
        }
        Update: {
          amount_egp?: number | null
          billing_payment_request_id?: string
          confidence?: number | null
          created_at?: string
          extracted?: Json
          id?: string
          image_sha256?: string
          image_url?: string
          latency_ms?: number | null
          message_id?: string
          model?: string
          prompt_version?: string
          recipient_handle?: string | null
          recipient_name?: string | null
          reference?: string | null
          sender_name?: string | null
          transferred_at?: string | null
          verdict?: string
          verdict_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payment_receipts_billing_payment_request_id_fkey"
            columns: ["billing_payment_request_id"]
            isOneToOne: false
            referencedRelation: "billing_payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payment_requests: {
        Row: {
          amount_egp: number
          conversation_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string
          description: string
          id: string
          patient_key: string
          patient_name: string
          phone: string
          proposal_id: string
          reservation_id: string | null
          settings_snapshot: Json
          status: string
          updated_at: string
        }
        Insert: {
          amount_egp: number
          conversation_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string
          description?: string
          id?: string
          patient_key: string
          patient_name?: string
          phone: string
          proposal_id: string
          reservation_id?: string | null
          settings_snapshot?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          amount_egp?: number
          conversation_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string
          description?: string
          id?: string
          patient_key?: string
          patient_name?: string
          phone?: string
          proposal_id?: string
          reservation_id?: string | null
          settings_snapshot?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payment_requests_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "treatment_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 2: Add the two RPC entries**

Find the `Functions` block's `confirm_deposit_paid`/`reject_deposit` entries (`grep -n 'confirm_deposit_paid: {' -A 4 src/lib/supabase/database.types.ts`) and add, alphabetically:

```ts
      confirm_billing_payment: {
        Args: { p_billing_payment_request_id: string; p_decided_by?: string; p_reason?: string }
        Returns: boolean
      }
```

right before `confirm_deposit_paid`, and:

```ts
      reject_billing_payment: {
        Args: { p_billing_payment_request_id: string; p_decided_by?: string; p_reason?: string }
        Returns: boolean
      }
```

right before `reject_deposit`.

- [ ] **Step 3: Verify it compiles**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: record this count as the baseline for later tasks' "no increase" checks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
chore(types): add billing_payment_requests/receipts tables + RPCs

Hand-patched, not regenerated — see Global Constraints in this plan.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `src/services/billing_payments/store.ts`

**Files:**
- Create: `src/services/billing_payments/store.ts`

**Interfaces:**
- Consumes: `Tables`/`TablesInsert` (Task 3), `createServiceClient` (`@/lib/supabase/service`).
- Produces: `findOpenBillingRequestByConversation`, `insertBillingPaymentRequest`, `insertBillingReceipt`, `markBillingRequestInReview`, `confirmBillingPayment`, `rejectBillingPayment` — consumed by Tasks 6, 7, 9. No test file for this task: `src/services/deposits/store.ts`, which this mirrors exactly, has none either — it's thin RPC/query wrappers, exercised indirectly through the handler test in Task 7.

- [ ] **Step 1: Write `store.ts`**

```ts
/**
 * Database access for billing payments. Mirrors src/services/deposits/store.ts.
 */

import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type BillingPaymentRequest = Tables<"billing_payment_requests">;

const UNIQUE_VIOLATION = "23505";

/**
 * The billing payment this conversation is currently waiting on.
 *
 * At most one exists: a partial unique index on (conversation_id) over the
 * two live statuses guarantees it.
 */
export async function findOpenBillingRequestByConversation(
  db: ServiceClient,
  conversationId: string,
): Promise<BillingPaymentRequest | null> {
  const { data } = await db
    .from("billing_payment_requests")
    .select("*")
    .eq("conversation_id", conversationId)
    .in("status", ["awaiting_receipt", "in_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export type InsertBillingRequestResult =
  | { ok: true; id: string }
  | { ok: false; duplicate: true }
  | { ok: false; duplicate: false; error: string };

export async function insertBillingPaymentRequest(
  db: ServiceClient,
  row: TablesInsert<"billing_payment_requests">,
): Promise<InsertBillingRequestResult> {
  const { data, error } = await db
    .from("billing_payment_requests")
    .insert(row)
    .select("id")
    .single();
  if (!error) return { ok: true, id: data.id };

  const code = (error as { code?: string }).code;
  if (code === UNIQUE_VIOLATION || /duplicate key/i.test(error.message)) {
    return { ok: false, duplicate: true };
  }
  return { ok: false, duplicate: false, error: error.message };
}

export type InsertBillingReceiptResult =
  | { ok: true }
  | { ok: false; duplicate: "image" | "reference" | "message" }
  | { ok: false; duplicate: null; error: string };

/**
 * Record what we were sent and what we made of it — before deciding, so two
 * webhooks carrying the same screenshot race in the database.
 */
export async function insertBillingReceipt(
  db: ServiceClient,
  row: TablesInsert<"billing_payment_receipts">,
): Promise<InsertBillingReceiptResult> {
  const { error } = await db.from("billing_payment_receipts").insert(row);
  if (!error) return { ok: true };

  const code = (error as { code?: string }).code;
  if (code === UNIQUE_VIOLATION || /duplicate key/i.test(error.message)) {
    if (/image_unique/.test(error.message)) return { ok: false, duplicate: "image" };
    if (/reference_unique/.test(error.message)) return { ok: false, duplicate: "reference" };
    return { ok: false, duplicate: "message" };
  }
  return { ok: false, duplicate: null, error: error.message };
}

export async function markBillingRequestInReview(
  db: ServiceClient,
  requestId: string,
  reason: string,
): Promise<void> {
  await db
    .from("billing_payment_requests")
    .update({ status: "in_review", decision_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", requestId);
}

/**
 * `changed` is false when the row was already decided — the RPC is
 * idempotent, so a webhook redelivery or a staff double-click must not raise.
 */
export async function confirmBillingPayment(
  db: ServiceClient,
  requestId: string,
  decidedBy: string | null,
  reason: string,
): Promise<{ ok: boolean; changed: boolean; error?: string }> {
  const { data, error } = await db.rpc("confirm_billing_payment", {
    p_billing_payment_request_id: requestId,
    p_decided_by: decidedBy ?? undefined,
    p_reason: reason,
  });
  return error
    ? { ok: false, changed: false, error: error.message }
    : { ok: true, changed: data === true };
}

export async function rejectBillingPayment(
  db: ServiceClient,
  requestId: string,
  decidedBy: string | null,
  reason: string,
): Promise<{ ok: boolean; changed: boolean; error?: string }> {
  const { data, error } = await db.rpc("reject_billing_payment", {
    p_billing_payment_request_id: requestId,
    p_decided_by: decidedBy ?? undefined,
    p_reason: reason,
  });
  return error
    ? { ok: false, changed: false, error: error.message }
    : { ok: true, changed: data === true };
}
```

- [ ] **Step 2: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over the Task 3 baseline.

- [ ] **Step 3: Commit**

```bash
git add src/services/billing_payments/store.ts
git commit -m "$(cat <<'EOF'
feat(billing): add billing_payments DB access layer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `src/services/billing_payments/receiptMessages.ts`

**Files:**
- Create: `src/services/billing_payments/receiptMessages.ts`
- Test: `src/services/billing_payments/receiptMessages.test.ts`

**Interfaces:**
- Consumes: `formatEgp`, `Language` (`@/services/deposits/receiptMessages`, already built, exported).
- Produces: `billingPaymentInstructions(input)`, `billingReceiptOutcomeMessage(input)` — consumed by Tasks 6 and 7.

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { billingPaymentInstructions, billingReceiptOutcomeMessage } from "./receiptMessages.ts";

describe("billingPaymentInstructions", () => {
  it("states the amount, description, and where to pay", () => {
    const text = billingPaymentInstructions({
      amountEgp: 1500,
      description: "Root canal",
      instapayHandle: "clinic@instapay",
      walletNumber: "01005551234",
      language: "en",
    });
    assert.match(text, /EGP 1,500/);
    assert.match(text, /Root canal/);
    assert.match(text, /clinic@instapay/);
    assert.match(text, /01005551234/);
  });

  it("omits an unset destination", () => {
    const text = billingPaymentInstructions({
      amountEgp: 500,
      description: "Filling",
      instapayHandle: "",
      walletNumber: "01005551234",
      language: "en",
    });
    assert.doesNotMatch(text, /Transfer to: —/);
    assert.match(text, /01005551234/);
  });

  it("renders in Arabic", () => {
    const text = billingPaymentInstructions({
      amountEgp: 1500,
      description: "حشو",
      instapayHandle: "clinic@instapay",
      walletNumber: "",
      language: "ar",
    });
    assert.match(text, /جنيه/);
    assert.match(text, /حشو/);
  });
});

describe("billingReceiptOutcomeMessage", () => {
  it("confirms on 'ok'", () => {
    const text = billingReceiptOutcomeMessage({ reason: "ok", language: "en", amountEgp: 1500 });
    assert.match(text, /received/i);
  });

  it("quantifies a shortfall", () => {
    const text = billingReceiptOutcomeMessage({
      reason: "amount_short",
      language: "en",
      amountEgp: 1500,
      paidEgp: 1000,
    });
    assert.match(text, /EGP 1,000/);
    assert.match(text, /EGP 500/);
  });

  it("falls back to the review message for an unrecognised reason", () => {
    const text = billingReceiptOutcomeMessage({
      reason: "some_new_reason",
      language: "en",
      amountEgp: 1500,
    });
    assert.match(text, /checking/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/receiptMessages.test.ts`
Expected: FAIL — `receiptMessages.ts` doesn't exist yet.

- [ ] **Step 3: Write `receiptMessages.ts`**

```ts
/**
 * What the patient is told about a billing payment request and its receipt.
 *
 * Composed here, by the server, mirroring src/services/deposits/receiptMessages.ts
 * — same reasoning: amounts and account details must never be hallucinated.
 * Every one of these is either a reply to a message the patient just sent (the
 * receipt outcomes), or is checked against the 24h session window by the
 * caller before being sent as free text (the initial ask, unlike a deposit ask
 * which is always itself a reply).
 */

import { formatEgp, type Language } from "@/services/deposits/receiptMessages";

export type BillingInstructionsInput = {
  amountEgp: number;
  description: string;
  instapayHandle: string;
  walletNumber: string;
  language: Language;
};

export function billingPaymentInstructions(input: BillingInstructionsInput): string {
  const amount = formatEgp(input.amountEgp, input.language);
  const destinations: string[] = [];
  if (input.instapayHandle.trim()) destinations.push(input.instapayHandle.trim());
  if (input.walletNumber.trim()) destinations.push(input.walletNumber.trim());
  const to = destinations.join(" — ");

  if (input.language === "ar") {
    return [
      `فاتورتك ${amount} (${input.description}).`,
      to ? `تحويل على: ${to}` : "",
      `ابعتلنا صورة إيصال التحويل هنا وهنأكد استلام الفلوس.`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Your bill is ${amount} (${input.description}).`,
    to ? `Transfer to: ${to}` : "",
    `Send us a screenshot of the receipt here and we'll confirm we received it.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type BillingOutcomeInput = {
  reason: string;
  language: Language;
  amountEgp: number;
  paidEgp?: number | null;
};

const CONFIRMED: Record<Language, string> = {
  en: "Payment received — thank you!",
  ar: "استلمنا التحويل — شكراً!",
};

const REVIEW: Record<Language, string> = {
  en: "Thanks — we've got your receipt and a colleague is checking it now.",
  ar: "شكراً — وصلنا الإيصال وزميلنا بيراجعه حالاً.",
};

const NOT_A_RECEIPT: Record<Language, string> = {
  en: "Thanks, but that doesn't look like a transfer receipt. Could you send the screenshot from your banking or wallet app?",
  ar: "شكراً، بس الصورة دي مش إيصال تحويل. تقدر تبعت صورة الإيصال من تطبيق البنك أو المحفظة؟",
};

const DUPLICATE: Record<Language, string> = {
  en: "We've already received this exact receipt. If you've made a second transfer, please send that receipt instead.",
  ar: "الإيصال ده وصلنا قبل كده. لو عملت تحويل تاني، ابعتلنا إيصاله.",
};

function shortfall(input: BillingOutcomeInput): string {
  const asked = formatEgp(input.amountEgp, input.language);
  if (typeof input.paidEgp !== "number") {
    return input.language === "ar"
      ? `المبلغ اللي في الإيصال أقل من الفاتورة (${asked}). تقدر تبعت فرق المبلغ وإيصاله؟`
      : `The amount on that receipt is less than the ${asked} bill. Could you send the difference and its receipt?`;
  }
  const paid = formatEgp(input.paidEgp, input.language);
  const rest = formatEgp(Math.max(input.amountEgp - input.paidEgp, 0), input.language);
  return input.language === "ar"
    ? `الإيصال بيقول ${paid}، والفاتورة ${asked}. فاضل ${rest} — ابعتلنا إيصالهم لما تحوّلهم.`
    : `That receipt shows ${paid}, and the bill is ${asked}. That leaves ${rest} — send us the receipt once you've transferred it.`;
}

/**
 * The message for one verdict reason. Anything unrecognised falls back to
 * the "a colleague is checking" wording — the safe default.
 */
export function billingReceiptOutcomeMessage(input: BillingOutcomeInput): string {
  const l = input.language;
  switch (input.reason) {
    case "ok":
      return CONFIRMED[l];
    case "amount_short":
      return shortfall(input);
    case "duplicate_image":
    case "duplicate_reference":
      return DUPLICATE[l];
    case "not_a_receipt":
      return NOT_A_RECEIPT[l];
    default:
      return REVIEW[l];
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/receiptMessages.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add src/services/billing_payments/receiptMessages.ts src/services/billing_payments/receiptMessages.test.ts
git commit -m "$(cat <<'EOF'
feat(billing): add billing payment request/outcome message text

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `src/services/billing_payments/notify.ts`

**Files:**
- Create: `src/services/billing_payments/notify.ts`

**Interfaces:**
- Consumes: `insertBillingPaymentRequest` (Task 4); `billingPaymentInstructions`, `billingReceiptOutcomeMessage` (Task 5); `loadDepositSettings` (`@/services/deposits/store`, already built); `resolveOrCreateConversation` (`@/services/patient_notifications/resolveConversation`, already built); `isWhatsappSessionOpen`, `latestInboundAt` (`@/services/whatsapp/sessionWindow`); `sendWhatsappMessage`, `WhatsappSessionClosedError` (`@/services/whatsapp/sendMessage`); `pickPatientLanguage` (`@/services/patient_notifications/pickLanguage`); `createKapsoClient`, `getKapsoConfig` (`@/lib/kapso/client`).
- Produces: `sendBillingPaymentRequest(db, input)`, `notifyBillingPaymentConfirmed(db, requestId, send?, now?)` — consumed by Task 9 (`settleTreatmentProposal`) and Task 10 (`decideBillingPayment`).

- [ ] **Step 1: Write `notify.ts`**

```ts
/**
 * Sending a billing payment request over WhatsApp, and telling the patient
 * later that it was confirmed.
 *
 * Unlike a deposit ask — always sent as a reply within an already-open
 * session — this ask is proactive (a receptionist clicked a button), so the
 * 24h window has to be checked explicitly: free text if it's open, otherwise
 * queued through the same patient_notifications outbox every other kind
 * uses, under 'billing_payment_request' (no Meta template yet — queues
 * correctly today, starts sending the moment one is approved, same as
 * 'treatment_proposal').
 */

import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import type { createServiceClient } from "@/lib/supabase/service";
import { loadDepositSettings } from "@/services/deposits/store";
import { pickPatientLanguage } from "@/services/patient_notifications/pickLanguage";
import { resolveOrCreateConversation } from "@/services/patient_notifications/resolveConversation";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";
import type { TemplateSendInput } from "@/services/whatsapp/sendKapso";
import { sendWhatsappMessage, WhatsappSessionClosedError } from "@/services/whatsapp/sendMessage";
import { isWhatsappSessionOpen, latestInboundAt } from "@/services/whatsapp/sessionWindow";
import { insertBillingPaymentRequest } from "./store";
import { billingPaymentInstructions, billingReceiptOutcomeMessage } from "./receiptMessages";

type ServiceClient = ReturnType<typeof createServiceClient>;

async function findConversationsBySuffix(db: ServiceClient, suffix: string) {
  const { data } = await db
    .from("whatsapp_conversations")
    .select("id,phone_number,updated_at")
    .eq("phone_suffix", suffix)
    .order("updated_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function resolveConversation(
  db: ServiceClient,
  phone: string,
  patientName: string,
): Promise<string> {
  return resolveOrCreateConversation(
    {
      findBySuffix: (suffix) => findConversationsBySuffix(db, suffix),
      async create(values) {
        const { data, error } = await db
          .from("whatsapp_conversations")
          .insert(values)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return { id: data.id };
      },
    },
    { phone, patientName },
  );
}

export type SendBillingPaymentRequestInput = {
  proposalId: string;
  patientKey: string;
  patientName: string;
  patientPhone: string;
  reservationId: string | null;
  amountEgp: number;
  description: string;
  /** The staff member who clicked "Request via WhatsApp". */
  sentBy: string | null;
};

export type SendBillingPaymentRequestResult =
  | { ok: true; requestId: string; via: "text" | "queued" }
  | { ok: false; error: string };

export async function sendBillingPaymentRequest(
  db: ServiceClient,
  input: SendBillingPaymentRequestInput,
): Promise<SendBillingPaymentRequestResult> {
  const settings = await loadDepositSettings(db);
  if (!settings) return { ok: false, error: "no_payment_settings" };
  if (!phoneSuffixForLookup(input.patientPhone)) {
    return { ok: false, error: "invalid_phone" };
  }

  const conversationId = await resolveConversation(db, input.patientPhone, input.patientName);

  const insertResult = await insertBillingPaymentRequest(db, {
    proposal_id: input.proposalId,
    patient_key: input.patientKey,
    patient_name: input.patientName,
    reservation_id: input.reservationId,
    conversation_id: conversationId,
    phone: input.patientPhone,
    amount_egp: input.amountEgp,
    description: input.description,
    settings_snapshot: {
      instapay_handle: settings.instapay_handle,
      wallet_number: settings.wallet_number,
    },
  });
  if (!insertResult.ok) {
    return {
      ok: false,
      error: insertResult.duplicate ? "already_awaiting_payment" : insertResult.error,
    };
  }
  const requestId = insertResult.id;

  const [{ data: conversation }, { data: lastInbound }] = await Promise.all([
    db
      .from("whatsapp_conversations")
      .select("contact_name,last_inbound_at")
      .eq("id", conversationId)
      .maybeSingle(),
    db
      .from("whatsapp_messages")
      .select("body,wa_timestamp")
      .eq("conversation_id", conversationId)
      .eq("direction", "inbound")
      .order("wa_timestamp", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const language = pickPatientLanguage({
    lastInboundBody: lastInbound?.body ?? "",
    patientName: conversation?.contact_name ?? input.patientName,
  });
  const openUntil = latestInboundAt(conversation?.last_inbound_at, [lastInbound?.wa_timestamp]);

  const text = billingPaymentInstructions({
    amountEgp: input.amountEgp,
    description: input.description,
    instapayHandle: settings.instapay_handle,
    walletNumber: settings.wallet_number,
    language,
  });

  if (isWhatsappSessionOpen(openUntil)) {
    try {
      const config = getKapsoConfig();
      await sendWhatsappMessage({
        service: db,
        client: createKapsoClient(),
        phoneNumberId: config.phoneNumberId,
        conversationId,
        sentBy: input.sentBy,
        // The clinic's own bookkeeping, not a human chatting — must not spend
        // the assistant's reply budget or trip the human_active gate.
        senderKind: "system",
        text,
      });
      return { ok: true, requestId, via: "text" };
    } catch (err) {
      // The window can close between reading it and sending. Fall through to
      // the queue below rather than failing the whole request.
      if (!(err instanceof WhatsappSessionClosedError)) {
        console.error("billing payment request failed to send", err);
      }
    }
  }

  const { error } = await db.from("patient_notifications").upsert(
    {
      kind: "billing_payment_request",
      dedupe_key: `${requestId}:billing_payment_request`,
      reservation_id: input.reservationId,
      phone: input.patientPhone,
      patient_name: input.patientName,
      service_label: `${input.description} — ${text}`.slice(0, 500),
      starts_at: null,
      source: "manual",
      scheduled_for: new Date().toISOString(),
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (error) return { ok: false, error: error.message };

  return { ok: true, requestId, via: "queued" };
}

export type NotifyResult =
  | { sent: true; via: "text" }
  | { sent: false; reason: "no_conversation" | "not_found" | "send_failed" | "lookup_failed" | "session_closed" };

export type SendBillingConfirmation = (input: {
  db: ServiceClient;
  conversationId: string;
  text: string;
}) => Promise<void>;

const realSend: SendBillingConfirmation = async ({ db, conversationId, text }) => {
  const config = getKapsoConfig();
  await sendWhatsappMessage({
    service: db,
    client: createKapsoClient(),
    phoneNumberId: config.phoneNumberId,
    conversationId,
    sentBy: null,
    senderKind: "system",
    text,
  });
};

/**
 * Tell the patient their WhatsApp payment was confirmed by staff.
 *
 * Simpler than the deposit equivalent (notifyDecision.ts): there is no
 * approved "payment received" template to fall back to when the session is
 * closed, so this only ever sends free text and reports `session_closed`
 * rather than attempting one. Never throws — the confirmation is already
 * committed by the time this runs.
 */
export async function notifyBillingPaymentConfirmed(
  db: ServiceClient,
  requestId: string,
  send: SendBillingConfirmation = realSend,
  now: Date = new Date(),
): Promise<NotifyResult> {
  try {
    const { data: request } = await db
      .from("billing_payment_requests")
      .select("conversation_id,amount_egp")
      .eq("id", requestId)
      .maybeSingle();
    if (!request) return { sent: false, reason: "not_found" };

    const conversationId = request.conversation_id;
    if (!conversationId) return { sent: false, reason: "no_conversation" };

    const [{ data: conversation }, { data: lastInbound }] = await Promise.all([
      db
        .from("whatsapp_conversations")
        .select("contact_name,last_inbound_at")
        .eq("id", conversationId)
        .maybeSingle(),
      db
        .from("whatsapp_messages")
        .select("body,wa_timestamp")
        .eq("conversation_id", conversationId)
        .eq("direction", "inbound")
        .order("wa_timestamp", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const language = pickPatientLanguage({
      lastInboundBody: lastInbound?.body ?? "",
      patientName: conversation?.contact_name ?? "",
    });
    const openUntil = latestInboundAt(conversation?.last_inbound_at, [lastInbound?.wa_timestamp]);
    if (!isWhatsappSessionOpen(openUntil, now)) {
      return { sent: false, reason: "session_closed" };
    }

    const text = billingReceiptOutcomeMessage({
      reason: "ok",
      language,
      amountEgp: Number(request.amount_egp ?? 0),
    });
    await send({ db, conversationId, text });
    return { sent: true, via: "text" };
  } catch (err) {
    console.error("billing payment confirmation notify failed", err);
    return { sent: false, reason: "lookup_failed" };
  }
}
```

- [ ] **Step 2: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline. If `TemplateSendInput` shows unused, remove that import (it was included for parity with `notifyDecision.ts` but this simpler version never builds one — check the live file before assuming).

- [ ] **Step 3: Commit**

```bash
git add src/services/billing_payments/notify.ts
git commit -m "$(cat <<'EOF'
feat(billing): send a session-aware WhatsApp billing payment request

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `src/services/billing_payments/handleInboundReceipt.ts` + wire into `processJob.ts`

**Files:**
- Create: `src/services/billing_payments/handleInboundReceipt.ts`
- Test: `src/services/billing_payments/handleInboundReceipt.test.ts`
- Modify: `src/services/whatsapp_ai/processJob.ts`

**Interfaces:**
- Consumes: `findOpenBillingRequestByConversation`, `insertBillingReceipt`, `markBillingRequestInReview`, `confirmBillingPayment`, `rejectBillingPayment` (Task 4); `billingReceiptOutcomeMessage` (Task 5); `fetchReceiptImage`, `readReceipt`, `verifyReceipt`, `receiptExtractionSchema`, `corroborate`, `readImageText`, `loadDepositSettings` (all already built in `@/services/deposits/`, reused unmodified).
- Produces: `handleInboundBillingReceipt(deps, inbound)` — consumed by `processJob.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { handleInboundBillingReceipt } from "./handleInboundReceipt.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { receiptExtractionSchema } from "@/services/deposits/receiptSchema.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

const NOW = new Date("2026-09-15T12:00:00Z");
const CONVERSATION = "conv-1";

const SETTINGS = {
  id: "d1",
  enabled: true,
  amount_egp: 200,
  currency: "EGP",
  instapay_handle: "clinic@instapay",
  wallet_number: "01005551234",
  recipient_names: ["Dental Lounge"],
  hold_minutes: 30,
  auto_confirm: true,
  min_confidence: 0.75,
  amount_tolerance_egp: 0,
  receipt_max_age_hours: 48,
  updated_at: NOW.toISOString(),
};

const REQUEST = {
  id: "req-1",
  proposal_id: "prop-1",
  patient_key: "patient-1",
  patient_name: "Sara",
  reservation_id: null,
  conversation_id: CONVERSATION,
  phone: "01005559999",
  amount_egp: 1500,
  description: "Root canal",
  status: "awaiting_receipt",
  settings_snapshot: {},
  decided_at: null,
  decided_by: null,
  decision_reason: "",
  created_at: "2026-09-15T11:50:00Z",
  updated_at: "2026-09-15T11:50:00Z",
};

const GOOD_EXTRACTION = receiptExtractionSchema.parse({
  isReceipt: true,
  amount: 1500,
  currency: "EGP",
  reference: "FT999",
  recipientHandle: "clinic@instapay",
  transferredAt: "2026-09-15T11:55:00Z",
  confidence: 0.95,
});

const image = {
  bytes: new Uint8Array([1]),
  sha256: "hash-abc",
  mime: "image/jpeg" as const,
  dataUri: "data:image/jpeg;base64,AQ==",
};

const inbound = (over: Record<string, unknown> = {}) => ({
  conversationId: CONVERSATION,
  messageId: "msg-1",
  messageType: "image",
  mediaUrl: "https://kapso.test/r.jpg",
  language: "en" as const,
  ...over,
});

function deps(over: Record<string, unknown> = {}, dbOver: Record<string, unknown> = {}) {
  const db = createFakeDb({
    tables: { deposit_settings: [SETTINGS], billing_payment_requests: [REQUEST] },
    ...dbOver,
  });
  return {
    db: {
      db: db as never,
      fetchImage: (async () => image) as never,
      read: (async () => ({
        extraction: GOOD_EXTRACTION,
        model: "gemini:x",
        promptVersion: "v1",
        latencyMs: 10,
      })) as never,
      now: () => NOW,
      ...over,
    },
    fake: db,
  };
}

describe("handleInboundBillingReceipt — what it refuses to touch", () => {
  it("passes a text message through", async () => {
    const { db } = deps();
    const out = await handleInboundBillingReceipt(db, inbound({ messageType: "text" }));
    assert.deepEqual(out, { handled: false });
  });

  it("passes an image through when no billing request is being waited on", async () => {
    const { db } = deps({}, { tables: { deposit_settings: [SETTINGS], billing_payment_requests: [] } });
    assert.deepEqual(await handleInboundBillingReceipt(db, inbound()), { handled: false });
  });

  it("passes through when payment settings have never been written", async () => {
    const { db } = deps({}, { tables: { deposit_settings: [], billing_payment_requests: [REQUEST] } });
    assert.deepEqual(await handleInboundBillingReceipt(db, inbound()), { handled: false });
  });
});

describe("handleInboundBillingReceipt — the happy path", () => {
  it("confirms the payment exactly once and tells the patient", async () => {
    const { db, fake } = deps();
    const out = await handleInboundBillingReceipt(db, inbound());
    assert.equal(out.handled, true);
    assert.equal(out.outcome, "confirmed");
    assert.match(out.replyText, /received/i);

    const confirms = fake.rpcCalls().filter((c) => c.fn === "confirm_billing_payment");
    assert.equal(confirms.length, 1);
    assert.equal(confirms[0].args.p_billing_payment_request_id, "req-1");
  });

  it("writes the receipt down before deciding", async () => {
    const { db, fake } = deps();
    await handleInboundBillingReceipt(db, inbound());
    const inserts = fake.insertsTo("billing_payment_receipts");
    assert.equal(inserts.length, 1);
    assert.equal(inserts[0].values.image_sha256, "hash-abc");
    assert.equal(inserts[0].values.reference, "FT999");
  });
});

describe("handleInboundBillingReceipt — replay", () => {
  it("rejects a screenshot the database has already seen", async () => {
    const { db, fake } = deps(
      {},
      {
        failOn: {
          "billing_payment_receipts.insert": {
            message: 'duplicate key value violates unique constraint "billing_payment_receipts_image_unique"',
          },
        },
      },
    );
    const out = await handleInboundBillingReceipt(db, inbound());
    assert.equal(out.outcome, "rejected");
    assert.equal(out.reason, "duplicate_image");
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "confirm_billing_payment").length, 0);
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "reject_billing_payment").length, 1);
  });
});

describe("handleInboundBillingReceipt — manual review mode", () => {
  it("holds a flawless receipt for staff when auto-confirm is off", async () => {
    const { db, fake } = deps(
      {},
      { tables: { deposit_settings: [{ ...SETTINGS, auto_confirm: false }], billing_payment_requests: [REQUEST] } },
    );
    const out = await handleInboundBillingReceipt(db, inbound());
    assert.equal(out.outcome, "review");
    assert.equal(out.reason, "manual_review_mode");
    assert.equal(fake.rpcCalls().filter((c) => c.fn === "confirm_billing_payment").length, 0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/handleInboundReceipt.test.ts`
Expected: FAIL — `handleInboundReceipt.ts` doesn't exist yet.

- [ ] **Step 3: Write `handleInboundReceipt.ts`**

```ts
/**
 * Deciding whether an inbound WhatsApp image is a billing-payment receipt,
 * and acting on it. Mirrors src/services/deposits/handleInboundImage.ts
 * closely — same pipeline, different tables, no expiry/hold logic (a
 * billing request has no slot to release, so it never lapses on its own).
 */

import { randomUUID } from "node:crypto";
import type { Json } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";
import { fetchReceiptImage, ReceiptImageError } from "@/services/deposits/fetchReceiptImage";
import { corroborate } from "@/services/deposits/ocrCorroborate";
import { readImageText } from "@/services/deposits/runOcr";
import { readReceipt, ReceiptReadError } from "@/services/deposits/readReceipt";
import { receiptExtractionSchema, type ReceiptExtraction } from "@/services/deposits/receiptSchema";
import type { Language } from "@/services/deposits/receiptMessages";
import { loadDepositSettings } from "@/services/deposits/store";
import { verifyReceipt } from "@/services/deposits/verifyReceipt";
import { billingReceiptOutcomeMessage } from "./receiptMessages";
import {
  confirmBillingPayment,
  findOpenBillingRequestByConversation,
  insertBillingReceipt,
  markBillingRequestInReview,
  rejectBillingPayment,
} from "./store";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type InboundImage = {
  conversationId: string;
  messageId: string;
  messageType: string;
  mediaUrl: string;
  language: Language;
};

export type HandleDeps = {
  db: ServiceClient;
  fetchImage?: typeof fetchReceiptImage;
  read?: typeof readReceipt;
  ocr?: typeof readImageText;
  now?: () => Date;
  env?: Record<string, string | undefined>;
};

export type HandleResult =
  | { handled: false }
  | { handled: true; outcome: "confirmed" | "review" | "rejected"; reason: string; replyText: string };

const NOT_HANDLED: HandleResult = { handled: false };
const emptyExtraction = (): ReceiptExtraction => receiptExtractionSchema.parse({});

export async function handleInboundBillingReceipt(
  deps: HandleDeps,
  inbound: InboundImage,
): Promise<HandleResult> {
  const { db } = deps;
  if (inbound.messageType !== "image") return NOT_HANDLED;

  // Reused for recipient identity + OCR thresholds only, not the `enabled`
  // toggle — that flag is specifically the deposit-collection switch.
  const settings = await loadDepositSettings(db);
  if (!settings) return NOT_HANDLED;

  const request = await findOpenBillingRequestByConversation(db, inbound.conversationId);
  if (!request) return NOT_HANDLED;

  const now = deps.now?.() ?? new Date();
  const language = inbound.language;
  const amountEgp = Number(request.amount_egp);

  if (!inbound.mediaUrl) {
    return finishReview(deps, request.id, "no_media_url", language, amountEgp, {
      messageId: inbound.messageId,
      extraction: emptyExtraction(),
      imageUrl: "",
      sha256: "",
    });
  }

  let image: Awaited<ReturnType<typeof fetchReceiptImage>>;
  try {
    image = await (deps.fetchImage ?? fetchReceiptImage)(inbound.mediaUrl);
  } catch (err) {
    const reason = err instanceof ReceiptImageError ? `image_${err.reason}` : "image_failed";
    return finishReview(deps, request.id, reason, language, amountEgp, {
      messageId: inbound.messageId,
      extraction: emptyExtraction(),
      imageUrl: inbound.mediaUrl,
      sha256: "",
    });
  }

  let extraction: ReceiptExtraction;
  let model = "";
  let promptVersion = "";
  let latencyMs: number | null = null;
  try {
    const read = await (deps.read ?? readReceipt)(image.dataUri, { env: deps.env });
    extraction = read.extraction;
    model = read.model;
    promptVersion = read.promptVersion;
    latencyMs = read.latencyMs;
  } catch (err) {
    const base = err instanceof ReceiptReadError ? err.reason : "extraction_failed";
    const detail = err instanceof Error ? err.message : "";
    const reason = detail && detail !== base ? `${base}: ${detail}`.slice(0, 300) : base;
    return finishReview(deps, request.id, reason, language, amountEgp, {
      messageId: inbound.messageId,
      extraction: emptyExtraction(),
      imageUrl: inbound.mediaUrl,
      sha256: image.sha256,
    });
  }

  const requiredFields = {
    amountEgp,
    toleranceEgp: Number(settings.amount_tolerance_egp),
    minConfidence: Number(settings.min_confidence),
    receiptMaxAgeHours: settings.receipt_max_age_hours,
    instapayHandle: settings.instapay_handle,
    walletNumber: settings.wallet_number,
    recipientNames: settings.recipient_names ?? [],
  };

  let verdict = verifyReceipt({
    extracted: extraction,
    required: requiredFields,
    request: { createdAt: request.created_at },
    seen: { imageUsed: false, referenceUsed: false },
    autoConfirm: settings.auto_confirm,
    now,
  });

  if (verdict.verdict === "confirm" && settings.ocr_cross_check) {
    const text = await (deps.ocr ?? readImageText)(image.bytes).catch(() => null);
    const corroboration = corroborate(text, extraction);
    if (corroboration.checked && corroboration.missing.length > 0) {
      verdict = verifyReceipt({
        extracted: extraction,
        required: requiredFields,
        request: { createdAt: request.created_at },
        seen: { imageUsed: false, referenceUsed: false },
        corroboration,
        autoConfirm: settings.auto_confirm,
        now,
      });
    }
  }

  const row = {
    billing_payment_request_id: request.id,
    message_id: inbound.messageId,
    image_sha256: image.sha256,
    image_url: inbound.mediaUrl,
    extracted: extraction as unknown as Json,
    amount_egp: extraction.amount,
    reference: extraction.reference,
    sender_name: extraction.senderName,
    recipient_name: extraction.recipientName,
    recipient_handle: extraction.recipientHandle,
    transferred_at: extraction.transferredAt,
    confidence: extraction.confidence,
    model,
    prompt_version: promptVersion,
    latency_ms: latencyMs,
  };

  const written = await insertBillingReceipt(db, {
    id: randomUUID(),
    ...row,
    verdict: verdict.verdict,
    verdict_reason: verdict.reason,
  });

  if (!written.ok && written.duplicate) {
    verdict = {
      verdict: "reject",
      reason: written.duplicate === "reference" ? "duplicate_reference" : "duplicate_image",
    };
    await insertBillingReceipt(db, {
      id: randomUUID(),
      ...row,
      verdict: verdict.verdict,
      verdict_reason: verdict.reason,
    });
  }

  const replyText = billingReceiptOutcomeMessage({
    reason: verdict.reason,
    language,
    amountEgp,
    paidEgp: extraction.amount,
  });

  if (verdict.verdict === "confirm") {
    await confirmBillingPayment(db, request.id, null, verdict.reason);
    return { handled: true, outcome: "confirmed", reason: verdict.reason, replyText };
  }
  if (verdict.verdict === "reject") {
    await rejectBillingPayment(db, request.id, null, verdict.reason);
    return { handled: true, outcome: "rejected", reason: verdict.reason, replyText };
  }
  await markBillingRequestInReview(db, request.id, verdict.reason);
  return { handled: true, outcome: "review", reason: verdict.reason, replyText };
}

async function finishReview(
  deps: HandleDeps,
  requestId: string,
  reason: string,
  language: Language,
  amountEgp: number,
  receipt: { messageId: string; extraction: ReceiptExtraction; imageUrl: string; sha256: string },
): Promise<HandleResult> {
  await insertBillingReceipt(deps.db, {
    id: randomUUID(),
    billing_payment_request_id: requestId,
    message_id: receipt.messageId,
    image_sha256: receipt.sha256,
    image_url: receipt.imageUrl,
    extracted: receipt.extraction as unknown as Json,
    verdict: "unreadable",
    verdict_reason: reason,
  });
  await markBillingRequestInReview(deps.db, requestId, reason);
  return {
    handled: true,
    outcome: "review",
    reason,
    replyText: billingReceiptOutcomeMessage({ reason, language, amountEgp }),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/handleInboundReceipt.test.ts`
Expected: 7 passing.

- [ ] **Step 5: Wire it into `processJob.ts`**

Re-read `src/services/whatsapp_ai/processJob.ts` fresh first (concurrent work may have touched it). Find the existing block (around the `handleInboundImage` call, roughly lines 133–155):

```ts
    const receipt = await handleInboundImage(
      { db },
      {
        conversationId: conversation.id,
        messageId: inbound.id,
        messageType: inbound.message_type,
        mediaUrl: receiptMediaUrl(inbound.media, inbound.raw),
        language: pickPatientLanguage({
          lastInboundBody: inbound.body ?? "",
          patientName: conversation.contact_name ?? "",
        }),
      },
    ).catch((err) => {
      console.error("deposit receipt handling failed", err);
      return { handled: false } as const;
    });
```

Add the import:

```ts
import { handleInboundBillingReceipt } from "@/services/billing_payments/handleInboundReceipt";
```

And change the block to try the billing-payment path when the deposit path didn't handle it — a screenshot that isn't a deposit receipt is not necessarily an ordinary photo either, since a billing request may also be waiting on this conversation:

```ts
    let receipt = await handleInboundImage(
      { db },
      {
        conversationId: conversation.id,
        messageId: inbound.id,
        messageType: inbound.message_type,
        mediaUrl: receiptMediaUrl(inbound.media, inbound.raw),
        language: pickPatientLanguage({
          lastInboundBody: inbound.body ?? "",
          patientName: conversation.contact_name ?? "",
        }),
      },
    ).catch((err) => {
      console.error("deposit receipt handling failed", err);
      return { handled: false } as const;
    });

    if (!receipt.handled) {
      receipt = await handleInboundBillingReceipt(
        { db },
        {
          conversationId: conversation.id,
          messageId: inbound.id,
          messageType: inbound.message_type,
          mediaUrl: receiptMediaUrl(inbound.media, inbound.raw),
          language: pickPatientLanguage({
            lastInboundBody: inbound.body ?? "",
            patientName: conversation.contact_name ?? "",
          }),
        },
      ).catch((err) => {
        console.error("billing payment receipt handling failed", err);
        return { handled: false } as const;
      });
    }
```

Everything below this block (the `if (receipt.handled) { ... send receipt.replyText ... }`) already works generically off `receipt.replyText` and needs no change.

- [ ] **Step 6: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline.

- [ ] **Step 7: Commit**

```bash
git add src/services/billing_payments/handleInboundReceipt.ts src/services/billing_payments/handleInboundReceipt.test.ts src/services/whatsapp_ai/processJob.ts
git commit -m "$(cat <<'EOF'
feat(billing): verify billing payment receipts via the deposit OCR pipeline

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `src/services/billing_payments/queries.ts` — the admin review queue

**Files:**
- Create: `src/services/billing_payments/queries.ts`
- Test: `src/services/billing_payments/queries.test.ts`

**Interfaces:**
- Produces: `BillingPaymentQueueRow` type, `toQueueRow(raw)` (pure), `listPendingBillingPayments(supabase)` — consumed by Task 12 (UI) and Task 13 (page wiring).

- [ ] **Step 1: Write the failing test for the pure mapper**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { toQueueRow } from "./queries.ts";

describe("toQueueRow", () => {
  it("picks the newest receipt when several were sent", () => {
    const row = toQueueRow({
      id: "req-1",
      status: "in_review",
      amount_egp: 1500,
      description: "Root canal",
      decision_reason: "low_confidence",
      phone: "01005559999",
      patient_name: "Sara",
      created_at: "2026-09-15T10:00:00Z",
      billing_payment_receipts: [
        { id: "r1", image_url: "u1", amount_egp: 1000, reference: "A", sender_name: null, recipient_name: null, recipient_handle: null, transferred_at: null, confidence: 0.5, verdict: "review", verdict_reason: "low_confidence", extracted: {}, created_at: "2026-09-15T10:01:00Z" },
        { id: "r2", image_url: "u2", amount_egp: 1500, reference: "B", sender_name: null, recipient_name: null, recipient_handle: null, transferred_at: null, confidence: 0.9, verdict: "review", verdict_reason: "low_confidence", extracted: {}, created_at: "2026-09-15T10:05:00Z" },
      ],
    });
    assert.equal(row.receipt?.id, "r2");
    assert.equal(row.receiptCount, 2);
  });

  it("has no receipt when none were sent yet", () => {
    const row = toQueueRow({
      id: "req-1",
      status: "awaiting_receipt",
      amount_egp: 1500,
      description: "Root canal",
      decision_reason: "",
      phone: "01005559999",
      patient_name: "Sara",
      created_at: "2026-09-15T10:00:00Z",
      billing_payment_receipts: [],
    });
    assert.equal(row.receipt, null);
    assert.equal(row.receiptCount, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/queries.test.ts`
Expected: FAIL — `queries.ts` doesn't exist yet.

- [ ] **Step 3: Write `queries.ts`**

```ts
/**
 * Reads for the admin billing-payments review queue. Mirrors
 * src/services/deposits/queries.ts's toQueueRow/listDeposits shape.
 */

import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type BillingPaymentQueueRow = {
  id: string;
  status: string;
  amountEgp: number;
  description: string;
  createdAt: string;
  decisionReason: string;
  phone: string;
  patientName: string;
  receipt: {
    id: string;
    imageUrl: string;
    amountEgp: number | null;
    reference: string | null;
    senderName: string | null;
    recipientName: string | null;
    recipientHandle: string | null;
    transferredAt: string | null;
    confidence: number | null;
    verdict: string;
    verdictReason: string;
    createdAt: string;
  } | null;
  receiptCount: number;
};

const SELECT = `
  id, status, amount_egp, description, created_at, decision_reason, phone, patient_name,
  billing_payment_receipts (
    id, image_url, amount_egp, reference, sender_name, recipient_name,
    recipient_handle, transferred_at, confidence, verdict, verdict_reason,
    extracted, created_at
  )
`;

type Raw = {
  id: string;
  status: string;
  amount_egp: number | string;
  description: string;
  created_at: string;
  decision_reason: string;
  phone: string;
  patient_name: string;
  billing_payment_receipts: {
    id: string;
    image_url: string;
    amount_egp: number | string | null;
    reference: string | null;
    sender_name: string | null;
    recipient_name: string | null;
    recipient_handle: string | null;
    transferred_at: string | null;
    confidence: number | string | null;
    verdict: string;
    verdict_reason: string;
    extracted: unknown;
    created_at: string;
  }[];
};

const num = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function toQueueRow(raw: Raw): BillingPaymentQueueRow {
  const receipts = [...(raw.billing_payment_receipts ?? [])].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  const latest = receipts[0] ?? null;

  return {
    id: raw.id,
    status: raw.status,
    amountEgp: num(raw.amount_egp) ?? 0,
    description: raw.description,
    createdAt: raw.created_at,
    decisionReason: raw.decision_reason ?? "",
    phone: raw.phone,
    patientName: raw.patient_name,
    receipt: latest
      ? {
          id: latest.id,
          imageUrl: latest.image_url,
          amountEgp: num(latest.amount_egp),
          reference: latest.reference,
          senderName: latest.sender_name,
          recipientName: latest.recipient_name,
          recipientHandle: latest.recipient_handle,
          transferredAt: latest.transferred_at,
          confidence: num(latest.confidence),
          verdict: latest.verdict,
          verdictReason: latest.verdict_reason,
          createdAt: latest.created_at,
        }
      : null,
    receiptCount: receipts.length,
  };
}

/** Every billing payment request awaiting a decision, newest first. */
export async function listPendingBillingPayments(
  supabase: ServerSupabase,
): Promise<BillingPaymentQueueRow[]> {
  const { data, error } = await supabase
    .from("billing_payment_requests")
    .select(SELECT)
    .in("status", ["awaiting_receipt", "in_review"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Raw[]).map(toQueueRow);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/queries.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Verify the build, then commit**

```bash
git add src/services/billing_payments/queries.ts src/services/billing_payments/queries.test.ts
git commit -m "$(cat <<'EOF'
feat(billing): add the billing-payments admin queue query

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `src/services/billing_payments/actions.ts` — `decideBillingPayment`

**Files:**
- Create: `src/services/billing_payments/actions.ts`
- Test: `src/services/billing_payments/actions.test.ts`

**Interfaces:**
- Consumes: `requirePermission` (`@/lib/api/requirePermission`); `createServiceClient` (`@/lib/supabase/service`); `confirmBillingPayment`, `rejectBillingPayment` (Task 4); `notifyBillingPaymentConfirmed` (Task 6).
- Produces: `decideBillingPayment(requestId, decision, reason?)` — consumed by Task 12's `BillingPaymentReviewList.tsx`.

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { decideBillingPayment } from "./actions.ts";

describe("decideBillingPayment", () => {
  it("throws Forbidden when the caller lacks patients.billing.edit", async () => {
    mock.module("@/lib/api/requirePermission", {
      namedExports: {
        requirePermission: async () => ({ supabase: null, session: null, error: { status: 403 } }),
      },
    });
    await assert.rejects(() => decideBillingPayment("req-1", "confirm"), /Forbidden/);
    mock.reset();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/actions.test.ts`
Expected: FAIL — `actions.ts` doesn't exist yet.

- [ ] **Step 3: Write `actions.ts`**

```ts
"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { confirmBillingPayment, rejectBillingPayment } from "./store";
import { notifyBillingPaymentConfirmed } from "./notify";

/**
 * Confirm or reject a WhatsApp billing payment from the review queue.
 *
 * Uses the service client for the actual RPC call, same as the deposits
 * confirm/reject route — confirm_billing_payment/reject_billing_payment are
 * SECURITY DEFINER, service_role-only (see Global Constraints), because they
 * must also be callable from the unauthenticated webhook path. The
 * permission check below is the real gate.
 */
export async function decideBillingPayment(
  requestId: string,
  decision: "confirm" | "reject",
  reason = "",
): Promise<{ ok: boolean }> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const service = createServiceClient();
  const decidedBy = auth.session.user.id;
  const finalReason = reason || `${decision}ed by staff`;

  const result =
    decision === "confirm"
      ? await confirmBillingPayment(service, requestId, decidedBy, finalReason)
      : await rejectBillingPayment(service, requestId, decidedBy, finalReason);

  if (!result.ok) throw new Error(result.error ?? "Could not apply");

  // Only a decision that actually moved the row notifies: the RPC is
  // idempotent, so a double-click must not thank the patient twice.
  if (decision === "confirm" && result.changed) {
    await notifyBillingPaymentConfirmed(service, requestId);
  }

  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/billing_payments/actions.test.ts`
Expected: 1 passing. If `node:test`'s `mock.module` is unavailable in this repo's Node version, check how `treatment_proposals` or `patient_billing`'s actions are tested (grep for an existing `actions.test.ts` in the repo first) and match that pattern instead — do not invent a different mocking approach.

- [ ] **Step 5: Verify the build, then commit**

```bash
git add src/services/billing_payments/actions.ts src/services/billing_payments/actions.test.ts
git commit -m "$(cat <<'EOF'
feat(billing): add decideBillingPayment confirm/reject action

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `treatment_proposals` — `listAllPendingProposals` + `settleTreatmentProposal`

**Files:**
- Modify: `src/services/treatment_proposals/queries.ts`
- Modify: `src/services/treatment_proposals/actions.ts`
- Test: `src/services/treatment_proposals/queries.test.ts` (extend)

**Interfaces:**
- Consumes: `groupReservationsByPatient` (`@/services/reservations/patientHistory`), `listReservationsServer` (`@/services/reservations/queries`) — the same directory-join pattern `listPatientBalances` uses; `sendBillingPaymentRequest` (Task 6); `addBillingEntry` (`@/services/patient_billing/mutations`, already built).
- Produces: `listAllPendingProposals(supabase)`; `settleTreatmentProposal(proposalId, method)` — consumed by Task 12 (UI) and Task 13 (page wiring).

- [ ] **Step 1: Re-read `src/services/treatment_proposals/queries.ts` and `actions.ts` fresh** (shown in full above from this session's exploration — confirm nothing has drifted since).

- [ ] **Step 2: Write the failing test for the new query's join**

Add to `src/services/treatment_proposals/queries.test.ts` (create it if it doesn't already exist alongside the existing `proposalTotal` tests — check first):

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { attachPatientInfo } from "./queries.ts";

describe("attachPatientInfo", () => {
  it("looks up each proposal's patient by patient_key", () => {
    const proposals = [
      { id: "p1", patientKey: "pk1", doctorId: "d1", status: "sent" as const, createdAt: "t", items: [], total: 0, reservationId: null },
    ];
    const directory = [
      { patientKey: "pk1", displayName: "Sara", phone: "0100", visits: [] },
    ];
    const result = attachPatientInfo(proposals, directory as never);
    assert.equal(result[0].displayName, "Sara");
    assert.equal(result[0].phone, "0100");
  });

  it("falls back to the bare key when no directory entry matches", () => {
    const proposals = [
      { id: "p1", patientKey: "pk-unknown", doctorId: "d1", status: "sent" as const, createdAt: "t", items: [], total: 0, reservationId: null },
    ];
    const result = attachPatientInfo(proposals, []);
    assert.equal(result[0].displayName, "pk-unknown");
    assert.equal(result[0].phone, "");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/treatment_proposals/queries.test.ts`
Expected: FAIL — `attachPatientInfo` doesn't exist yet.

- [ ] **Step 4: Add `attachPatientInfo` + `listAllPendingProposals` to `queries.ts`**

Add to the existing `src/services/treatment_proposals/queries.ts` (do not remove anything already there):

```ts
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";

export type PendingProposalWithPatient = PendingProposal & {
  displayName: string;
  phone: string;
};

/** Pure — attaches each proposal's patient name/phone from the directory. */
export function attachPatientInfo(
  proposals: PendingProposal[],
  directory: PatientGroup[],
): PendingProposalWithPatient[] {
  const infoByKey = new Map(directory.map((g) => [g.patientKey, g]));
  return proposals.map((proposal) => ({
    ...proposal,
    displayName: infoByKey.get(proposal.patientKey)?.displayName ?? proposal.patientKey,
    phone: infoByKey.get(proposal.patientKey)?.phone ?? "",
  }));
}

/** Every pending proposal, clinic-wide, with the patient it belongs to. */
export async function listAllPendingProposals(
  supabase: ServerSupabase,
): Promise<PendingProposalWithPatient[]> {
  const { data: proposals, error: proposalsError } = await supabase
    .from("treatment_proposals")
    .select("id, patient_key, doctor_id, status, created_at, reservation_id")
    .eq("status", "sent")
    .order("created_at", { ascending: false });
  if (proposalsError) throw proposalsError;
  if (!proposals || proposals.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("treatment_proposal_items")
    .select("id, proposal_id, service_id, description, amount_egp")
    .in("proposal_id", proposals.map((p) => p.id));
  if (itemsError) throw itemsError;

  const pending: PendingProposal[] = proposals.map((proposal) => {
    const proposalItems = mapItems((items ?? []).filter((item) => item.proposal_id === proposal.id));
    return {
      id: proposal.id,
      patientKey: proposal.patient_key,
      doctorId: proposal.doctor_id,
      status: proposal.status as ProposalStatus,
      createdAt: proposal.created_at,
      items: proposalItems,
      total: proposalTotal(proposalItems),
      reservationId: proposal.reservation_id,
    };
  });

  const reservations = await listReservationsServer(supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  return attachPatientInfo(pending, directory);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/treatment_proposals/queries.test.ts`
Expected: passing (2 new, plus the original `proposalTotal` tests if they live in this same file — keep them).

- [ ] **Step 6: Add `settleTreatmentProposal` to `actions.ts`**

Add to the existing `src/services/treatment_proposals/actions.ts`. `getProposalWithItems` only returns `patientKey`, not a display name or phone, so the WhatsApp branch resolves them the same way `page.tsx` already does — via the reservations-derived directory — rather than adding a new lookup path:

```ts
import { createServiceClient } from "@/lib/supabase/service";
import { addBillingEntry } from "@/services/patient_billing/mutations";
import { sendBillingPaymentRequest } from "@/services/billing_payments/notify";
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";

/**
 * Settle a pending proposal: always accepts it (same as decideTreatmentProposal),
 * then either records an immediate cash payment or sends a WhatsApp payment
 * request that settles the ledger later once verified/confirmed.
 */
export async function settleTreatmentProposal(
  proposalId: string,
  method: "cash" | "whatsapp_request",
): Promise<{ ok: true } | { ok: false; error: string }> {
export async function settleTreatmentProposal(
  proposalId: string,
  method: "cash" | "whatsapp_request",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const proposal = await getProposalWithItems(auth.supabase, proposalId);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "sent") throw new Error("Proposal already decided");

  await decideProposal(auth.supabase, proposalId, "accepted", auth.session.user.id);
  await createTreatmentsFromProposal(
    auth.supabase,
    proposal.patientKey,
    proposal.doctorId,
    proposal.items,
    proposal.reservationId,
  );

  const description = proposal.items.map((item) => item.description).join(", ") || "Treatment";

  if (method === "cash") {
    await addBillingEntry(auth.supabase, proposal.patientKey, auth.session.user.id, {
      kind: "payment",
      amount_egp: proposal.total,
      description,
      method: "cash",
      reservation_id: proposal.reservationId,
    });
    return { ok: true };
  }

  const reservations = await listReservationsServer(auth.supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  const patient = directory.find((g) => g.patientKey === proposal.patientKey);
  if (!patient) return { ok: false, error: "Patient phone not found" };

  const service = createServiceClient();
  const result = await sendBillingPaymentRequest(service, {
    proposalId,
    patientKey: proposal.patientKey,
    patientName: patient.displayName,
    patientPhone: patient.phone,
    reservationId: proposal.reservationId,
    amountEgp: proposal.total,
    description,
    sentBy: auth.session.user.id,
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
```

Add the two new imports this needs at the top of `actions.ts` alongside the existing ones:

```ts
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
```

- [ ] **Step 7: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline. `addBillingEntry`'s `BillingEntryUpsertValues` type requires `kind`/`amount_egp`/`description`/`method`/`reservation_id` — re-check `src/services/patient_billing/schemas.ts` for the exact field names/optionality before this step if the build disagrees; adapt rather than force.

- [ ] **Step 8: Commit**

```bash
git add src/services/treatment_proposals/queries.ts src/services/treatment_proposals/queries.test.ts src/services/treatment_proposals/actions.ts
git commit -m "$(cat <<'EOF'
feat(billing): add settleTreatmentProposal (cash or WhatsApp payment request)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: WhatsApp template proposal entry

**Files:**
- Modify: `src/services/patient_notifications/templateProposals.ts`
- Regenerate: `docs/PATIENT_NOTIFICATIONS.md`

**Interfaces:**
- Produces: an entry in `TEMPLATE_PROPOSALS` for `kind: "billing_payment_request"`.

- [ ] **Step 1: Add the entry**

In `TEMPLATE_PROPOSALS`, after the `treatment_proposal` entry:

```ts
  {
    kind: "billing_payment_request",
    title: "Billing payment requests",
    names: { en: "billing_payment_request_en", ar: "billing_payment_request_ar" },
    category: "UTILITY",
    params: ["patient name", "amount and description"],
    bodyEn: "Hi {{1}}, you have an outstanding bill: {{2}}. Reply here and we'll send payment details.",
    bodyAr: "أهلاً {{1}}، عندك فاتورة مستحقة: {{2}}. ابعتلنا هنا وهنبعتلك تفاصيل الدفع.",
  },
```

- [ ] **Step 2: Regenerate the runbook doc**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs scripts/write-template-proposals.mjs`
Expected: `docs/PATIENT_NOTIFICATIONS.md` updates between its generated markers.

- [ ] **Step 3: Verify the drift test passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_notifications/templateProposals.test.ts`
Expected: all passing.

- [ ] **Step 4: Commit**

```bash
git add src/services/patient_notifications/templateProposals.ts docs/PATIENT_NOTIFICATIONS.md
git commit -m "$(cat <<'EOF'
docs(whatsapp): add billing_payment_request to the templates-to-submit list

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: UI — `BillingPaymentReceiptCard`, `BillingPaymentReviewList`, `PendingBillingRequestsList`

**Files:**
- Create: `src/features/admin/components/billing/BillingPaymentReceiptCard.tsx`
- Create: `src/features/admin/components/billing/BillingPaymentReviewList.tsx`
- Create: `src/features/admin/components/billing/PendingBillingRequestsList.tsx`

**Interfaces:**
- Consumes: `BillingPaymentQueueRow` (Task 8); `decideBillingPayment` (Task 9); `PendingProposalWithPatient` (Task 10); `settleTreatmentProposal` (Task 10); `formatEgp` (`@/services/deposits/receiptMessages`).
- Produces: three components — consumed by Task 13's page wiring.

- [ ] **Step 1: Write `BillingPaymentReceiptCard.tsx`**

Modeled directly on `src/features/admin/components/DepositReceiptCard.tsx` (read in full during this session's research), but without the appointment fields (`serviceLabel`/`startsAt`/hold-expiry) since a bill has none, and without the `expiresAt` "hold expires" field:

```tsx
"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import type { BillingPaymentQueueRow } from "@/services/billing_payments/queries";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

const STATUS: Record<string, { labelKey: AdminMessageKey; className: string }> = {
  awaiting_receipt: { labelKey: "admin.deposits.statusAwaitingReceipt", className: "border-[var(--admin-border)] text-[var(--admin-muted)]" },
  in_review: { labelKey: "admin.deposits.statusInReview", className: "border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]" },
};

const money = (value: number | null) =>
  value === null ? "—" : `EGP ${new Intl.NumberFormat("en-EG", { maximumFractionDigits: 2 }).format(value)}`;

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(iso))
    : "—";

function Field({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-[var(--admin-muted)]">{label}</dt>
      <dd className={`truncate text-sm ${warn ? "text-[#B91C1C]" : ""}`}>{value}</dd>
    </div>
  );
}

export function BillingPaymentReceiptCard({
  row,
  children,
}: {
  row: BillingPaymentQueueRow;
  children?: ReactNode;
}) {
  const t = useTranslations();
  const statusEntry = STATUS[row.status];
  const status = {
    label: statusEntry ? t(statusEntry.labelKey) : row.status,
    className: statusEntry?.className ?? "border-[var(--admin-border)] text-[var(--admin-muted)]",
  };
  const read = row.receipt?.amountEgp ?? null;
  const short = read !== null && read < row.amountEgp;

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2">
        <span className="text-sm font-medium">{row.patientName || row.phone}</span>
        <span className="text-xs text-[var(--admin-muted)]">{row.description}</span>
        <span className={`ml-auto rounded-full border px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
      </header>

      <div className="flex flex-wrap gap-3 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-2.5">
        {row.receipt?.imageUrl ? (
          <a href={row.receipt.imageUrl} target="_blank" rel="noreferrer" className="shrink-0" title={t("admin.deposits.openReceipt")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a vendor-hosted receipt on an arbitrary host. */}
            <img
              src={row.receipt.imageUrl}
              alt={t("admin.deposits.receiptAlt")}
              className="h-40 w-32 rounded border border-[var(--admin-border,#e5e7eb)] object-cover"
            />
          </a>
        ) : (
          <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded border border-dashed border-[var(--admin-border,#e5e7eb)] text-xs text-[var(--admin-muted)]">
            {t("admin.deposits.noReceiptYet")}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2.5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            <Field label={t("admin.deposits.asked")} value={money(row.amountEgp)} />
            <Field label={t("admin.deposits.onReceipt")} value={money(read)} warn={short} />
            <Field label={t("admin.deposits.difference")} value={read === null ? "—" : money(read - row.amountEgp)} warn={short} />
            <Field label={t("admin.deposits.reference")} value={row.receipt?.reference ?? "—"} />
            <Field label={t("admin.deposits.paidTo")} value={row.receipt?.recipientHandle ?? row.receipt?.recipientName ?? "—"} />
            <Field label={t("admin.from")} value={row.receipt?.senderName ?? "—"} />
            <Field label={t("admin.deposits.transferred")} value={when(row.receipt?.transferredAt ?? null)} />
            <Field
              label={t("admin.deposits.confidence")}
              value={row.receipt?.confidence === null || row.receipt?.confidence === undefined ? "—" : `${Math.round(row.receipt.confidence * 100)}%`}
            />
            <Field label={t("admin.deposits.whyHere")} value={row.receipt?.verdictReason || row.decisionReason || "—"} />
          </dl>

          {row.receiptCount > 1 ? (
            <p className="text-xs text-[var(--admin-muted)]">
              {t("admin.deposits.receiptsSent").replace("{count}", String(row.receiptCount))}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </article>
  );
}
```

- [ ] **Step 2: Write `BillingPaymentReviewList.tsx`**

Modeled on `src/features/admin/components/DepositsQueue.tsx`, but server-fetched-and-refreshed (this page is a Server Component, unlike the deposits page) rather than client-polling `/api/v1/deposits`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BillingPaymentQueueRow } from "@/services/billing_payments/queries";
import { decideBillingPayment } from "@/services/billing_payments/actions";
import { BillingPaymentReceiptCard } from "./BillingPaymentReceiptCard";
import { useTranslations } from "@/lib/i18n";

type Props = {
  rows: BillingPaymentQueueRow[];
};

export function BillingPaymentReviewList({ rows }: Props) {
  const router = useRouter();
  const t = useTranslations();
  const [pending, setPending] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function decide(id: string, decision: "confirm" | "reject") {
    setPending(id);
    try {
      await decideBillingPayment(id, decision, reasons[id] ?? "");
      toast.success(decision === "confirm" ? t("admin.deposits.confirmed") : t("admin.deposits.rejected"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.deposits.applyFailed"));
    } finally {
      setPending(null);
    }
  }

  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <p className="text-sm font-medium text-[var(--admin-text)]">{t("admin.billing.awaitingPayment")}</p>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <BillingPaymentReceiptCard row={row}>
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-2">
                <Input
                  value={reasons[row.id] ?? ""}
                  placeholder={t("admin.deposits.reasonPlaceholder")}
                  className="h-8 min-w-0 flex-1"
                  onChange={(e) => setReasons((current) => ({ ...current, [row.id]: e.target.value }))}
                />
                <Button type="button" size="sm" disabled={pending === row.id} onClick={() => void decide(row.id, "confirm")}>
                  {t("admin.confirm")}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={pending === row.id} onClick={() => void decide(row.id, "reject")}>
                  {t("admin.deposits.reject")}
                </Button>
              </div>
            </BillingPaymentReceiptCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Write `PendingBillingRequestsList.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PendingProposalWithPatient } from "@/services/treatment_proposals/queries";
import { settleTreatmentProposal, decideTreatmentProposal } from "@/services/treatment_proposals/actions";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale, useTranslations } from "@/lib/i18n";

type PriceableDoctor = { id: string; display_name: string | null };

type Props = {
  proposals: PendingProposalWithPatient[];
  doctors: PriceableDoctor[];
};

export function PendingBillingRequestsList({ proposals, doctors }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useTranslations();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function settle(id: string, method: "cash" | "whatsapp_request") {
    setPendingId(id);
    try {
      const result = await settleTreatmentProposal(id, method);
      if (!result.ok) throw new Error(result.error);
      toast.success(method === "cash" ? t("admin.billing.cashCollected") : t("admin.billing.whatsappRequested"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.deposits.applyFailed"));
    } finally {
      setPendingId(null);
    }
  }

  async function decline(id: string) {
    setPendingId(id);
    try {
      await decideTreatmentProposal(id, "declined");
      toast.success(t("admin.billing.requestDeclined"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.deposits.applyFailed"));
    } finally {
      setPendingId(null);
    }
  }

  if (proposals.length === 0) return null;

  return (
    <Card className="max-w-3xl gap-3 bg-transparent p-6">
      <p className="text-sm font-medium text-[var(--admin-text)]">{t("admin.billing.pendingRequests")}</p>
      <ul className="space-y-3">
        {proposals.map((proposal) => (
          <li key={proposal.id} className="rounded-lg border border-[var(--admin-border)] p-3">
            <p className="text-sm font-medium text-[var(--admin-text)]">{proposal.displayName}</p>
            <p className="text-xs text-[var(--admin-muted)]">
              {doctors.find((d) => d.id === proposal.doctorId)?.display_name ?? "Doctor"} ·{" "}
              {new Date(proposal.createdAt).toLocaleDateString()}
            </p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {proposal.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.description}</span>
                  <span>{formatEgp(item.amountEgp, locale)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-sm font-semibold text-[var(--admin-text)]">
              {t("admin.billing.total")}: {formatEgp(proposal.total, locale)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={pendingId === proposal.id} onClick={() => void settle(proposal.id, "cash")}>
                {t("admin.billing.collectCash")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={pendingId === proposal.id} onClick={() => void settle(proposal.id, "whatsapp_request")}>
                {t("admin.billing.requestWhatsapp")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={pendingId === proposal.id} onClick={() => void decline(proposal.id)}>
                {t("admin.deposits.reject")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: fails until Task 13 adds the new i18n keys these three components reference (`admin.billing.awaitingPayment`, `admin.billing.pendingRequests`, `admin.billing.cashCollected`, `admin.billing.whatsappRequested`, `admin.billing.requestDeclined`, `admin.billing.total`, `admin.billing.collectCash`, `admin.billing.requestWhatsapp`) — expected at this point; Task 13 adds them. If this repo's `AdminMessageKey` type is a strict union derived from `en.ts`, this step will show real type errors until then; that's fine, continue to Task 13 before re-checking the build.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/billing/BillingPaymentReceiptCard.tsx src/features/admin/components/billing/BillingPaymentReviewList.tsx src/features/admin/components/billing/PendingBillingRequestsList.tsx
git commit -m "$(cat <<'EOF'
feat(billing): add clinic-wide billing request + payment review UI

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Wire into `/admin/billing` + i18n keys

**Files:**
- Modify: `src/app/(internal)/admin/(dashboard)/billing/page.tsx`
- Modify: `src/features/admin/components/billing/BillingBalancesView.tsx`
- Modify: `src/lib/i18n/messages/admin/en.ts`
- Modify: `src/lib/i18n/messages/admin/ar.ts`

**Interfaces:**
- Consumes: `listAllPendingProposals` (Task 10), `listPendingBillingPayments` (Task 8), `listDoctors` (`@/services/profiles`, already built), `PendingBillingRequestsList`/`BillingPaymentReviewList` (Task 12).

- [ ] **Step 1: Re-read both files fresh** (shown in full above from this session's research).

- [ ] **Step 2: Add the new i18n keys**

In `src/lib/i18n/messages/admin/en.ts`, right after the existing `"admin.billing.empty"` line:

```ts
  "admin.billing.pendingRequests": "Pending billing requests",
  "admin.billing.awaitingPayment": "Awaiting payment confirmation",
  "admin.billing.collectCash": "Collect cash",
  "admin.billing.requestWhatsapp": "Request via WhatsApp",
  "admin.billing.cashCollected": "Payment recorded",
  "admin.billing.whatsappRequested": "Payment request sent",
  "admin.billing.requestDeclined": "Request declined",
  "admin.billing.total": "Total",
```

And update the existing clinic description line to mention the new sections:

```ts
  "admin.billing.clinicDescription": "Pending billing requests, payments awaiting confirmation, and patients with an outstanding balance.",
```

In `src/lib/i18n/messages/admin/ar.ts`, right after the existing `"admin.billing.empty"` line (matching its Arabic style):

```ts
  "admin.billing.pendingRequests": "طلبات الفواتير المعلقة",
  "admin.billing.awaitingPayment": "بانتظار تأكيد الدفع",
  "admin.billing.collectCash": "استلام كاش",
  "admin.billing.requestWhatsapp": "طلب عبر واتساب",
  "admin.billing.cashCollected": "تم تسجيل الدفعة",
  "admin.billing.whatsappRequested": "تم إرسال طلب الدفع",
  "admin.billing.requestDeclined": "تم رفض الطلب",
  "admin.billing.total": "الإجمالي",
```

And update:

```ts
  "admin.billing.clinicDescription": "طلبات الفواتير المعلقة، والدفعات بانتظار التأكيد، والمرضى الذين عليهم رصيد مستحق.",
```

- [ ] **Step 3: Extend `page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { listPatientBalances } from "@/services/patient_billing/queries";
import { listAllPendingProposals } from "@/services/treatment_proposals/queries";
import { listPendingBillingPayments } from "@/services/billing_payments/queries";
import { listDoctors } from "@/services/profiles";
import { BillingBalancesView } from "@/features/admin/components/billing/BillingBalancesView";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requirePagePermission("patients.view");
  const supabase = await createClient();
  const [balances, proposals, paymentQueue, doctors] = await Promise.all([
    listPatientBalances(supabase),
    listAllPendingProposals(supabase),
    listPendingBillingPayments(supabase),
    listDoctors(supabase),
  ]);
  return (
    <BillingBalancesView
      balances={balances}
      proposals={proposals}
      paymentQueue={paymentQueue}
      doctors={doctors.map((d) => ({ id: d.id, display_name: d.display_name }))}
    />
  );
}
```

- [ ] **Step 4: Extend `BillingBalancesView.tsx`**

Add imports and render the two new sections above the existing balances `Card`:

```tsx
import type { PendingProposalWithPatient } from "@/services/treatment_proposals/queries";
import type { BillingPaymentQueueRow } from "@/services/billing_payments/queries";
import { PendingBillingRequestsList } from "./PendingBillingRequestsList";
import { BillingPaymentReviewList } from "./BillingPaymentReviewList";
```

Extend `Props`:

```tsx
type Props = {
  balances: PatientBalance[];
  proposals: PendingProposalWithPatient[];
  paymentQueue: BillingPaymentQueueRow[];
  doctors: { id: string; display_name: string | null }[];
};
```

Destructure the new props and render, right after `<LocalizedAdminPageHeader ... />` and before the existing `<Card className="bg-transparent p-0"> ... balances table ... </Card>`:

```tsx
      <PendingBillingRequestsList proposals={proposals} doctors={doctors} />
      <BillingPaymentReviewList rows={paymentQueue} />
```

- [ ] **Step 5: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline (Task 12's errors from missing i18n keys should now be gone).

- [ ] **Step 6: Commit**

```bash
git add src/app/\(internal\)/admin/\(dashboard\)/billing/page.tsx src/features/admin/components/billing/BillingBalancesView.tsx src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "$(cat <<'EOF'
feat(billing): show pending requests and payment review on /admin/billing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Strip the per-patient billing page to read-only

**Files:**
- Modify: `src/features/admin/components/patients/billing/PatientBillingView.tsx`
- Modify: `src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx`
- Delete: `src/features/admin/components/patients/billing/AddChargeForm.tsx`
- Delete: `src/features/admin/components/patients/billing/PendingProposalsList.tsx`

**Interfaces:**
- Consumes: nothing new. `ProposeServicesForm.tsx`/`ServiceSearchSelect.tsx` are kept (still used by `WorkspaceTreatmentsPane.tsx`) but no longer imported here.

- [ ] **Step 1: Re-read both files fresh** (shown in full above from this session's research — confirm nothing drifted).

- [ ] **Step 2: Rewrite `PatientBillingView.tsx`**

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import type { LedgerEntryWithBalance } from "@/services/patient_billing/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale } from "@/lib/i18n";

type Props = {
  displayName: string;
  entries: LedgerEntryWithBalance[];
  balance: number;
};

export function PatientBillingView({ displayName, entries, balance }: Props) {
  const { locale } = useLocale();

  return (
    <AdminPageMotion className="max-w-3xl space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.billing.patientTitle"
        descriptionKey="admin.billing.patientDescription"
      />

      <Card className="gap-2 bg-transparent p-6">
        <p className="text-sm text-[var(--admin-muted)]">{displayName}</p>
        <p className={`text-2xl font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
          {formatEgp(Math.abs(balance), locale)}
          {balance > 0 ? " owed" : balance < 0 ? " credit" : ""}
        </p>
      </Card>

      <Card className="gap-0 bg-transparent p-0">
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No billing activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--admin-text)]">{entry.description}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {new Date(entry.date).toLocaleDateString()} · {entry.source}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className={entry.kind === "charge" ? "text-red-600" : "text-emerald-600"}>
                    {entry.kind === "charge" ? "+" : "−"}
                    {formatEgp(entry.amount, locale)}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">Balance: {formatEgp(entry.balanceAfter, locale)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminPageMotion>
  );
}
```

- [ ] **Step 3: Rewrite `.../patients/[patientKey]/billing/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  decodePatientKey,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { resolvePatientDirectoryGroupFallback } from "@/services/patient_profiles/queries";
import { listPatientLedger } from "@/services/patient_billing/queries";
import { PatientBillingView } from "@/features/admin/components/patients/billing/PatientBillingView";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ patientKey: string }>;
};

export default async function AdminPatientBillingPage({ params }: Props) {
  await requirePagePermission("patients.view");
  const { patientKey: encoded } = await params;
  const patientKey = decodePatientKey(encoded);
  const supabase = await createClient();
  const reservations = await listReservationsServer(supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  const group =
    getPatientGroup(directory, patientKey) ??
    (await resolvePatientDirectoryGroupFallback(supabase, patientKey));
  if (!group) notFound();

  const { entries, balance } = await listPatientLedger(
    supabase,
    group.patientKey,
    group.visits.map((v) => v.id),
  );

  return <PatientBillingView displayName={group.displayName} entries={entries} balance={balance} />;
}
```

- [ ] **Step 4: Delete the two files**

```bash
git rm src/features/admin/components/patients/billing/AddChargeForm.tsx
git rm src/features/admin/components/patients/billing/PendingProposalsList.tsx
```

- [ ] **Step 5: Check for other importers before proceeding**

Run: `grep -rn "AddChargeForm\|PendingProposalsList" src/ --include="*.tsx" --include="*.ts"`
Expected: no remaining references. `PendingProposalsList` was previously also referenced from `WorkspaceTreatmentsPane.tsx`'s neighborhood per this session's research — re-confirm that file does NOT actually import it (the research found `WorkspaceTreatmentsPane.tsx` embeds `ProposeServicesForm` only, no `PendingProposalsList` or `AddChargeForm`). If grep finds a surviving reference anywhere, fix that call site before continuing rather than leaving a broken import.

- [ ] **Step 6: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline.

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/components/patients/billing/PatientBillingView.tsx "src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx"
git commit -m "$(cat <<'EOF'
refactor(billing): make the per-patient billing page read-only

Billing requests now come from the doctor's chairside workspace and are
settled clinic-wide on /admin/billing; this page is balance + history only.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `GITHUB_TOKEN=x yarn build`
Expected: `✓ Compiled successfully`, zero `error TS` lines beyond the pre-existing baseline noted in Task 3.

- [ ] **Step 2: Lint**

Run: `GITHUB_TOKEN=x yarn lint`
Expected: no new errors/warnings attributed to any file created or modified in this plan.

- [ ] **Step 3: Full test suite**

Run: `GITHUB_TOKEN=x yarn test`
Expected: all tests pass, including every test added in this plan.

- [ ] **Step 4: Manual smoke test**

Using the local Supabase stack (`GITHUB_TOKEN=x env $(cat .env.e2e | xargs) yarn dev`), with `deposit_settings` configured (InstaPay handle or wallet number set) via Settings:

1. As a doctor account, propose a service for a patient from the chairside workspace (unchanged flow) — confirm it appears.
2. As front desk/owner on `/admin/billing`, confirm the request appears under "Pending billing requests" with patient, doctor, services, total.
3. Click **Collect cash** → confirm it disappears, a `patient_treatments` row exists (`status: 'open'`), and a `patient_billing_entries` payment row (method `cash`) was created for the full amount; the patient's balance on `/admin/patients/[patientKey]/billing` reflects it.
4. Send a second proposal, click **Request via WhatsApp** with a WhatsApp conversation whose session is currently open (send yourself a test message from the patient number first) → confirm a real WhatsApp message arrives with the amount and payment details, and the request appears under "Awaiting payment confirmation" as `awaiting_receipt`.
5. From the patient's WhatsApp number, reply with a receipt screenshot matching the clinic's configured InstaPay/wallet and amount → confirm it lands as `confirm` (if `deposit_settings.auto_confirm` is on) or `review`. For a `review` row, click **Confirm** from `/admin/billing` → the ledger now has a `payment` row (method `whatsapp`), status `paid`, and (if the WhatsApp session is still open) the patient receives a "Payment received" message.
6. Reply with a screenshot for the wrong recipient or a short amount → confirm it lands in `review`/`reject` per the existing verifier rules, and a rejected one leaves no ledger entry.
7. Repeat step 4 with the conversation's session closed → confirm no free-text message sends, and a `patient_notifications` row with kind `billing_payment_request` is queued instead (check `/admin/outbox` or the table directly) — no error either way.
8. Send a third proposal and click **Decline** → confirm it disappears with no treatment/billing rows created.
9. Open that patient's `/admin/patients/[patientKey]/billing` page → confirm it shows only the balance and ledger, no propose/add-charge forms.
10. Clean up all test data created (proposals, billing_payment_requests/receipts, resulting treatment/ledger rows, test WhatsApp conversation) and stop the dev server.

- [ ] **Step 5: Report findings**

If any manual-smoke-test step fails, fix the specific task above it corresponds to and re-run Steps 1–3 before considering this plan complete.
