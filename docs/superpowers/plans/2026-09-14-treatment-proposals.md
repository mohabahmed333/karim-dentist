# Treatment Proposals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a doctor bundle one or more catalog services into a priced proposal for a patient, send it over WhatsApp, and let front desk accept (creating real billed treatments) or decline it — all from the Patient Billing page already built this session.

**Architecture:** Two new tables (`treatment_proposals`, `treatment_proposal_items`) hold a proposal until it's decided; nothing touches `patient_treatments` or the billing ledger until accepted, at which point each item becomes a real treatment row. Pricing reuses the existing `service_doctors`/`resolveServiceDoctorPrice` system; sending reuses the existing `patient_notifications` outbox, queued under a new kind that (like six other kinds already in this codebase) has no approved Meta template yet and is correctly a no-op until one exists.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), Supabase (Postgres + RLS), zod, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-14-treatment-proposals-design.md`

## Global Constraints

- No invoice/payment-request semantics — a proposal is a pre-treatment quote only (see spec Non-goals).
- No AI parsing of the patient's WhatsApp reply — accept/decline is always a human click in the admin panel.
- Every new migration follows the header-comment + `-- Rollback:` block convention, `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` / `DROP POLICY IF EXISTS` idempotent style (see `supabase/migrations/20260915060000_patient_billing_entries.sql`).
- `database.types.ts` must be **hand-patched**, never regenerated wholesale with `supabase gen types` — the installed Supabase CLI (v2.98.2) drops literal-union types for every check-constrained column across the whole file when regenerating, which broke ~150 unrelated type checks earlier this session.
- Do **not** touch `TemplateKind` / `PATIENT_TEMPLATES` / `buildTemplateForKind` (`src/services/patient_notifications/templates.ts`, `templateParams.ts`) — those only get a case once a template is Meta-approved, outside this session's control. The existing `default: return null` branch in `buildTemplateForKind` already handles "queued, no template yet" correctly.
- No new nav entries, no new routes — everything lives on the existing `/admin/patients/[patientKey]/billing` page.
- Re-read `src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx`, `src/features/admin/components/patients/billing/PatientBillingView.tsx`, and any migration/RBAC file fresh immediately before editing — this repo has had unrelated, concurrent work landing continuously all session (confirmed as recently as the last few minutes). Adapt to what's actually on disk rather than forcing this plan's exact diff if it's drifted; flag a real conflict rather than silently overwriting.
- Every `yarn` command needs `GITHUB_TOKEN=x` prefixed (documented repo convention).

---

### Task 1: Migration — `doctor_id`/`service_id` on treatments, `treatment_proposals`, `treatment_proposal_items`

**Files:**
- Create: `supabase/migrations/<fresh-timestamp>_treatment_proposals.sql` — run `ls supabase/migrations | tail -5` first and pick a timestamp after the newest one there; do not reuse any number written elsewhere in this plan, it will be stale.

**Interfaces:**
- Produces: `patient_treatments.doctor_id` (nullable, → `profiles`), `patient_treatments.service_id` (nullable, → `services`); tables `public.treatment_proposals` (`id`, `patient_key`, `doctor_id` NOT NULL, `status` ∈ `'sent'|'accepted'|'declined'`, `created_at`, `decided_at`, `decided_by`) and `public.treatment_proposal_items` (`id`, `proposal_id`, `service_id` NOT NULL, `description`, `amount_egp` > 0). No new permission rows — this feature reuses the existing `patients.treatments.edit` (create) and `patients.billing.edit` (accept/decline) permissions, both already granted to the right roles.

- [ ] **Step 1: Write the migration**

