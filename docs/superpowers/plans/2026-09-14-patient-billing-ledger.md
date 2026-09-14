# Patient Billing / Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every patient a running balance — charges from completed treatments, credits from paid deposits, and manually-entered charges/payments — visible on a per-patient ledger page and a clinic-wide "who owes money" list, both reachable from the sidebar.

**Architecture:** One new table (`patient_billing_entries`) holds only manually-entered charges/payments. Treatment charges and deposit credits are computed at read time from the existing `patient_treatments` and `deposit_requests` tables (no duplication), merged in application code — the same pattern already used for `buildReservationStats`/`buildDashboardKpis`/`listDoctorProductionThisWeek` in this codebase.

**Tech Stack:** Next.js App Router (Server Components + Server Actions), Supabase (Postgres + RLS), zod, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-14-patient-billing-ledger-design.md`

## Global Constraints

- Currency is always EGP, formatted with the existing `formatEgp(amount, language)` helper from `src/services/deposits/receiptMessages.ts` — do not introduce a second currency formatter.
- No invoice documents, no refund/discount entry type, no payment gateway — out of scope per the spec's Non-goals.
- `patient_billing_entries` rows are append-only (no edit/delete mutation) — correcting a mistake means adding another entry, not editing history.
- Every new migration follows the header-comment + `-- Rollback:` block convention (see `supabase/migrations/20260914010000_doctor_profile_fields.sql`), and every table uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS` for idempotent re-runs (see `supabase/migrations/20260904140000_patient_treatments.sql`).
- `database.types.ts` must be **hand-patched**, never regenerated wholesale with `supabase gen types` — the installed Supabase CLI (v2.98.2) drops literal-union types for every check-constrained column across the whole file when regenerating, which broke ~150 unrelated type checks the last time this was tried in this repo. Hand-patch only the new/changed blocks.
- Before touching `src/features/admin/lib/adminNav.ts`, `src/lib/supabase/database.types.ts`, or any `supabase/migrations/*.sql`/RBAC file, re-read the current file first — other work has been landing in this repo concurrently during this session (confirmed: a doctor-booking feature with its own migrations/nav-adjacent changes was mid-flight, uncommitted, elsewhere in the tree). Build on whatever is actually on disk, don't assume it matches what's described here if it's drifted.

---

### Task 1: Migration — `patient_billing_entries` table + `patients.billing.edit` permission

**Files:**
- Create: `supabase/migrations/20260915060000_patient_billing_entries.sql` (renamed from `...050000` during execution — a different migration landed at that exact timestamp from concurrent work in this same repo)

**Interfaces:**
- Produces: table `public.patient_billing_entries` (`id`, `patient_key`, `kind` ∈ `'charge'|'payment'`, `amount_egp` > 0, `description`, `method` nullable, `created_by`, `created_at`); permission key `patients.billing.edit`, granted to `owner` and `front-desk` roles.

- [ ] **Step 1: Write the migration**

```sql
-- Patient billing ledger: manual charges/payments only. Treatment charges
-- and deposit payments are computed live from patient_treatments/
-- deposit_requests, not duplicated here — see
-- docs/superpowers/specs/2026-09-14-patient-billing-ledger-design.md.
-- Rollback:
--   UPDATE public.roles SET description = 'Reservations, waitlist, patients (read), and support.' WHERE key = 'front-desk';
--   DELETE FROM public.role_permissions WHERE permission_id IN (SELECT id FROM public.permissions WHERE key = 'patients.billing.edit');
--   DELETE FROM public.permissions WHERE key = 'patients.billing.edit';
--   DROP POLICY IF EXISTS patient_billing_entries_admin_all ON public.patient_billing_entries;
--   DROP TABLE IF EXISTS public.patient_billing_entries;

CREATE TABLE IF NOT EXISTS public.patient_billing_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('charge', 'payment')),
  amount_egp  numeric NOT NULL CHECK (amount_egp > 0),
  description text NOT NULL CHECK (char_length(trim(description)) > 0),
  method      text,
  created_by  uuid REFERENCES public.profiles (id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_billing_entries_patient_key_idx
  ON public.patient_billing_entries (patient_key);

ALTER TABLE public.patient_billing_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patient_billing_entries_admin_all ON public.patient_billing_entries;
CREATE POLICY patient_billing_entries_admin_all
  ON public.patient_billing_entries
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.permissions (key, category, label, sort_order)
VALUES ('patients.billing.edit', 'patients', 'Record a patient payment or charge', 46)
ON CONFLICT (key) DO NOTHING;

-- owner's blanket grant was a one-time CROSS JOIN in
-- 20260913150000_seed_rbac_catalog.sql that already ran — a permission
-- added afterward needs its own explicit grant, same as
-- 20260913320000_multi_doctor_scheduling.sql did for the doctor role.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key = 'patients.billing.edit'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'front-desk'
  AND p.key = 'patients.billing.edit'
ON CONFLICT DO NOTHING;

UPDATE public.roles
SET description = 'Reservations, waitlist, patients (read + billing), and support.'
WHERE key = 'front-desk';
```

- [ ] **Step 2: Push the migration**