```sql
-- Doctor + service attribution on treatments, and a pre-treatment proposal
-- workflow (a doctor bundles services for a patient, sent over WhatsApp;
-- front desk accepts/declines) — see
-- docs/superpowers/specs/2026-09-14-treatment-proposals-design.md.
-- Rollback:
--   DROP TABLE IF EXISTS public.treatment_proposal_items;
--   DROP TABLE IF EXISTS public.treatment_proposals;
--   ALTER TABLE public.patient_treatments
--     DROP COLUMN IF EXISTS doctor_id,
--     DROP COLUMN IF EXISTS service_id;

ALTER TABLE public.patient_treatments
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.profiles (id),
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services (id);

CREATE INDEX IF NOT EXISTS patient_treatments_doctor_id_idx
  ON public.patient_treatments (doctor_id);

CREATE TABLE IF NOT EXISTS public.treatment_proposals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  doctor_id   uuid NOT NULL REFERENCES public.profiles (id),
  status      text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz,
  decided_by  uuid REFERENCES public.profiles (id)
);

CREATE INDEX IF NOT EXISTS treatment_proposals_patient_key_idx
  ON public.treatment_proposals (patient_key);

ALTER TABLE public.treatment_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treatment_proposals_admin_all ON public.treatment_proposals;
CREATE POLICY treatment_proposals_admin_all
  ON public.treatment_proposals
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.treatment_proposal_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.treatment_proposals (id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES public.services (id),
  description text NOT NULL CHECK (char_length(trim(description)) > 0),
  amount_egp  numeric NOT NULL CHECK (amount_egp > 0)
);

CREATE INDEX IF NOT EXISTS treatment_proposal_items_proposal_id_idx
  ON public.treatment_proposal_items (proposal_id);

ALTER TABLE public.treatment_proposal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS treatment_proposal_items_admin_all ON public.treatment_proposal_items;
CREATE POLICY treatment_proposal_items_admin_all
  ON public.treatment_proposal_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

- [ ] **Step 2: Push the migration**

Run: `supabase db push --linked`
Expected: prompts to apply your new file (and any other pending migrations already sitting in the folder from concurrent work — apply those too, they're already committed to the repo and not this plan's concern). Confirm with `Y`.

- [ ] **Step 3: Apply it locally too (used for manual smoke testing later)**

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
  const { error: e1 } = await sb.from("treatment_proposals").select("id").limit(1);
  console.log("treatment_proposals error (should be null):", e1?.message ?? null);
  const { error: e2 } = await sb.from("treatment_proposal_items").select("id").limit(1);
  console.log("treatment_proposal_items error (should be null):", e2?.message ?? null);
  const { error: e3 } = await sb.from("patient_treatments").select("doctor_id, service_id").limit(1);
  console.log("patient_treatments doctor_id/service_id error (should be null):", e3?.message ?? null);
})();
'
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/*_treatment_proposals.sql
git commit -m "$(cat <<'EOF'
feat(admin): add treatment_proposals schema + doctor/service on treatments

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Hand-patch `database.types.ts`

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces: `Tables<"treatment_proposals">`, `Tables<"treatment_proposal_items">`, and the two new `patient_treatments` columns — consumed by every later task.

- [ ] **Step 1: Widen `patient_treatments`**

Find the `patient_treatments` block (`grep -n '"      patient_treatments: {"' src/lib/supabase/database.types.ts` — re-check the line number fresh, don't trust any number from earlier in this plan). Add `doctor_id: string | null` and `service_id: string | null` to its `Row`, and `doctor_id?: string | null` / `service_id?: string | null` to its `Insert` and `Update` blocks, alongside the existing fields (`fee_amount`, `patient_key`, etc.) — alphabetical order within each block, matching the file's existing convention.

- [ ] **Step 2: Add the two new table blocks**

Insert alphabetically (`treatment_proposal_items` and `treatment_proposals` sort near the end of the file, likely after `treatment_notes`/similar or before `visit_ratings` — check what's actually adjacent with `grep -n '^      [a-z_]*: {' src/lib/supabase/database.types.ts | sort` and place both there):

```ts
      treatment_proposals: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          doctor_id: string
          id: string
          patient_key: string
          status: "sent" | "accepted" | "declined"
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          doctor_id: string
          id?: string
          patient_key: string
          status?: "sent" | "accepted" | "declined"
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          doctor_id?: string
          id?: string
          patient_key?: string
          status?: "sent" | "accepted" | "declined"
        }
        Relationships: [
          {
            foreignKeyName: "treatment_proposals_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_proposal_items: {
        Row: {
          amount_egp: number
          description: string
          id: string
          proposal_id: string
          service_id: string
        }
        Insert: {
          amount_egp: number
          description: string
          id?: string
          proposal_id: string
          service_id: string
        }
        Update: {
          amount_egp?: number
          description?: string
          id?: string
          proposal_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "treatment_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 3: Verify it compiles**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: same count as before this change (run it once before this step if you don't already know the baseline — this repo has occasional unrelated pre-existing errors from concurrent work; this step should not add any new ones).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
chore(types): add treatment_proposals tables + doctor/service columns

Hand-patched, not regenerated — see Global Constraints in
docs/superpowers/plans/2026-09-14-treatment-proposals.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `src/services/treatment_proposals/` — types and schema

**Files:**
- Create: `src/services/treatment_proposals/types.ts`
- Create: `src/services/treatment_proposals/schemas.ts`
- Test: `src/services/treatment_proposals/schemas.test.ts`

**Interfaces:**
- Produces: `ProposalStatus`, `ProposalItem`, `PendingProposal` types; `proposalItemSchema`, `createProposalSchema`, `CreateProposalValues` — consumed by Tasks 4–6.

- [ ] **Step 1: Write `types.ts`**

```ts
export type ProposalStatus = "sent" | "accepted" | "declined";

export type ProposalItem = {
  id: string;
  serviceId: string;
  description: string;
  amountEgp: number;
};

export type PendingProposal = {
  id: string;
  patientKey: string;
  doctorId: string;
  status: ProposalStatus;
  createdAt: string;
  items: ProposalItem[];
  total: number;
};
```

- [ ] **Step 2: Write the failing tests for the schema**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProposalSchema } from "./schemas";

describe("createProposalSchema", () => {
  it("accepts a doctor with one service", () => {
    const parsed = createProposalSchema.parse({
      doctorId: "11111111-1111-1111-1111-111111111111",
      items: [{ serviceId: "22222222-2222-2222-2222-222222222222", description: "Root canal", amountEgp: 1500 }],
    });
    assert.equal(parsed.items.length, 1);
  });

  it("accepts multiple services", () => {
    const parsed = createProposalSchema.parse({
      doctorId: "11111111-1111-1111-1111-111111111111",
      items: [
        { serviceId: "22222222-2222-2222-2222-222222222222", description: "Root canal", amountEgp: 1500 },
        { serviceId: "33333333-3333-3333-3333-333333333333", description: "Crown", amountEgp: 2000 },
      ],
    });
    assert.equal(parsed.items.length, 2);
  });

  it("rejects an empty items list", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "11111111-1111-1111-1111-111111111111",
        items: [],
      }),
    );
  });

  it("rejects a non-positive amount", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "11111111-1111-1111-1111-111111111111",
        items: [{ serviceId: "22222222-2222-2222-2222-222222222222", description: "Root canal", amountEgp: 0 }],
      }),
    );
  });

  it("rejects an empty description", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "11111111-1111-1111-1111-111111111111",
        items: [{ serviceId: "22222222-2222-2222-2222-222222222222", description: "  ", amountEgp: 500 }],
      }),
    );
  });

  it("rejects a non-uuid doctorId", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "not-a-uuid",
        items: [{ serviceId: "22222222-2222-2222-2222-222222222222", description: "Root canal", amountEgp: 500 }],
      }),
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/treatment_proposals/schemas.test.ts`
Expected: FAIL — `schemas.ts` doesn't exist yet.

- [ ] **Step 4: Write `schemas.ts`**

```ts
import { z } from "zod";

export const proposalItemSchema = z.object({
  serviceId: z.string().uuid(),
  description: z.string().trim().min(1).max(200),
  amountEgp: z.number().positive(),
});

export const createProposalSchema = z.object({
  doctorId: z.string().uuid(),
  items: z.array(proposalItemSchema).min(1, "Add at least one service"),
});

export type CreateProposalValues = z.infer<typeof createProposalSchema>;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/treatment_proposals/schemas.test.ts`
Expected: 6 passing.

- [ ] **Step 6: Commit**

```bash
git add src/services/treatment_proposals/types.ts src/services/treatment_proposals/schemas.ts src/services/treatment_proposals/schemas.test.ts
git commit -m "$(cat <<'EOF'
feat(admin): add treatment_proposals types + create schema

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `src/services/treatment_proposals/queries.ts`

**Files:**
- Create: `src/services/treatment_proposals/queries.ts`
- Test: `src/services/treatment_proposals/queries.test.ts`

**Interfaces:**
- Consumes: `ProposalItem`, `PendingProposal`, `ProposalStatus` (Task 3).
- Produces: `proposalTotal(items)` (pure, tested), `listPendingProposals(supabase, patientKey)`, `getProposalWithItems(supabase, proposalId)` — consumed by Task 5 (actions) and Task 8 (UI wiring).

- [ ] **Step 1: Write the failing test for the pure function**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { proposalTotal } from "./queries";