Run: `supabase db push --linked`
Expected: prompts to apply `20260915050000_patient_billing_entries.sql` (and lists any other pending migrations already sitting in the folder — apply those too, they're unrelated pre-existing work already committed to the repo, not something to skip). Confirm with `Y`.

- [ ] **Step 3: Verify the table and permission exist**

```bash
node -e '
const { createClient } = require("@supabase/supabase-js");
const sb = createClient("http://127.0.0.1:54321", process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || require("fs").readFileSync(".env.e2e","utf8").match(/E2E_SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1]);
(async () => {
  const { data: perm } = await sb.from("permissions").select("key").eq("key", "patients.billing.edit").maybeSingle();
  console.log("permission row:", perm);
  const { error } = await sb.from("patient_billing_entries").select("id").limit(1);
  console.log("table query error (should be null):", error);
})();
'
```
Expected: `permission row: { key: "patients.billing.edit" }`, `table query error (should be null): null`. (If the local Supabase stack from earlier in this session isn't running, start it with `supabase status` / `supabase start` first, and re-run this against `--linked` too since the migration also went to the linked project in Step 2.)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260915050000_patient_billing_entries.sql
git commit -m "$(cat <<'EOF'
feat(admin): add patient_billing_entries table + patients.billing.edit permission

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Hand-patch `database.types.ts`

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Tables<"patient_billing_entries">` usable by later tasks' service module.

- [ ] **Step 1: Find the insertion point**

Run: `grep -n "patient_treatments: {\|patient_tooth_notes: {" src/lib/supabase/database.types.ts`

The tables in this file are ordered alphabetically. Insert the new `patient_billing_entries` block immediately before `patient_imaging` (or whichever `patient_*` table currently sorts right after `patient_billing_entries` alphabetically — re-check on the live file, don't assume the doctor-feature session's ordering still holds if something else has inserted new `patient_*` tables since).

- [ ] **Step 2: Add the table block**

Insert (matching the existing `Row`/`Insert`/`Update`/`Relationships` shape every other table in this file uses):

```ts
      patient_billing_entries: {
        Row: {
          amount_egp: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          kind: "charge" | "payment"
          method: string | null
          patient_key: string
        }
        Insert: {
          amount_egp: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          kind: "charge" | "payment"
          method?: string | null
          patient_key: string
        }
        Update: {
          amount_egp?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          kind?: "charge" | "payment"
          method?: string | null
          patient_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_billing_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 3: Verify it compiles**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: `0` (this task alone shouldn't change the count from whatever the baseline is — run it once before this step if unsure of the baseline).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
chore(types): add patient_billing_entries to database.types.ts

Hand-patched, not regenerated — see the Global Constraints note in
docs/superpowers/plans/2026-09-14-patient-billing-ledger.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `src/services/patient_billing/` — types and schema

**Files:**
- Create: `src/services/patient_billing/types.ts`
- Create: `src/services/patient_billing/schemas.ts`
- Test: `src/services/patient_billing/schemas.test.ts`

**Interfaces:**
- Produces: `LedgerEntry`, `LedgerEntryWithBalance`, `PatientBalance` types; `billingEntryUpsertSchema`, `BillingEntryUpsertValues`. These are consumed by Task 4 (queries), Task 5 (mutations/actions), and Task 6/8 (UI).

- [ ] **Step 1: Write `types.ts`**

```ts
export type LedgerSource = "treatment" | "deposit" | "manual";

export type LedgerEntry = {
  id: string;
  date: string;
  kind: "charge" | "payment";
  source: LedgerSource;
  amount: number;
  description: string;
  method: string | null;
};

export type LedgerEntryWithBalance = LedgerEntry & { balanceAfter: number };

export type PatientBalance = {
  patientKey: string;
  displayName: string;
  phone: string;
  balance: number;
};
```

- [ ] **Step 2: Write the failing test for the schema**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { billingEntryUpsertSchema } from "./schemas";

describe("billingEntryUpsertSchema", () => {
  it("accepts a manual charge with no method", () => {
    const parsed = billingEntryUpsertSchema.parse({
      kind: "charge",
      amount_egp: 500,
      description: "Consultation fee",
      method: null,
    });
    assert.equal(parsed.amount_egp, 500);
    assert.equal(parsed.method, null);
  });

  it("accepts a payment with a method", () => {
    const parsed = billingEntryUpsertSchema.parse({
      kind: "payment",
      amount_egp: 1200,
      description: "Paid at desk",
      method: "cash",
    });
    assert.equal(parsed.method, "cash");
  });

  it("rejects a payment with no method", () => {
    assert.throws(() =>
      billingEntryUpsertSchema.parse({
        kind: "payment",
        amount_egp: 1200,
        description: "Paid at desk",
        method: null,
      }),
    );
  });

  it("rejects a non-positive amount", () => {
    assert.throws(() =>
      billingEntryUpsertSchema.parse({
        kind: "charge",
        amount_egp: 0,
        description: "Free consult",
        method: null,
      }),
    );
  });

  it("rejects an empty description", () => {
    assert.throws(() =>
      billingEntryUpsertSchema.parse({
        kind: "charge",
        amount_egp: 100,
        description: "  ",
        method: null,
      }),
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_billing/schemas.test.ts`
Expected: FAIL — `schemas.ts` doesn't exist yet.

- [ ] **Step 4: Write `schemas.ts`**

```ts
import { z } from "zod";

export const billingEntryUpsertSchema = z
  .object({
    kind: z.enum(["charge", "payment"]),
    amount_egp: z.number().positive(),
    description: z.string().trim().min(1).max(200),
    method: z.enum(["cash", "card", "instapay", "other"]).nullable().default(null),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "payment" && !data.method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a payment method",
        path: ["method"],
      });
    }
  });

export type BillingEntryUpsertValues = z.infer<typeof billingEntryUpsertSchema>;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_billing/schemas.test.ts`
Expected: 5 passing.

- [ ] **Step 6: Commit**

```bash
git add src/services/patient_billing/types.ts src/services/patient_billing/schemas.ts src/services/patient_billing/schemas.test.ts
git commit -m "$(cat <<'EOF'
feat(admin): add patient_billing types + entry schema

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `src/services/patient_billing/queries.ts` — ledger merge + balances aggregation

**Files:**
- Create: `src/services/patient_billing/queries.ts`
- Test: `src/services/patient_billing/queries.test.ts`

**Interfaces:**
- Consumes: `LedgerEntry`, `LedgerEntryWithBalance`, `PatientBalance` (Task 3); `patientKeyFromReservation`, `groupReservationsByPatient`, `PatientGroup` from `@/services/reservations/patientHistory`; `listReservationsServer` from `@/services/reservations/queries`; `Tables<"patient_billing_entries">` (Task 2).
- Produces: `buildLedger(entries: LedgerEntry[])`, `aggregatePatientBalances(...)` (both pure, unit-tested below), `listPatientLedger(supabase, patientKey, reservationIds)`, `listPatientBalances(supabase)` — consumed by Task 6 (per-patient page) and Task 8 (balances page).

- [ ] **Step 1: Write the failing tests for the pure functions**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregatePatientBalances, buildLedger } from "./queries";
import type { LedgerEntry } from "./types";
import type { PatientGroup } from "@/services/reservations/patientHistory";

describe("buildLedger", () => {
  it("computes a running balance in date order regardless of input order", () => {
    const entries: LedgerEntry[] = [
      {
        id: "manual:2",
        date: "2026-09-10T10:00:00Z",
        kind: "payment",
        source: "manual",
        amount: 300,
        description: "Cash payment",
        method: "cash",
      },
      {
        id: "treatment:1",
        date: "2026-09-05T09:00:00Z",
        kind: "charge",
        source: "treatment",
        amount: 800,
        description: "Filling",
        method: null,
      },
    ];
    const { entries: sorted, balance } = buildLedger(entries);
    assert.deepEqual(
      sorted.map((e) => e.id),
      ["treatment:1", "manual:2"],
    );
    assert.equal(sorted[0]!.balanceAfter, 800);
    assert.equal(sorted[1]!.balanceAfter, 500);
    assert.equal(balance, 500);
  });

  it("returns a zero balance for an empty ledger", () => {
    const { entries, balance } = buildLedger([]);
    assert.deepEqual(entries, []);
    assert.equal(balance, 0);
  });

  it("lets a fully-paid patient end at exactly zero", () => {
    const entries: LedgerEntry[] = [
      {
        id: "treatment:1",
        date: "2026-09-01T00:00:00Z",
        kind: "charge",
        source: "treatment",
        amount: 1000,
        description: "Cleaning",
        method: null,
      },
      {
        id: "deposit:1",
        date: "2026-09-02T00:00:00Z",
        kind: "payment",
        source: "deposit",
        amount: 1000,
        description: "Booking deposit",
        method: "deposit",
      },
    ];
    assert.equal(buildLedger(entries).balance, 0);
  });
});

describe("aggregatePatientBalances", () => {
  const directory: PatientGroup[] = [
    {
      patientKey: "phone:201000000001",
      displayName: "Nour",
      phone: "201000000001",
      email: null,
      alternateNames: [],
      visits: [
        {
          id: "res-1",
        } as PatientGroup["visits"][number],
      ],
    },
  ];

  it("nets charges against deposit payments and drops zero balances", () => {
    const balances = aggregatePatientBalances(
      [{ patient_key: "phone:201000000001", fee_amount: 1000 }],
      [{ id: "dep-1", amount_egp: 1000, reservation_id: "res-1" }],
      [],
      directory,
    );
    assert.deepEqual(balances, []);
  });

  it("includes a manual charge for a patient not in the reservation directory", () => {
    const balances = aggregatePatientBalances(
      [],
      [],
      [{ patient_key: "phone:201099999999", kind: "charge", amount_egp: 250 }],
      [],
    );
    assert.equal(balances.length, 1);
    assert.equal(balances[0]!.patientKey, "phone:201099999999");
    assert.equal(balances[0]!.balance, 250);
    assert.equal(balances[0]!.displayName, "phone:201099999999");
  });

  it("sorts by balance descending", () => {
    const balances = aggregatePatientBalances(
      [
        { patient_key: "a", fee_amount: 100 },
        { patient_key: "b", fee_amount: 900 },
      ],
      [],
      [],
      [],
    );
    assert.deepEqual(
      balances.map((b) => b.patientKey),
      ["b", "a"],
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_billing/queries.test.ts`
Expected: FAIL — `queries.ts` doesn't exist yet.

- [ ] **Step 3: Write `queries.ts`**

```ts
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import type { LedgerEntry, LedgerEntryWithBalance, PatientBalance } from "./types";

type ServerSupabase = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/** Sorts by date and computes a running balance — pure, no I/O. */
export function buildLedger(entries: LedgerEntry[]): {
  entries: LedgerEntryWithBalance[];
  balance: number;
} {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const withBalance = sorted.map((entry) => {
    running += entry.kind === "charge" ? entry.amount : -entry.amount;
    return { ...entry, balanceAfter: running };
  });
  return { entries: withBalance, balance: running };
}

type TreatmentChargeRow = { patient_key: string; fee_amount: number };
type DepositPaymentRow = { id: string; amount_egp: number; reservation_id: string };
type ManualEntryRow = {
  patient_key: string;
  kind: "charge" | "payment";
  amount_egp: number;
};

/** Nets charges against payments per patient_key — pure, no I/O. */
export function aggregatePatientBalances(
  treatments: TreatmentChargeRow[],
  deposits: DepositPaymentRow[],
  manualEntries: ManualEntryRow[],
  directory: PatientGroup[],
): PatientBalance[] {
  const reservationIdToPatientKey = new Map<string, string>();
  for (const group of directory) {
    for (const visit of group.visits) {
      reservationIdToPatientKey.set(visit.id, group.patientKey);
    }
  }

  const net = new Map<string, number>();
  const add = (patientKey: string, delta: number) => {
    net.set(patientKey, (net.get(patientKey) ?? 0) + delta);
  };

  for (const t of treatments) add(t.patient_key, t.fee_amount);
  for (const d of deposits) {
    const patientKey = reservationIdToPatientKey.get(d.reservation_id);
    if (patientKey) add(patientKey, -d.amount_egp);
  }
  for (const m of manualEntries) {
    add(m.patient_key, m.kind === "charge" ? m.amount_egp : -m.amount_egp);
  }

  const infoByKey = new Map(directory.map((g) => [g.patientKey, g]));
  return Array.from(net.entries())
    .filter(([, balance]) => balance !== 0)
    .map(([patientKey, balance]) => ({
      patientKey,
      displayName: infoByKey.get(patientKey)?.displayName ?? patientKey,
      phone: infoByKey.get(patientKey)?.phone ?? "",
      balance,
    }))
    .sort((a, b) => b.balance - a.balance);
}

/**
 * A patient's full ledger: done-treatment charges + paid-deposit credits
 * (matched via their own reservation ids) + manual entries.
 */
export async function listPatientLedger(
  supabase: ServerSupabase,
  patientKey: string,
  reservationIds: string[],
): Promise<{ entries: LedgerEntryWithBalance[]; balance: number }> {
  const [treatmentsRes, depositsRes, manualRes] = await Promise.all([
    supabase
      .from("patient_treatments")
      .select("id, fee_amount, tooth_name, cdt_code, updated_at")
      .eq("patient_key", patientKey)
      .eq("status", "done"),
    reservationIds.length > 0
      ? supabase
          .from("deposit_requests")
          .select("id, amount_egp, decided_at, created_at")
          .in("reservation_id", reservationIds)
          .eq("status", "paid")
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("patient_billing_entries")
      .select("id, kind, amount_egp, description, method, created_at")
      .eq("patient_key", patientKey),
  ]);
  if (treatmentsRes.error) throw treatmentsRes.error;
  if (depositsRes.error) throw depositsRes.error;
  if (manualRes.error) throw manualRes.error;

  const charges: LedgerEntry[] = (treatmentsRes.data ?? []).map((t) => ({
    id: `treatment:${t.id}`,
    date: t.updated_at,
    kind: "charge",
    source: "treatment",
    amount: t.fee_amount,
    description: t.cdt_code ? `${t.tooth_name} — ${t.cdt_code}` : t.tooth_name,
    method: null,
  }));

  const deposits: LedgerEntry[] = (depositsRes.data ?? []).map((d) => ({
    id: `deposit:${d.id}`,
    date: d.decided_at ?? d.created_at,
    kind: "payment",
    source: "deposit",
    amount: d.amount_egp,
    description: "Booking deposit",
    method: "deposit",
  }));

  const manual: LedgerEntry[] = (manualRes.data ?? []).map((m) => ({
    id: `manual:${m.id}`,
    date: m.created_at,
    kind: m.kind,
    source: "manual",
    amount: m.amount_egp,
    description: m.description,
    method: m.method,
  }));

  return buildLedger([...charges, ...deposits, ...manual]);
}

/** Every patient with a non-zero balance, clinic-wide, sorted by amount owed. */
export async function listPatientBalances(
  supabase: ServerSupabase,
): Promise<PatientBalance[]> {
  const [reservations, treatmentsRes, depositsRes, manualRes] = await Promise.all([
    listReservationsServer(supabase).catch(() => []),
    supabase.from("patient_treatments").select("patient_key, fee_amount").eq("status", "done"),
    supabase
      .from("deposit_requests")
      .select("id, amount_egp, reservation_id")
      .eq("status", "paid"),
    supabase.from("patient_billing_entries").select("patient_key, kind, amount_egp"),
  ]);
  if (treatmentsRes.error) throw treatmentsRes.error;
  if (depositsRes.error) throw depositsRes.error;
  if (manualRes.error) throw manualRes.error;

  const directory = groupReservationsByPatient(reservations);
  return aggregatePatientBalances(
    treatmentsRes.data ?? [],
    depositsRes.data ?? [],
    manualRes.data ?? [],
    directory,
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_billing/queries.test.ts`
Expected: 6 passing. If `aggregatePatientBalances`'s first test doesn't net to an empty array, double check the deposit's `reservation_id` in the test ("res-1") matches the directory visit's `id` field exactly.

- [ ] **Step 5: Run the full build to catch any type mismatch against Task 2's hand-patched types**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 6: Commit**

```bash
git add src/services/patient_billing/queries.ts src/services/patient_billing/queries.test.ts
git commit -m "$(cat <<'EOF'
feat(admin): add patient ledger + clinic-wide balance queries

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `src/services/patient_billing/` — mutations + server action

**Files:**
- Create: `src/services/patient_billing/mutations.ts`
- Create: `src/services/patient_billing/actions.ts`

**Interfaces:**
- Consumes: `BillingEntryUpsertValues`, `billingEntryUpsertSchema` (Task 3); `requirePermission` from `@/lib/api/requirePermission`.
- Produces: `addBillingEntry(supabase, patientKey, createdBy, input)`; `saveBillingEntry(patientKey, input)` (`"use server"`, gated on `patients.billing.edit`) — consumed by Task 6's form.

- [ ] **Step 1: Write `mutations.ts`**

```ts
import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { BillingEntryUpsertValues } from "./schemas";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export async function addBillingEntry(
  supabase: ServerSupabase,
  patientKey: string,
  createdBy: string,
  input: BillingEntryUpsertValues,
): Promise<void> {
  const { error } = await supabase.from("patient_billing_entries").insert({
    patient_key: patientKey,
    kind: input.kind,
    amount_egp: input.amount_egp,
    description: input.description,
    method: input.method,
    created_by: createdBy,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Write `actions.ts`**

```ts
"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { billingEntryUpsertSchema } from "./schemas";
import { addBillingEntry } from "./mutations";

export async function saveBillingEntry(
  patientKey: string,
  input: unknown,
): Promise<void> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const parsed = billingEntryUpsertSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await addBillingEntry(auth.supabase, patientKey, auth.session.user.id, parsed.data);
}
```

- [ ] **Step 3: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add src/services/patient_billing/mutations.ts src/services/patient_billing/actions.ts
git commit -m "$(cat <<'EOF'
feat(admin): add saveBillingEntry server action

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Per-patient Billing page

**Files:**
- Create: `src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx`
- Create: `src/features/admin/components/patients/billing/PatientBillingView.tsx`

**Interfaces:**
- Consumes: `listPatientLedger` (Task 4), `saveBillingEntry` (Task 5), `billingEntryUpsertSchema` (Task 3), `decodePatientKey`/`getPatientGroup`/`groupReservationsByPatient` (`@/services/reservations/patientHistory`), `listReservationsServer` (`@/services/reservations/queries`), `requirePagePermission` (`@/lib/auth/pageGuard`), `formatEgp` (`@/services/deposits/receiptMessages`).
- Produces: route `/admin/patients/[patientKey]/billing` — linked from Task 7's header link.

- [ ] **Step 1: Write the page**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  decodePatientKey,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import { listPatientLedger } from "@/services/patient_billing/queries";
import { PatientBillingView } from "@/features/admin/components/patients/billing/PatientBillingView";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ patientKey: string }>;
};

export default async function AdminPatientBillingPage({ params }: Props) {
  const session = await requirePagePermission("patients.view");
  const { patientKey: encoded } = await params;
  const patientKey = decodePatientKey(encoded);
  const supabase = await createClient();
  const reservations = await listReservationsServer(supabase).catch(() => []);
  const directory = groupReservationsByPatient(reservations);
  const group = getPatientGroup(directory, patientKey);
  if (!group) notFound();

  const { entries, balance } = await listPatientLedger(
    supabase,
    group.patientKey,
    group.visits.map((v) => v.id),
  );

  return (
    <PatientBillingView
      patientKey={group.patientKey}
      displayName={group.displayName}
      entries={entries}
      balance={balance}
      canEdit={session.permissions.has("patients.billing.edit")}
    />
  );
}
```

- [ ] **Step 2: Write `PatientBillingView.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminInput, AdminSelect, AdminSelectContent, AdminSelectItem, AdminSelectTrigger, AdminSelectValue } from "@/features/admin/ui";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { saveBillingEntry } from "@/services/patient_billing/actions";
import type { LedgerEntryWithBalance } from "@/services/patient_billing/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale } from "@/lib/i18n";

type FormState = {
  kind: "charge" | "payment";
  amount: string;
  description: string;
  method: "cash" | "card" | "instapay" | "other";
};

function defaultForm(): FormState {
  return { kind: "payment", amount: "", description: "", method: "cash" };
}

type Props = {
  patientKey: string;
  displayName: string;
  entries: LedgerEntryWithBalance[];
  balance: number;
  canEdit: boolean;
};

export function PatientBillingView({
  patientKey,
  displayName,
  entries: initialEntries,
  balance: initialBalance,
  canEdit,
}: Props) {
  const { locale } = useLocale();
  const [entries, setEntries] = useState(initialEntries);
  const [balance, setBalance] = useState(initialBalance);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Enter a description");
      return;
    }
    setPending(true);
    try {
      await saveBillingEntry(patientKey, {
        kind: form.kind,
        amount_egp: amount,
        description: form.description.trim(),
        method: form.kind === "payment" ? form.method : null,
      });
      const newEntry: LedgerEntryWithBalance = {
        id: `pending:${Date.now()}`,
        date: new Date().toISOString(),
        kind: form.kind,
        source: "manual",
        amount,
        description: form.description.trim(),
        method: form.kind === "payment" ? form.method : null,
        balanceAfter: form.kind === "charge" ? balance + amount : balance - amount,
      };
      setEntries((prev) => [...prev, newEntry]);
      setBalance(newEntry.balanceAfter);
      setForm(defaultForm());
      toast.success("Entry recorded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.billing.patientTitle"
        descriptionKey="admin.billing.patientDescription"
      />

      <Card className="max-w-3xl gap-2 bg-transparent p-6">
        <p className="text-sm text-[var(--admin-muted)]">{displayName}</p>
        <p
          className={`text-2xl font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}
        >
          {formatEgp(Math.abs(balance), locale)}
          {balance > 0 ? " owed" : balance < 0 ? " credit" : ""}
        </p>
      </Card>

      {canEdit ? (
        <Card className="max-w-3xl gap-3 bg-transparent p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AdminSelect
              value={form.kind}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, kind: value as FormState["kind"] }))
              }
            >
              <AdminSelectTrigger>
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                <AdminSelectItem value="payment">Payment</AdminSelectItem>
                <AdminSelectItem value="charge">Charge</AdminSelectItem>
              </AdminSelectContent>
            </AdminSelect>
            {form.kind === "payment" ? (
              <AdminSelect
                value={form.method}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, method: value as FormState["method"] }))
                }
              >
                <AdminSelectTrigger>
                  <AdminSelectValue />
                </AdminSelectTrigger>
                <AdminSelectContent>
                  <AdminSelectItem value="cash">Cash</AdminSelectItem>
                  <AdminSelectItem value="card">Card</AdminSelectItem>
                  <AdminSelectItem value="instapay">InstaPay</AdminSelectItem>
                  <AdminSelectItem value="other">Other</AdminSelectItem>
                </AdminSelectContent>
              </AdminSelect>
            ) : null}
          </div>
          <AdminInput
            placeholder="Amount (EGP)"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <AdminInput
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? "Saving…" : "Record entry"}
          </Button>
        </Card>
      ) : null}

      <Card className="max-w-3xl gap-0 bg-transparent p-0">
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No billing activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--admin-text)]">
                    {entry.description}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {new Date(entry.date).toLocaleDateString()} · {entry.source}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className={entry.kind === "charge" ? "text-red-600" : "text-emerald-600"}>
                    {entry.kind === "charge" ? "+" : "−"}
                    {formatEgp(entry.amount, locale)}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Balance: {formatEgp(entry.balanceAfter, locale)}
                  </p>
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

- [ ] **Step 3: Add the two i18n keys the header uses**

In `src/lib/i18n/messages/admin/en.ts`, add near the other `admin.patients.*`/`admin.billing.*`-adjacent keys:

```ts
  "admin.billing.patientTitle": "Billing",
  "admin.billing.patientDescription": "Charges, payments, and this patient's running balance.",
```

In `src/lib/i18n/messages/admin/ar.ts`:

```ts
  "admin.billing.patientTitle": "الفواتير",
  "admin.billing.patientDescription": "الرسوم والمدفوعات والرصيد الجاري لهذا المريض.",
```

- [ ] **Step 4: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(internal)/admin/(dashboard)/patients/[patientKey]/billing/page.tsx" src/features/admin/components/patients/billing/PatientBillingView.tsx src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "$(cat <<'EOF'
feat(admin): add per-patient billing ledger page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Link to it from the patient workspace header

**Files:**
- Modify: `src/features/admin/components/patients/workspace/WorkspaceHeader.tsx`

**Interfaces:**
- Consumes: `patientProfilePath`-style path builder — this task adds the equivalent for billing directly (see Step 1), `encodePatientKey` from `@/services/reservations/patientHistory`.

- [ ] **Step 1: Add a small billing link**

The current file (`src/features/admin/components/patients/workspace/WorkspaceHeader.tsx`) is:

```tsx
"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import { useTranslations } from "@/lib/i18n";

type Props = {
  group: PatientGroup;
};

export function WorkspaceHeader({ group }: Props) {
  const t = useTranslations();
  return (
    <header className="pointer-events-none absolute top-4 start-4 z-40 md:top-5 md:start-6">
      <div className="min-w-0 max-w-[min(18rem,50vw)]">
        <p className="truncate text-sm font-semibold text-[#111111]">
          {group.displayName}
        </p>
        <p className="truncate text-[11px] tracking-wide text-[#7a7a7a] uppercase">
          {t("admin.patients.clinicalWorkspace")}
        </p>
      </div>
    </header>
  );
}
```

Re-read it fresh first (per the Global Constraints note — confirm it still matches this before editing), then replace with:

```tsx
"use client";

import Link from "next/link";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { encodePatientKey } from "@/services/reservations/patientHistory";
import { useTranslations } from "@/lib/i18n";

type Props = {
  group: PatientGroup;
};

export function WorkspaceHeader({ group }: Props) {
  const t = useTranslations();
  return (
    <header className="pointer-events-none absolute top-4 start-4 z-40 md:top-5 md:start-6">
      <div className="min-w-0 max-w-[min(18rem,50vw)]">
        <p className="truncate text-sm font-semibold text-[#111111]">
          {group.displayName}
        </p>
        <p className="truncate text-[11px] tracking-wide text-[#7a7a7a] uppercase">
          {t("admin.patients.clinicalWorkspace")}
        </p>
        <Link
          href={`/admin/patients/${encodePatientKey(group.patientKey)}/billing`}
          className="pointer-events-auto mt-1 inline-block text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          {t("admin.billing.patientTitle")}
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/patients/workspace/WorkspaceHeader.tsx
git commit -m "$(cat <<'EOF'
feat(admin): link to a patient's billing ledger from the workspace header

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Clinic-wide `/admin/billing` balances page

**Files:**
- Create: `src/app/(internal)/admin/(dashboard)/billing/page.tsx`
- Create: `src/features/admin/components/billing/BillingBalancesView.tsx`

**Interfaces:**
- Consumes: `listPatientBalances` (Task 4), `patientProfilePath` (`@/services/reservations/patientHistory`), `CollectionTable`/`CollectionColumn` (`@/features/admin/components/CollectionTable`), `requirePagePermission`, `formatEgp`.

- [ ] **Step 1: Write the page**

```tsx
import { createClient } from "@/lib/supabase/server";
import { listPatientBalances } from "@/services/patient_billing/queries";
import { BillingBalancesView } from "@/features/admin/components/billing/BillingBalancesView";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requirePagePermission("patients.view");
  const supabase = await createClient();
  const balances = await listPatientBalances(supabase);
  return <BillingBalancesView balances={balances} />;
}
```

- [ ] **Step 2: Write `BillingBalancesView.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CollectionTable, type CollectionColumn } from "@/features/admin/components/CollectionTable";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { patientProfilePath } from "@/services/reservations/patientHistory";
import type { PatientBalance } from "@/services/patient_billing/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale, useTranslations } from "@/lib/i18n";