describe("proposalTotal", () => {
  it("sums every item's amount", () => {
    const total = proposalTotal([
      { id: "1", serviceId: "s1", description: "Root canal", amountEgp: 1500 },
      { id: "2", serviceId: "s2", description: "Crown", amountEgp: 2000 },
    ]);
    assert.equal(total, 3500);
  });

  it("returns zero for no items", () => {
    assert.equal(proposalTotal([]), 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/treatment_proposals/queries.test.ts`
Expected: FAIL — `queries.ts` doesn't exist yet.

- [ ] **Step 3: Write `queries.ts`**

```ts
import type { ProposalItem, ProposalStatus, PendingProposal } from "./types";

type ServerSupabase = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/** Pure — no I/O. */
export function proposalTotal(items: ProposalItem[]): number {
  return items.reduce((sum, item) => sum + item.amountEgp, 0);
}

function mapItems(
  rows: { id: string; service_id: string; description: string; amount_egp: number }[],
): ProposalItem[] {
  return rows.map((row) => ({
    id: row.id,
    serviceId: row.service_id,
    description: row.description,
    amountEgp: row.amount_egp,
  }));
}

/** Every proposal still awaiting a decision, for this patient, newest first. */
export async function listPendingProposals(
  supabase: ServerSupabase,
  patientKey: string,
): Promise<PendingProposal[]> {
  const { data: proposals, error: proposalsError } = await supabase
    .from("treatment_proposals")
    .select("id, patient_key, doctor_id, status, created_at")
    .eq("patient_key", patientKey)
    .eq("status", "sent")
    .order("created_at", { ascending: false });
  if (proposalsError) throw proposalsError;
  if (!proposals || proposals.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("treatment_proposal_items")
    .select("id, proposal_id, service_id, description, amount_egp")
    .in(
      "proposal_id",
      proposals.map((p) => p.id),
    );
  if (itemsError) throw itemsError;

  return proposals.map((proposal) => {
    const proposalItems = mapItems(
      (items ?? []).filter((item) => item.proposal_id === proposal.id),
    );
    return {
      id: proposal.id,
      patientKey: proposal.patient_key,
      doctorId: proposal.doctor_id,
      status: proposal.status as ProposalStatus,
      createdAt: proposal.created_at,
      items: proposalItems,
      total: proposalTotal(proposalItems),
    };
  });
}

/**
 * One proposal with its items, by id — the authoritative source for
 * accept/decline, so a decision is never driven by client-supplied item
 * data (see actions.ts).
 */
export async function getProposalWithItems(
  supabase: ServerSupabase,
  proposalId: string,
): Promise<PendingProposal | null> {
  const { data: proposal, error: proposalError } = await supabase
    .from("treatment_proposals")
    .select("id, patient_key, doctor_id, status, created_at")
    .eq("id", proposalId)
    .maybeSingle();
  if (proposalError) throw proposalError;
  if (!proposal) return null;

  const { data: items, error: itemsError } = await supabase
    .from("treatment_proposal_items")
    .select("id, proposal_id, service_id, description, amount_egp")
    .eq("proposal_id", proposalId);
  if (itemsError) throw itemsError;

  const proposalItems = mapItems(items ?? []);
  return {
    id: proposal.id,
    patientKey: proposal.patient_key,
    doctorId: proposal.doctor_id,
    status: proposal.status as ProposalStatus,
    createdAt: proposal.created_at,
    items: proposalItems,
    total: proposalTotal(proposalItems),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/treatment_proposals/queries.test.ts`
Expected: 2 passing.

- [ ] **Step 5: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over the Task 2 baseline.

- [ ] **Step 6: Commit**

```bash
git add src/services/treatment_proposals/queries.ts src/services/treatment_proposals/queries.test.ts
git commit -m "$(cat <<'EOF'
feat(admin): add treatment_proposals queries

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `src/services/treatment_proposals/` — mutations, WhatsApp enqueue, actions

**Files:**
- Create: `src/services/treatment_proposals/mutations.ts`
- Create: `src/services/treatment_proposals/notify.ts`
- Create: `src/services/treatment_proposals/actions.ts`

**Interfaces:**
- Consumes: `CreateProposalValues` (Task 3); `getProposalWithItems`, `proposalTotal` (Task 4); `requirePermission` (`@/lib/api/requirePermission`).
- Produces: `insertProposal`, `decideProposal`, `createTreatmentsFromProposal` (mutations.ts); `enqueueTreatmentProposalNotification` (notify.ts); `saveTreatmentProposal(patientKey, patientPhone, patientName, input)` and `decideTreatmentProposal(proposalId, decision)` (`"use server"` actions) — consumed by Task 8's UI.

- [ ] **Step 1: Write `mutations.ts`**

```ts
import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { CreateProposalValues } from "./schemas";
import type { ProposalItem } from "./types";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export async function insertProposal(
  supabase: ServerSupabase,
  patientKey: string,
  input: CreateProposalValues,
): Promise<{ id: string }> {
  const { data: proposal, error: proposalError } = await supabase
    .from("treatment_proposals")
    .insert({ patient_key: patientKey, doctor_id: input.doctorId })
    .select("id")
    .single();
  if (proposalError) throw proposalError;

  const { error: itemsError } = await supabase.from("treatment_proposal_items").insert(
    input.items.map((item) => ({
      proposal_id: proposal.id,
      service_id: item.serviceId,
      description: item.description,
      amount_egp: item.amountEgp,
    })),
  );
  if (itemsError) throw itemsError;

  return { id: proposal.id };
}

export async function decideProposal(
  supabase: ServerSupabase,
  proposalId: string,
  decision: "accepted" | "declined",
  decidedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from("treatment_proposals")
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: decidedBy,
    })
    .eq("id", proposalId);
  if (error) throw error;
}

/**
 * Turns each accepted item into a real, billable treatment. `tooth_name` is
 * required by patient_treatments and there's no tooth-level detail at
 * proposal time, so it's set to the service description — the doctor can
 * refine it later during actual charting.
 */
export async function createTreatmentsFromProposal(
  supabase: ServerSupabase,
  patientKey: string,
  doctorId: string,
  items: ProposalItem[],
): Promise<void> {
  const { error } = await supabase.from("patient_treatments").insert(
    items.map((item) => ({
      patient_key: patientKey,
      tooth_name: item.description,
      doctor_id: doctorId,
      service_id: item.serviceId,
      fee_amount: item.amountEgp,
      status: "open" as const,
    })),
  );
  if (error) throw error;
}
```

- [ ] **Step 2: Write `notify.ts`**

```ts
import type { createClient as createServerClient } from "@/lib/supabase/server";
import { formatEgp } from "@/services/deposits/receiptMessages";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Queues the WhatsApp notification through the same outbox every other
 * patient message goes through. "treatment_proposal" has no Meta-approved
 * template yet (see Global Constraints) — buildTemplateForKind's existing
 * default branch already skips a kind with no template cleanly, so this
 * queues correctly today and starts actually sending the moment a template
 * is approved and wired in, with no code change needed here.
 *
 * Takes only the two fields it actually renders, not a full ProposalItem —
 * the caller has draft items with no id yet at create time.
 */
export async function enqueueTreatmentProposalNotification(
  supabase: ServerSupabase,
  input: {
    proposalId: string;
    patientPhone: string;
    patientName: string;
    doctorName: string;
    items: { description: string; amountEgp: number }[];
  },
): Promise<void> {
  const serviceList = input.items
    .map((item) => `${item.description} (${formatEgp(item.amountEgp, "en")})`)
    .join(", ");
  const total = input.items.reduce((sum, item) => sum + item.amountEgp, 0);
  const summary = `${serviceList} — ${input.doctorName} — Total ${formatEgp(total, "en")}`;

  const { error } = await supabase.from("patient_notifications").upsert(
    {
      kind: "treatment_proposal",
      dedupe_key: `${input.proposalId}:treatment_proposal`,
      reservation_id: null,
      phone: input.patientPhone,
      patient_name: input.patientName,
      service_label: summary,
      starts_at: null,
      source: "manual",
      scheduled_for: new Date().toISOString(),
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (error) throw error;
}
```

- [ ] **Step 3: Write `actions.ts`**

```ts
"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { createProposalSchema } from "./schemas";
import { insertProposal, decideProposal, createTreatmentsFromProposal } from "./mutations";
import { enqueueTreatmentProposalNotification } from "./notify";
import { getProposalWithItems } from "./queries";

export async function saveTreatmentProposal(
  patientKey: string,
  patientPhone: string,
  patientName: string,
  input: unknown,
): Promise<{ id: string }> {
  const auth = await requirePermission("patients.treatments.edit");
  if (auth.error) throw new Error("Forbidden");

  const parsed = createProposalSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { id } = await insertProposal(auth.supabase, patientKey, parsed.data);

  const { data: doctor } = await auth.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", parsed.data.doctorId)
    .maybeSingle();

  await enqueueTreatmentProposalNotification(auth.supabase, {
    proposalId: id,
    patientPhone,
    patientName,
    doctorName: doctor?.display_name ?? "Your doctor",
    items: parsed.data.items,
  });

  return { id };
}

/**
 * Re-reads the proposal and its items from the database rather than trusting
 * anything the client sends beyond the id + decision — the amounts that
 * become real charges must come from what was actually proposed, not from
 * whatever a client happens to still have in memory.
 */
export async function decideTreatmentProposal(
  proposalId: string,
  decision: "accepted" | "declined",
): Promise<void> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const proposal = await getProposalWithItems(auth.supabase, proposalId);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "sent") throw new Error("Proposal already decided");

  await decideProposal(auth.supabase, proposalId, decision, auth.session.user.id);

  if (decision === "accepted") {
    await createTreatmentsFromProposal(
      auth.supabase,
      proposal.patientKey,
      proposal.doctorId,
      proposal.items,
    );
  }
}
```

- [ ] **Step 4: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline.

- [ ] **Step 5: Commit**

```bash
git add src/services/treatment_proposals/mutations.ts src/services/treatment_proposals/notify.ts src/services/treatment_proposals/actions.ts
git commit -m "$(cat <<'EOF'
feat(admin): add treatment proposal create/accept/decline actions

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Document the WhatsApp template to submit

**Files:**
- Modify: `src/services/patient_notifications/templateProposals.ts`

**Interfaces:**
- Consumes: nothing new. Produces: an entry in `TEMPLATE_PROPOSALS` for `kind: "treatment_proposal"`, so "what do I submit to Meta for this" lives in the same place as the other six pending templates.

- [ ] **Step 1: Add the new entry**

In `src/services/patient_notifications/templateProposals.ts`, add to the `TEMPLATE_PROPOSALS` array (after the `review_request` entry):

```ts
  {
    kind: "treatment_proposal",
    title: "Treatment proposals",
    names: { en: "treatment_proposal_en", ar: "treatment_proposal_ar" },
    category: "UTILITY",
    params: ["patient name", "proposed services and total"],
    bodyEn: "Hi {{1}}, your doctor has proposed: {{2}}. Reply here if you'd like to go ahead.",
    bodyAr: "أهلاً {{1}}، دكتورك اقترح: {{2}}. ابعتلنا هنا لو موافق.",
  },
```

- [ ] **Step 2: Regenerate the runbook doc that mirrors this array**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs scripts/write-template-proposals.mjs`
Expected: `docs/PATIENT_NOTIFICATIONS.md` updates between its generated markers to include the new "Treatment proposals" entry.

- [ ] **Step 3: Verify the drift test passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_notifications/templateProposals.test.ts`
Expected: all passing (this test fails if `templateProposalsMarkdown()`'s output no longer matches what's embedded in `docs/PATIENT_NOTIFICATIONS.md` — Step 2 must run first).

- [ ] **Step 4: Commit**

```bash
git add src/services/patient_notifications/templateProposals.ts docs/PATIENT_NOTIFICATIONS.md
git commit -m "$(cat <<'EOF'
docs(whatsapp): add treatment_proposal to the templates-to-submit list

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: "Propose services" and "Pending proposals" UI components

**Files:**
- Create: `src/features/admin/components/patients/billing/ProposeServicesForm.tsx`
- Create: `src/features/admin/components/patients/billing/PendingProposalsList.tsx`

**Interfaces:**
- Consumes: `saveTreatmentProposal`, `decideTreatmentProposal` (Task 5); `PendingProposal` (Task 3); `resolveServiceDoctorPrice`, `extractSingleAmount` (`@/services/service_doctors/pricing`, already built); `ServiceDoctorMapping` (`@/services/service_doctors/queries`, already built); `formatEgp` (`@/services/deposits/receiptMessages`).
- Produces: `ProposeServicesForm` and `PendingProposalsList` components — consumed by Task 8's wiring into `PatientBillingView.tsx`.

- [ ] **Step 1: Write `ProposeServicesForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AdminInput,
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import { saveTreatmentProposal } from "@/services/treatment_proposals/actions";
import { resolveServiceDoctorPrice, extractSingleAmount } from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";

type PriceableService = { id: string; title: string; price_label: string | null };
type PriceableDoctor = { id: string; display_name: string | null };

type DraftItem = { serviceId: string; description: string; amount: string };

function emptyItem(): DraftItem {
  return { serviceId: "", description: "", amount: "" };
}

type Props = {
  patientKey: string;
  patientPhone: string;
  patientName: string;
  services: PriceableService[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  onSent: () => void;
};

export function ProposeServicesForm({
  patientKey,
  patientPhone,
  patientName,
  services,
  doctors,
  serviceDoctorMappings,
  onSent,
}: Props) {
  const [doctorId, setDoctorId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [pending, setPending] = useState(false);

  function patchItem(index: number, partial: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...partial } : item)));
  }

  function pickService(index: number, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    const price = doctorId
      ? resolveServiceDoctorPrice(serviceId, doctorId, serviceDoctorMappings, service?.price_label ?? null)
      : (service?.price_label ?? null);
    patchItem(index, {
      serviceId,
      description: service?.title ?? "",
      amount: extractSingleAmount(price) ?? "",
    });
  }

  async function onSubmit() {
    if (!doctorId) {
      toast.error("Pick a doctor");
      return;
    }
    const parsedItems = items
      .filter((item) => item.serviceId)
      .map((item) => ({
        serviceId: item.serviceId,
        description: item.description.trim(),
        amountEgp: Number(item.amount),
      }));
    if (parsedItems.length === 0) {
      toast.error("Add at least one service");
      return;
    }
    if (parsedItems.some((item) => !Number.isFinite(item.amountEgp) || item.amountEgp <= 0)) {
      toast.error("Enter a valid amount for every service");
      return;
    }
    setPending(true);
    try {
      await saveTreatmentProposal(patientKey, patientPhone, patientName, {
        doctorId,
        items: parsedItems,
      });
      setDoctorId("");
      setItems([emptyItem()]);
      toast.success("Proposal sent");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-3xl gap-3 bg-transparent p-6">
      <p className="text-sm font-medium text-[var(--admin-text)]">Propose services</p>
      <AdminSelect value={doctorId} onValueChange={(value) => setDoctorId(String(value))}>
        <AdminSelectTrigger>
          <AdminSelectValue placeholder="Doctor" />
        </AdminSelectTrigger>
        <AdminSelectContent>
          {doctors.map((doctor) => (
            <AdminSelectItem key={doctor.id} value={doctor.id}>
              {doctor.display_name ?? "Unnamed"}
            </AdminSelectItem>
          ))}
        </AdminSelectContent>
      </AdminSelect>

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <AdminSelect value={item.serviceId} onValueChange={(value) => pickService(index, String(value))}>
            <AdminSelectTrigger>
              <AdminSelectValue placeholder="Service" />
            </AdminSelectTrigger>
            <AdminSelectContent>
              {services.map((service) => (
                <AdminSelectItem key={service.id} value={service.id}>
                  {service.title}
                </AdminSelectItem>
              ))}
            </AdminSelectContent>
          </AdminSelect>
          <AdminInput
            placeholder="Amount (EGP)"
            inputMode="decimal"
            value={item.amount}
            onChange={(e) => patchItem(index, { amount: e.target.value })}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={items.length === 1}
            onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
        Add service
      </Button>
      <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
        {pending ? "Sending…" : "Send proposal"}
      </Button>
    </Card>
  );
}
```

- [ ] **Step 2: Write `PendingProposalsList.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { decideTreatmentProposal } from "@/services/treatment_proposals/actions";
import type { PendingProposal } from "@/services/treatment_proposals/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale } from "@/lib/i18n";

type PriceableDoctor = { id: string; display_name: string | null };

type Props = {
  proposals: PendingProposal[];
  doctors: PriceableDoctor[];
  onDecided: () => void;
};

export function PendingProposalsList({ proposals, doctors, onDecided }: Props) {
  const { locale } = useLocale();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function decide(id: string, decision: "accepted" | "declined") {
    setPendingId(id);
    try {
      await decideTreatmentProposal(id, decision);
      toast.success(decision === "accepted" ? "Proposal accepted" : "Proposal declined");
      onDecided();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPendingId(null);
    }
  }

  if (proposals.length === 0) return null;

  return (
    <Card className="max-w-3xl gap-3 bg-transparent p-6">
      <p className="text-sm font-medium text-[var(--admin-text)]">Pending proposals</p>
      <ul className="space-y-3">
        {proposals.map((proposal) => (
          <li key={proposal.id} className="rounded-lg border border-[var(--admin-border)] p-3">
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
              Total: {formatEgp(proposal.total, locale)}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pendingId === proposal.id}
                onClick={() => void decide(proposal.id, "accepted")}
              >
                Accept
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pendingId === proposal.id}
                onClick={() => void decide(proposal.id, "declined")}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/patients/billing/ProposeServicesForm.tsx src/features/admin/components/patients/billing/PendingProposalsList.tsx
git commit -m "$(cat <<'EOF'
feat(admin): add propose/accept/decline UI components for treatment proposals

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Wire it into the Patient Billing page

**Files:**
- Modify: `src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx`
- Modify: `src/features/admin/components/patients/billing/PatientBillingView.tsx`

**Interfaces:**
- Consumes: `listPendingProposals` (Task 4); `ProposeServicesForm`, `PendingProposalsList` (Task 7).

- [ ] **Step 1: Re-read both files fresh**

```bash
cat "src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx"
cat src/features/admin/components/patients/billing/PatientBillingView.tsx
```

This repo has had continuous unrelated concurrent edits to both files all session (most recently: a `service_doctors` price-lookup integration into the "Record entry" form). Confirm what's actually there before editing — if it no longer matches the shape described below, adapt these diffs to the real current content rather than forcing them, and flag anything that looks like a genuine conflict (e.g. if `group.phone` is no longer available, or the `services`/`doctors`/`serviceDoctorMappings` props have been renamed) rather than silently overwriting it.

- [ ] **Step 2: Add proposal data-fetching to `page.tsx`**

Add to the imports:

```ts
import { listPendingProposals } from "@/services/treatment_proposals/queries";
```

Add `listPendingProposals(supabase, group.patientKey)` to the existing `Promise.all(...)` alongside the ledger/doctors/services/mappings fetches, and pass the result plus `group.phone`, `group.displayName`, and a new `canPropose` flag down:

```tsx
const [{ entries, balance }, doctors, serviceDoctorMappings, servicesRes, pendingProposals] =
  await Promise.all([
    listPatientLedger(supabase, group.patientKey, group.visits.map((v) => v.id)),
    listDoctors(supabase),
    listAllServiceDoctorMappings(supabase),
    supabase
      .from("services")
      .select("id, title, price_label")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    listPendingProposals(supabase, group.patientKey),
  ]);

return (
  <PatientBillingView
    patientKey={group.patientKey}
    patientPhone={group.phone}
    displayName={group.displayName}
    entries={entries}
    balance={balance}
    canEdit={session.permissions.has("patients.billing.edit")}
    canPropose={session.permissions.has("patients.treatments.edit")}
    services={servicesRes.data ?? []}
    doctors={doctors.map((d) => ({ id: d.id, display_name: d.display_name }))}
    serviceDoctorMappings={serviceDoctorMappings}
    pendingProposals={pendingProposals}
  />
);
```

(Keep every existing field exactly as it already is — this only adds `patientPhone`, `canPropose`, and `pendingProposals`.)

- [ ] **Step 3: Extend `PatientBillingView.tsx`'s props and render the two new sections**

Add to its imports:

```tsx
import { useRouter } from "next/navigation";
import { ProposeServicesForm } from "./ProposeServicesForm";
import { PendingProposalsList } from "./PendingProposalsList";
import type { PendingProposal } from "@/services/treatment_proposals/types";
```

Extend the `Props` type with `patientPhone: string`, `canPropose: boolean`, `pendingProposals: PendingProposal[]`, destructure them in the function signature, and add inside the component body:

```tsx
const router = useRouter();
```

Then, right after the balance `Card` and before the existing "Record entry" `Card`, render:

```tsx
<PendingProposalsList
  proposals={pendingProposals}
  doctors={doctors}
  onDecided={() => router.refresh()}
/>

{canPropose ? (
  <ProposeServicesForm
    patientKey={patientKey}
    patientPhone={patientPhone}
    patientName={displayName}
    services={services}
    doctors={doctors}
    serviceDoctorMappings={serviceDoctorMappings}
    onSent={() => router.refresh()}
  />
) : null}
```

Everything else in the file (the existing "Record entry" form, the ledger list) stays exactly as-is.

- [ ] **Step 4: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: no increase over baseline. If `group.phone` isn't a field on the `PatientGroup` type where you expected it, check `src/services/reservations/patientHistory.ts::PatientGroup` — it's already confirmed to have a `phone: string` field, so a mismatch here means the earlier re-read in Step 1 found something different and this step needs adapting to that, not forcing this diff.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx" src/features/admin/components/patients/billing/PatientBillingView.tsx
git commit -m "$(cat <<'EOF'
feat(admin): wire treatment proposals into the Patient Billing page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `GITHUB_TOKEN=x yarn build`
Expected: `✓ Compiled successfully`, zero `error TS` lines beyond whatever unrelated baseline existed before this plan started (confirm by comparing to the count noted in Task 2 Step 3).

- [ ] **Step 2: Lint**

Run: `GITHUB_TOKEN=x yarn lint`
Expected: no new errors/warnings attributed to any file created or modified in this plan.

- [ ] **Step 3: Full test suite**

Run: `GITHUB_TOKEN=x yarn test`
Expected: all tests pass, including this plan's 8 new tests (6 schema + 2 query).

- [ ] **Step 4: Manual smoke test**

Using the local Supabase stack (`GITHUB_TOKEN=x env $(cat .env.e2e | xargs) yarn dev`):
1. As an Owner/Front Desk account: open a patient's Billing page, confirm "Propose services" is visible, pick a doctor and a service (price auto-fills), add a second service line, "Send proposal" — confirm it appears under "Pending proposals" with both items and the correct total.
2. Click Accept on it — confirm it disappears from "Pending proposals", and that the ledger above now shows both services as new charges (each `patient_treatments` row created with `status: 'open'`, `doctor_id`/`service_id` set — check via the Supabase Studio table view or a quick service-role query, since `status: 'open'` treatments don't show as ledger charges until marked `done`, so confirm the rows exist with the right doctor/service/fee rather than expecting them in the balance yet).
3. Send a second proposal and click Decline — confirm it disappears and no `patient_treatments` rows were created for it.
4. As a Doctor account (has `patients.treatments.edit` but not `patients.billing.edit`): confirm "Propose services" is visible and usable, but "Pending proposals" has no Accept/Decline actions usable by them if any are pending (or, simpler: confirm the doctor can create a proposal but that `decideTreatmentProposal` — tested directly, or via the UI if `PendingProposalsList` is unconditionally rendered — is rejected with "Forbidden" for this account, matching the `patients.billing.edit` gate).
5. Check `/admin/outbox` — confirm a `treatment_proposal` notification row exists for the sent proposal, with a status indicating it's queued but not sent (no approved template) rather than erroring.
6. Clean up all test data created (proposals, proposal items, any resulting patient_treatments rows, test reservations/accounts) and stop the dev server, matching how both prior features this session were smoke-tested.

- [ ] **Step 5: Report findings**

If any manual-smoke-test step fails, fix the specific task above it corresponds to and re-run Steps 1–4 before considering this plan complete.