type Props = {
  balances: PatientBalance[];
};

export function BillingBalancesView({ balances }: Props) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();

  const columns: CollectionColumn<PatientBalance>[] = [
    {
      key: "displayName",
      header: t("admin.billing.patient"),
      cell: (row) => row.displayName,
      sortable: true,
      sortValue: (row) => row.displayName,
    },
    {
      key: "phone",
      header: t("admin.billing.phone"),
      cell: (row) => row.phone,
    },
    {
      key: "balance",
      header: t("admin.billing.balance"),
      cell: (row) => (
        <span className={row.balance > 0 ? "text-red-600" : "text-emerald-600"}>
          {formatEgp(Math.abs(row.balance), locale)}
          {row.balance > 0 ? "" : " (credit)"}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.balance,
    },
  ];

  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.nav.billing"
        descriptionKey="admin.billing.clinicDescription"
      />
      <Card className="bg-transparent p-0">
        <CollectionTable
          rows={balances}
          columns={columns}
          tableId="billing-balances"
          getRowId={(row) => row.patientKey}
          onRowClick={(id) => router.push(patientProfilePath(id))}
          emptyMessage={t("admin.billing.empty")}
        />
      </Card>
    </AdminPageMotion>
  );
}
```

- [ ] **Step 3: Add the remaining i18n keys**

In `src/lib/i18n/messages/admin/en.ts`, alongside the keys added in Task 6:

```ts
  "admin.nav.billing": "Billing",
  "admin.billing.clinicDescription": "Patients with an outstanding balance, sorted by amount owed.",
  "admin.billing.patient": "Patient",
  "admin.billing.phone": "Phone",
  "admin.billing.balance": "Balance",
  "admin.billing.empty": "No outstanding balances.",
```

In `src/lib/i18n/messages/admin/ar.ts`:

```ts
  "admin.nav.billing": "الفواتير",
  "admin.billing.clinicDescription": "المرضى الذين عليهم رصيد مستحق، مرتبين حسب المبلغ.",
  "admin.billing.patient": "المريض",
  "admin.billing.phone": "الهاتف",
  "admin.billing.balance": "الرصيد",
  "admin.billing.empty": "لا توجد أرصدة مستحقة.",
```

(`admin.nav.billing` is defined here since this is the first task that needs it; Task 9 only references it, doesn't redefine it.)

- [ ] **Step 4: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: `0`. If `CollectionColumn` isn't exported from `CollectionTable.tsx`, check with `grep -n "export type CollectionColumn" src/features/admin/components/CollectionTable.tsx` and adjust the import to match what's actually exported there.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(internal)/admin/(dashboard)/billing/page.tsx" src/features/admin/components/billing/BillingBalancesView.tsx src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "$(cat <<'EOF'
feat(admin): add clinic-wide billing balances page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Nav — sidebar entry + icon

**Files:**
- Modify: `src/features/admin/lib/adminNav.ts`

**Interfaces:**
- Consumes: `Receipt` icon from `lucide-react`; `admin.nav.billing` (defined in Task 8).

- [ ] **Step 1: Re-read the current file first**

Run: `grep -n "id: \"patients\"\|adminPageLabelKeys\|adminPagePermissions" src/features/admin/lib/adminNav.ts`

Confirm the `"patients"` rail item and section entry still look like they did when this plan was written (see the Global Constraints note — other nav-adjacent work may have landed). If the structure has changed, adapt the insertion points below accordingly rather than forcing this exact diff.

- [ ] **Step 2: Add the icon import**

In `src/features/admin/lib/adminNav.ts`, add `Receipt` to the existing `lucide-react` import:

```ts
import {
  CalendarDays,
  History,
  Home,
  Inbox,
  LayoutGrid,
  Gauge,
  MessagesSquare,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
```

- [ ] **Step 3: Add the top-level rail item**

Immediately after the `"patients"` entry in `adminRailItems`:

```ts
  {
    id: "patients",
    href: "/admin/patients",
    labelKey: "admin.nav.patients",
    icon: Users,
    permission: "patients.view",
  },
  {
    id: "billing",
    href: "/admin/billing",
    labelKey: "admin.nav.billing",
    icon: Receipt,
    permission: "patients.view",
  },
```

- [ ] **Step 4: Add the sidebar section entry**

Immediately after the `/admin/patients` entry inside the `"clinic"` section's `entries` array in `adminNavSections`:

```ts
      { href: "/admin/patients", labelKey: "admin.nav.patients", permission: "patients.view" },
      { href: "/admin/billing", labelKey: "admin.nav.billing", permission: "patients.view" },
```

- [ ] **Step 5: Add to `adminPageLabelKeys` and `adminPagePermissions`**

In `adminPageLabelKeys`, after the `"/admin/patients"` line:

```ts
  "/admin/patients": "admin.nav.patients",
  "/admin/billing": "admin.nav.billing",
```

In `adminPagePermissions`, after the `"/admin/patients"` line:

```ts
  "/admin/patients": "patients.view",
  "/admin/billing": "patients.view",
```

- [ ] **Step 6: Verify the build**

Run: `GITHUB_TOKEN=x yarn build 2>&1 | grep -c "error TS"`
Expected: `0`.

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/lib/adminNav.ts
git commit -m "$(cat <<'EOF'
feat(admin): add Billing to the sidebar with a Receipt icon

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `GITHUB_TOKEN=x yarn build`
Expected: `✓ Compiled successfully`, zero `error TS` lines, full route list printed including `/admin/billing` and `/admin/patients/[patientKey]/billing`.

- [ ] **Step 2: Lint**

Run: `GITHUB_TOKEN=x yarn lint`
Expected: no new errors/warnings attributed to any file created or modified in this plan (pre-existing unrelated lint findings elsewhere in the repo are not this plan's concern).

- [ ] **Step 3: Full test suite**

Run: `GITHUB_TOKEN=x yarn test`
Expected: all tests pass, including the new `schemas.test.ts` and `queries.test.ts` from Tasks 3–4.

- [ ] **Step 4: Manual smoke test**

Using the local Supabase stack (`GITHUB_TOKEN=x env $(cat .env.e2e | xargs) yarn dev`, per how the doctor-profile feature was smoke-tested earlier this session):
1. As an Owner/Front Desk account: open a patient with at least one `done` treatment and one `paid` deposit, click "Billing" in the workspace header, confirm the ledger shows both as separate rows with a correct running balance, and confirm "Record entry" adds a manual charge/payment and updates the balance immediately.
2. As a Doctor account (no `patients.billing.edit`): open the same patient's billing page, confirm the balance is visible but the "Record entry" form is absent.
3. Visit `/admin/billing`, confirm the patient from step 1 appears with the correct balance, and that clicking the row navigates to their profile.
4. Confirm "Billing" appears in the sidebar (both the icon rail and the full sidebar) with the Receipt icon, positioned right after "Patients".

- [ ] **Step 5: Report findings**

If any manual-smoke-test step fails, fix the specific task above it corresponds to and re-run Steps 1–4 before considering this plan complete.
