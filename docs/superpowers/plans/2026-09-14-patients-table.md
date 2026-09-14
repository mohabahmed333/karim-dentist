# Patients Table + Reservation Patient Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the reservation form book against a real, searchable patient record (existing or brand-new), backed by a real `patients` table instead of the derived phone/name key.

**Architecture:** Rename `patient_profiles` → `patients` (same columns, same `patient_key` values, so every other consumer of `patient_key` keeps working unchanged). Add a nullable `reservations.patient_id` FK, backfilled from existing data. The reservation form gets a search-or-create patient picker; the `createReservation` server action resolves a `patients` row (reuse existing key match, or create one) before inserting.

**Tech Stack:** Next.js, Supabase (Postgres + RLS), Zod, `node:test` (repo's test runner, run via `bash scripts/test.sh`).

**Spec:** [docs/superpowers/specs/2026-09-14-patients-table-design.md](../specs/2026-09-14-patients-table-design.md)

## Global Constraints

- Every existing `patient_key` value must be preserved unchanged by the rename — the other 12 tables that key on bare `patient_key` text (`patient_treatments`, `treatment_proposals`, clinical/imaging/prescription/lab tables, `whatsapp_conversations`, etc.) are explicitly **out of scope** and must keep working without any code changes.
- `reservations.patient_name` / `phone` / `email` stay exactly as they are today (a booking-time snapshot) — do not remove them or make reads join through `patients`.
- The service module directory stays `src/services/patient_profiles/` (only the underlying SQL table is renamed to `patients`). Renaming the directory would also require updating 5 unrelated import sites (`ClientProfileSummary.tsx`, `ClientProfileForm.tsx`, `ClientProfileDrawer.tsx`, `useReceptionFlows.ts`, `admin_ai/patientAdapters.ts`) for zero functional benefit — skip it.
- Test convention already in this repo: pure logic gets a `node:test` unit test; thin functions that just call the real Supabase client (`queries.ts`/`mutations.ts` one-liners) are **not** unit-tested anywhere in this codebase (no mock/fake Supabase client exists for this) — verify those manually via the dev server instead of inventing new test infra.
- **This repo's `.env.local` points at the real production Supabase project** (per project memory — there is no separate local DB). `supabase db push --linked` and `supabase gen types --linked` both act on that live project. Confirm with the user before running either.

---

### Task 1: Migration — `patients` table, backfill, `reservations.patient_id`

**Files:**
- Create: `supabase/migrations/20260915100000_patients_table.sql`

**Interfaces:**
- Produces: table `public.patients` (same columns as the old `public.patient_profiles`, `patient_key` values unchanged), column `public.reservations.patient_id uuid REFERENCES public.patients(id)`.

- [ ] **Step 1: Write the migration**

```sql
-- Rename patient_profiles -> patients (same columns, same patient_key values),
-- backfill any patient_key that only exists on reservations, and link
-- reservations to patients via a new nullable patient_id FK.
-- Rollback: see bottom of file.

ALTER TABLE public.patient_profiles RENAME TO patients;
ALTER INDEX IF EXISTS patient_profiles_patient_key_idx RENAME TO patients_patient_key_idx;
ALTER POLICY patient_profiles_admin_all ON public.patients RENAME TO patients_admin_all;

-- Backfill: one `patients` row per patient_key that shows up on a reservation
-- but has no profile row yet. Mirrors patientKeyFromReservation() exactly:
-- phone:<canonical-digits> when a phone is present, else name:<lowercased-name>.
WITH derived AS (
  SELECT
    r.patient_name,
    r.phone,
    r.email,
    r.starts_at,
    regexp_replace(r.phone, '\D', '', 'g') AS raw_digits
  FROM public.reservations r
  WHERE r.deleted_at IS NULL
),
-- Two sequential stages, mirroring canonicalPhoneDigits()'s two sequential
-- `if`s exactly: strip a leading international "00", THEN separately check
-- whether the (possibly-just-stripped) result looks like a local Egyptian
-- mobile number. A single mutually-exclusive CASE would mishandle a number
-- like "0001012345678" (00 + a local-format number) — it must fall through
-- both checks, not just the first one that matches.
after_00 AS (
  SELECT
    *,
    CASE WHEN raw_digits LIKE '00%' THEN substr(raw_digits, 3) ELSE raw_digits END
      AS after_00
  FROM derived
),
canon AS (
  SELECT
    *,
    CASE
      WHEN after_00 = '' THEN ''
      WHEN after_00 LIKE '01%' AND length(after_00) = 11
        THEN '20' || substr(after_00, 2)
      ELSE after_00
    END AS canon_digits
  FROM after_00
),
keyed AS (
  SELECT
    *,
    CASE
      WHEN canon_digits <> '' THEN 'phone:' || canon_digits
      ELSE 'name:' || lower(trim(patient_name))
    END AS patient_key
  FROM canon
),
ranked AS (
  SELECT DISTINCT ON (patient_key)
    patient_key, patient_name, phone, email
  FROM keyed
  ORDER BY patient_key, starts_at DESC
)
INSERT INTO public.patients (patient_key, display_name, phone, email)
SELECT ranked.patient_key, ranked.patient_name, ranked.phone, ranked.email
FROM ranked
WHERE NOT EXISTS (
  SELECT 1 FROM public.patients p WHERE p.patient_key = ranked.patient_key
);

-- Link reservations to patients.
ALTER TABLE public.reservations
  ADD COLUMN patient_id uuid REFERENCES public.patients (id);

CREATE INDEX IF NOT EXISTS reservations_patient_id_idx
  ON public.reservations (patient_id);

WITH derived AS (
  SELECT
    r.id,
    r.patient_name,
    r.phone,
    regexp_replace(r.phone, '\D', '', 'g') AS raw_digits
  FROM public.reservations r
),
after_00 AS (
  SELECT
    *,
    CASE WHEN raw_digits LIKE '00%' THEN substr(raw_digits, 3) ELSE raw_digits END
      AS after_00
  FROM derived
),
canon AS (
  SELECT
    *,
    CASE
      WHEN after_00 = '' THEN ''
      WHEN after_00 LIKE '01%' AND length(after_00) = 11
        THEN '20' || substr(after_00, 2)
      ELSE after_00
    END AS canon_digits
  FROM after_00
),
keyed AS (
  SELECT
    id,
    CASE
      WHEN canon_digits <> '' THEN 'phone:' || canon_digits
      ELSE 'name:' || lower(trim(patient_name))
    END AS patient_key
  FROM canon
)
UPDATE public.reservations r
SET patient_id = p.id
FROM keyed k
JOIN public.patients p ON p.patient_key = k.patient_key
WHERE r.id = k.id AND r.patient_id IS NULL;

-- Rollback:
-- ALTER TABLE public.reservations DROP COLUMN IF EXISTS patient_id;
-- ALTER POLICY patients_admin_all ON public.patients RENAME TO patient_profiles_admin_all;
-- ALTER INDEX IF EXISTS patients_patient_key_idx RENAME TO patient_profiles_patient_key_idx;
-- ALTER TABLE public.patients RENAME TO patient_profiles;
```

- [ ] **Step 2: Confirm with the user, then apply**

This changes the schema of the live, production-linked Supabase project (per project memory, `.env.local` is production — there is no separate local DB). Ask the user to confirm before running:

```bash
supabase link --project-ref puibdsyokgjdvkkousil
supabase db push --linked
```

- [ ] **Step 3: Verify the backfill**

In the Supabase SQL editor (or via `supabase db execute` if available), run:

```sql
select count(*) from public.patients;
select count(*) from public.reservations where patient_id is null and deleted_at is null;
```

Expected: the second query returns `0` (every non-deleted reservation resolved to a patient).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260915100000_patients_table.sql
git commit -m "$(cat <<'EOF'
feat(db): add patients table, backfill from reservations, link reservations.patient_id

Renames patient_profiles to patients (patient_key values unchanged, so
every other patient_key-keyed table keeps working) and adds a nullable
reservations.patient_id FK, backfilled to match the existing derived key.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Update generated Supabase types

**Files:**
- Modify: `src/lib/supabase/database.types.ts` (the `patient_profiles` block around line 1866, and the `reservations` block around line 2256)

**Interfaces:**
- Produces: `Tables<"patients">`, `TablesInsert<"patients">`, `TablesUpdate<"patients">`; `Tables<"reservations">` gaining `patient_id: string | null`.

- [ ] **Step 1: Regenerate (preferred), with confirmation**

This reads the live, production-linked project's schema. Confirm with the user, then:

```bash
supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

- [ ] **Step 2: If codegen isn't available in this environment, edit manually**

Rename the object key `patient_profiles` (line 1866) to `patients` — the column lists inside `Row`/`Insert`/`Update` don't change. In the `reservations` block (line 2256), add `patient_id: string | null` to `Row`, `patient_id?: string | null` to `Insert` and `Update`, and add to `Relationships`:

```ts
{
  foreignKeyName: "reservations_patient_id_fkey"
  columns: ["patient_id"]
  isOneToOne: false
  referencedRelation: "patients"
  referencedColumns: ["id"]
}
```

- [ ] **Step 3: Confirm the project type-checks**

Run: `yarn tsc --noEmit` (or the repo's existing typecheck script if one exists in `package.json`)
Expected: no new errors from `database.types.ts` consumers (some will appear until Task 3 renames the table references — that's expected at this point).

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
chore(types): regenerate database types for patients table + reservations.patient_id

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Rename `patient_profiles` table references to `patients`

**Files:**
- Modify: `src/services/patient_profiles/queries.ts:11` (`.eq("patient_key", ...)` call's `.from("patient_profiles")`)
- Modify: `src/services/patient_profiles/mutations.ts:19` (`.from("patient_profiles")` in the upsert)
- Modify: `src/services/admin_ai/clinicalAdapters.ts:166,183,204`
- Modify: `src/services/admin_ai/patientAdapters.ts:16,50`
- Modify: `src/services/admin_ai/patientAdapters.test.ts:76,90,99,107,114`
- Modify: `src/services/profiles/servedPatients.ts:81`
- Modify: `src/services/whatsapp/quickReplyContext.ts:34`
- Modify: `src/services/system_log/revertPolicy.ts:14`
- Modify: `src/services/system_log/revertPolicy.test.ts:9`
- Modify: `src/services/system_log/listActions.test.ts:61,66`

**Interfaces:**
- No signature changes — every call site swaps the literal string `"patient_profiles"` for `"patients"`.

- [ ] **Step 1: Swap every `.from("patient_profiles")` to `.from("patients")`**

In `src/services/patient_profiles/queries.ts`, `mutations.ts`, `src/services/admin_ai/clinicalAdapters.ts`, `src/services/admin_ai/patientAdapters.ts`, `src/services/profiles/servedPatients.ts`, `src/services/whatsapp/quickReplyContext.ts`: change every `.from("patient_profiles")` to `.from("patients")`. No other code in these files changes.

- [ ] **Step 2: Update the system-log revertible-tables allowlist**

In `src/services/system_log/revertPolicy.ts:14`, change the array entry `"patient_profiles"` to `"patients"`.

- [ ] **Step 3: Update the three test files' string literals to match**

In `src/services/system_log/revertPolicy.test.ts:9`: change `isRevertible("patient_profiles")` to `isRevertible("patients")`.
In `src/services/system_log/listActions.test.ts:61,66`: change both `table_name: "patient_profiles"` and `table: "patient_profiles"` to `"patients"`.
In `src/services/admin_ai/patientAdapters.test.ts:76,90,99,107,114`: change every `tables: { patient_profiles: [...] }` / `db.upsertsTo("patient_profiles")` to use `patients` as the key/table name instead.

- [ ] **Step 4: Run the test suite**

Run: `bash scripts/test.sh`
Expected: all tests pass, including the three files just edited.

- [ ] **Step 5: Commit**

```bash
git add src/services/patient_profiles src/services/admin_ai src/services/profiles/servedPatients.ts src/services/whatsapp/quickReplyContext.ts src/services/system_log
git commit -m "$(cat <<'EOF'
refactor: point patient_profiles callers at the renamed patients table

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Extract `patientKeyFromNamePhone` as a pure, tested function

**Files:**
- Modify: `src/services/reservations/patientHistory.ts:49-54`
- Test: `src/services/reservations/patientHistory.test.ts`

**Interfaces:**
- Produces: `patientKeyFromNamePhone(name: string, phone: string): string` — exported, used by Task 5's `resolvePatientId`.
- `patientKeyFromReservation(reservation: Reservation): string` keeps its existing signature and behavior (becomes a thin wrapper).

- [ ] **Step 1: Write the failing test**

Add to `src/services/reservations/patientHistory.test.ts` (alongside the existing `patientKeyFromReservation` import):

```ts
// @ts-expect-error -- Node strip-types needs the extension.
import { patientKeyFromNamePhone } from "./patientHistory.ts";
```

```ts
describe("patientKeyFromNamePhone", () => {
  it("keys by canonical phone digits when a phone is given", () => {
    assert.equal(
      patientKeyFromNamePhone("Sara Mohamed", "+20 101 234 5678"),
      "phone:201012345678",
    );
  });

  it("falls back to lowercased name when there is no phone", () => {
    assert.equal(patientKeyFromNamePhone("Sara Mohamed", ""), "name:sara mohamed");
  });

  it("matches patientKeyFromReservation for the same inputs", () => {
    const reservation = {
      id: "r1",
      patient_name: "Omar Ali",
      phone: "01023456789",
    } as Parameters<typeof patientKeyFromReservation>[0];
    assert.equal(
      patientKeyFromNamePhone(reservation.patient_name, reservation.phone),
      patientKeyFromReservation(reservation),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/reservations/patientHistory.test.ts`
Expected: FAIL — `patientKeyFromNamePhone` is not exported yet.

- [ ] **Step 3: Implement**

In `src/services/reservations/patientHistory.ts`, replace:

```ts
export function patientKeyFromReservation(reservation: Reservation): string {
  const digits = canonicalPhoneDigits(reservation.phone);
  if (digits) return `phone:${digits}`;
  const name = reservation.patient_name.trim().toLowerCase();
  return `name:${name || reservation.id}`;
}
```

with:

```ts
export function patientKeyFromNamePhone(name: string, phone: string): string {
  const digits = canonicalPhoneDigits(phone);
  if (digits) return `phone:${digits}`;
  return `name:${name.trim().toLowerCase()}`;
}

export function patientKeyFromReservation(reservation: Reservation): string {
  const key = patientKeyFromNamePhone(reservation.patient_name, reservation.phone);
  return key === "name:" ? `name:${reservation.id}` : key;
}
```

(The `key === "name:"` guard preserves the exact existing fallback-to-`reservation.id` behavior for a blank name, which `patientKeyFromNamePhone` alone can't do since it has no reservation id to fall back to.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/reservations/patientHistory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/reservations/patientHistory.ts src/services/reservations/patientHistory.test.ts
git commit -m "$(cat <<'EOF'
refactor(reservations): extract patientKeyFromNamePhone for reuse outside reservations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `resolvePatientId` mutation + `searchPatients` query

**Files:**
- Modify: `src/services/patient_profiles/types.ts` (add `PatientSearchResult`)
- Modify: `src/services/patient_profiles/queries.ts` (add `searchPatients`)
- Modify: `src/services/patient_profiles/mutations.ts` (add `resolvePatientId`)

**Interfaces:**
- Consumes: `patientKeyFromNamePhone` from `@/services/reservations/patientHistory` (Task 4); `sanitizeIlike` from `@/services/reservations/listFilters`.
- Produces: `searchPatients(query: string, limit?: number): Promise<PatientSearchResult[]>`; `resolvePatientId(supabase: AnySupabase, input: { patientId?: string | null; displayName: string; phone: string; email?: string | null }): Promise<string>` — both consumed by Task 7.

- [ ] **Step 1: Add the search result type**

In `src/services/patient_profiles/types.ts`, add:

```ts
export type PatientSearchResult = {
  id: string;
  patient_key: string;
  display_name: string;
  phone: string;
  email: string | null;
};
```

- [ ] **Step 2: Add `searchPatients`**

In `src/services/patient_profiles/queries.ts`, add:

```ts
import { sanitizeIlike } from "@/services/reservations/listFilters";
import type { PatientProfile, PatientSearchResult } from "./types";

export async function searchPatients(
  query: string,
  limit = 8,
): Promise<PatientSearchResult[]> {
  const term = sanitizeIlike(query);
  if (!term) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, patient_key, display_name, phone, email")
    .or(`display_name.ilike.%${term}%,phone.ilike.%${term}%`)
    .order("display_name", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 3: Add `resolvePatientId`**

In `src/services/patient_profiles/mutations.ts`, add:

```ts
import { patientKeyFromNamePhone } from "@/services/reservations/patientHistory";

export async function resolvePatientId(
  supabase: AnySupabase,
  input: {
    patientId?: string | null;
    displayName: string;
    phone: string;
    email?: string | null;
  },
): Promise<string> {
  if (input.patientId) return input.patientId;

  const patientKey = patientKeyFromNamePhone(input.displayName, input.phone);

  const existing = await supabase
    .from("patients")
    .select("id")
    .eq("patient_key", patientKey)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;

  const inserted = await supabase
    .from("patients")
    .insert({
      patient_key: patientKey,
      display_name: input.displayName,
      phone: input.phone,
      email: input.email ?? null,
    })
    .select("id")
    .single();
  if (!inserted.error) return inserted.data.id;

  // Two staff members submitting for the same brand-new patient at once —
  // the unique patient_key constraint lost the race, so the other insert won.
  if (inserted.error.code === "23505") {
    const retry = await supabase
      .from("patients")
      .select("id")
      .eq("patient_key", patientKey)
      .single();
    if (retry.error) throw retry.error;
    return retry.data.id;
  }
  throw inserted.error;
}
```

- [ ] **Step 4: Manual verification (no automated test — matches this repo's convention of not mocking the Supabase client for thin query/mutation functions)**

Deferred to Task 11's end-to-end pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/patient_profiles
git commit -m "$(cat <<'EOF'
feat(patients): add searchPatients query and resolvePatientId mutation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Add `patient_id` to the reservation form values

**Files:**
- Modify: `src/services/reservations/schemas.ts:4-16`
- Modify: `src/features/admin/components/ReservationFormFields.tsx:375-411` (`emptyReservationForm`, `reservationToForm`)

**Interfaces:**
- Produces: `ReservationFormValues.patient_id: string | null | undefined` — consumed by Task 9 (UI) and Task 10 (submit payload).

- [ ] **Step 1: Add the field to the schema**

In `src/services/reservations/schemas.ts`, add one line to `reservationFormSchema`:

```ts
export const reservationFormSchema = z.object({
  patient_name: z.string().trim().min(1, "Name is required"),
  patient_id: z.string().uuid().nullable().optional(),
  phone: z.string().trim().min(1, "Phone is required"),
  // ...unchanged fields below
```

- [ ] **Step 2: Default it in `emptyReservationForm` and carry it through `reservationToForm`**

In `src/features/admin/components/ReservationFormFields.tsx`:

```ts
export function emptyReservationForm(): ReservationFormValues {
  return {
    patient_name: "",
    patient_id: null,
    phone: "",
    // ...unchanged fields below
```

```ts
export function reservationToForm(
  reservation: import("@/services/reservations/types").Reservation,
): ReservationFormValues {
  // ...unchanged date/hours/minutes computation above
  return {
    patient_name: reservation.patient_name,
    patient_id: reservation.patient_id,
    phone: reservation.phone,
    // ...unchanged fields below
```

- [ ] **Step 3: Run the test suite**

Run: `bash scripts/test.sh`
Expected: PASS (no test exercises this schema field directly yet, but this confirms nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add src/services/reservations/schemas.ts src/features/admin/components/ReservationFormFields.tsx
git commit -m "$(cat <<'EOF'
feat(reservations): thread patient_id through the reservation form values

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Resolve `patient_id` inside `createReservation`

**Files:**
- Modify: `src/services/reservations/actions.ts:7-13`

**Interfaces:**
- Consumes: `resolvePatientId` from `@/services/patient_profiles/mutations` (Task 5).
- No change to the action's exported signature — `createReservation(payload: ReservationInsert): Promise<Reservation>` behaves the same for existing callers that never set `patient_id`.

- [ ] **Step 1: Update the action**

In `src/services/reservations/actions.ts`, replace:

```ts
export async function createReservation(
  payload: ReservationInsert,
): Promise<Reservation> {
  const auth = await requirePermission("reservations.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createReservation(auth.supabase, payload);
}
```

with:

```ts
export async function createReservation(
  payload: ReservationInsert,
): Promise<Reservation> {
  const auth = await requirePermission("reservations.create");
  if (auth.error) throw new Error("Forbidden");
  const patient_id = await resolvePatientId(auth.supabase, {
    patientId: payload.patient_id,
    displayName: payload.patient_name,
    phone: payload.phone,
    email: payload.email,
  });
  return mutations.createReservation(auth.supabase, { ...payload, patient_id });
}
```

Add the import: `import { resolvePatientId } from "@/services/patient_profiles/mutations";`

- [ ] **Step 2: Run the test suite**

Run: `bash scripts/test.sh`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/services/reservations/actions.ts
git commit -m "$(cat <<'EOF'
feat(reservations): resolve or create the linked patient on reservation create

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `PatientCombobox` component

**Files:**
- Create: `src/features/admin/components/reservations/PatientCombobox.tsx`

**Interfaces:**
- Consumes: `searchPatients` from `@/services/patient_profiles/queries` (Task 5); `PatientSearchResult` type from `@/services/patient_profiles/types`.
- Produces: `<PatientCombobox disabled? onSelect={(patient: PatientSearchResult) => void} />` — consumed by Task 9.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPatients } from "@/services/patient_profiles/queries";
import type { PatientSearchResult } from "@/services/patient_profiles/types";

type Props = {
  disabled?: boolean;
  onSelect: (patient: PatientSearchResult) => void;
};

export function PatientCombobox({ disabled, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      void searchPatients(term)
        .then((rows) => {
          if (requestId.current === id) setResults(rows);
        })
        .catch(() => {
          if (requestId.current === id) setResults([]);
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false);
        });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-3 py-2">
        <Search className="size-3.5 text-[#9ca3af]" />
        <Input
          autoFocus
          disabled={disabled}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
        {loading ? (
          <li className="px-3 py-2 text-sm text-[#9ca3af]">Searching…</li>
        ) : query.trim() && results.length === 0 ? (
          <li className="px-3 py-2 text-sm text-[#9ca3af]">No matching patients</li>
        ) : (
          results.map((patient) => (
            <li key={patient.id} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-start text-sm hover:bg-[#f2f2f2]"
                onClick={() => onSelect(patient)}
              >
                <span className="block font-medium text-[#111827]">
                  {patient.display_name || "Unnamed"}
                </span>
                <span className="block text-xs text-[#6b7280]">{patient.phone}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification (no component-test harness exists in this repo — every `*.test.ts` here tests pure logic, not React components)**

Deferred to Task 11's end-to-end pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/reservations/PatientCombobox.tsx
git commit -m "$(cat <<'EOF'
feat(reservations): add PatientCombobox for searching existing patients

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Existing/new-patient picker in the reservation form

**Files:**
- Modify: `src/features/admin/components/ReservationFormFields.tsx` (import + render, around lines 1-19 and 221-231)
- Modify: `src/lib/i18n/messages/admin/en.ts` (near line 1142)
- Modify: `src/lib/i18n/messages/admin/ar.ts` (near line 1143)

**Interfaces:**
- Consumes: `PatientCombobox` (Task 8), `values.patient_id` (Task 6).

- [ ] **Step 1: Add the new translation keys**

In `src/lib/i18n/messages/admin/en.ts`, next to `"admin.reservations.patientName"`:

```ts
  "admin.reservations.searchExistingPatient": "Search for an existing patient…",
  "admin.reservations.linkedToPatient": "Linked to existing patient",
  "admin.reservations.unlinkPatient": "Unlink",
  "admin.reservations.enterNewPatientInstead": "Enter a new patient instead",
```

In `src/lib/i18n/messages/admin/ar.ts`, next to `"admin.reservations.patientName"`:

```ts
  "admin.reservations.searchExistingPatient": "ابحث عن مريض موجود…",
  "admin.reservations.linkedToPatient": "مرتبط بمريض موجود",
  "admin.reservations.unlinkPatient": "إلغاء الربط",
  "admin.reservations.enterNewPatientInstead": "أدخل مريضًا جديدًا بدلاً من ذلك",
```

- [ ] **Step 2: Import `PatientCombobox` and add `searching` state**

In `src/features/admin/components/ReservationFormFields.tsx`, add the import:

```ts
import { PatientCombobox } from "@/features/admin/components/reservations/PatientCombobox";
import type { PatientSearchResult } from "@/services/patient_profiles/types";
```

Inside the `ReservationFormFields` function body, alongside the existing `slots`/`slotsLoading` state:

```ts
const [searching, setSearching] = useState(false);

function onPatientSelect(patient: PatientSearchResult) {
  patch({
    patient_id: patient.id,
    patient_name: patient.display_name,
    phone: patient.phone,
    email: patient.email ?? "",
  });
  setSearching(false);
}
```

- [ ] **Step 3: Render the picker above the name/phone fields**

In the returned JSX, as the first child of the `<div className="grid gap-4 sm:grid-cols-2">` block (right before the `patient_name` label):

```tsx
{values.patient_id ? (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)]/30 px-3 py-2 sm:col-span-2">
    <span className="text-xs text-[var(--admin-text)]">
      {t("admin.reservations.linkedToPatient")}
    </span>
    <button
      type="button"
      className="text-xs font-medium text-[var(--admin-primary)] hover:underline"
      disabled={pending}
      onClick={() => patch({ patient_id: null })}
    >
      {t("admin.reservations.unlinkPatient")}
    </button>
  </div>
) : searching ? (
  <div className="grid gap-2 sm:col-span-2">
    <PatientCombobox disabled={pending} onSelect={onPatientSelect} />
    <button
      type="button"
      className="justify-self-start text-xs text-[var(--admin-muted)] hover:underline"
      onClick={() => setSearching(false)}
    >
      {t("admin.reservations.enterNewPatientInstead")}
    </button>
  </div>
) : (
  <div className="sm:col-span-2">
    <button
      type="button"
      data-showreel-action="reservation-search-existing-patient"
      className="text-xs font-medium text-[var(--admin-primary)] hover:underline"
      disabled={pending}
      onClick={() => setSearching(true)}
    >
      {t("admin.reservations.searchExistingPatient")}
    </button>
  </div>
)}
```

The existing `patient_name`/`phone`/`email` inputs stay exactly as they are below this block — they remain the editable booking-time snapshot whether or not `patient_id` is linked.

- [ ] **Step 4: Run the test suite**

Run: `bash scripts/test.sh`
Expected: PASS (this file has no `.test.ts`, so this just confirms nothing else broke).

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/ReservationFormFields.tsx src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "$(cat <<'EOF'
feat(reservations): add existing/new-patient picker to the reservation form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Pass `patient_id` through both save paths

**Files:**
- Modify: `src/features/admin/components/quick-book/QuickBookProvider.tsx:148-158`
- Modify: `src/features/admin/hooks/useReservationEditor.ts:245-255`

**Interfaces:**
- Consumes: `parsed.data.patient_id` (from Task 6's schema field).

- [ ] **Step 1: `QuickBookProvider.save()`**

In `src/features/admin/components/quick-book/QuickBookProvider.tsx`, in the `payload` object built inside `save()`, add one line:

```ts
const payload = {
  patient_name: matched?.displayName || parsed.data.patient_name,
  patient_id: parsed.data.patient_id ?? null,
  phone: matched?.phone || parsed.data.phone,
  // ...unchanged fields below
```

- [ ] **Step 2: `useReservationEditor.saveReservation()`**

In `src/features/admin/hooks/useReservationEditor.ts`, in the `payload` object built inside `saveReservation()`, add one line:

```ts
const payload = {
  patient_name: parsed.data.patient_name,
  patient_id: parsed.data.patient_id ?? null,
  phone: parsed.data.phone,
  // ...unchanged fields below
```

- [ ] **Step 3: Run the test suite**

Run: `bash scripts/test.sh`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/quick-book/QuickBookProvider.tsx src/features/admin/hooks/useReservationEditor.ts
git commit -m "$(cat <<'EOF'
feat(reservations): pass patient_id through both reservation save paths

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the app**

Run: `yarn dev` and sign in at `/admin/login`.

- [ ] **Step 2: New-patient booking**

Open the reservation form (Reservations page → New, or Quick Book), leave the patient picker untouched, type a brand-new name/phone, and save. Confirm in the Supabase dashboard that a new `patients` row was created with the matching `patient_key`, and the reservation's `patient_id` points to it.

- [ ] **Step 3: Existing-patient booking**

Open the reservation form again, click "Search for an existing patient…", search by the name or phone just created, select it. Confirm the name/phone/email fields prefill, and after saving the reservation's `patient_id` matches the same `patients.id` (no duplicate row created).

- [ ] **Step 4: Collision on the "new patient" path**

Open the form, leave it in new-patient mode, but type the same phone number used in Step 2 under a different name. Save. Confirm the reservation links to the Step 2 patient's existing `patients.id` rather than erroring or creating a duplicate.

- [ ] **Step 5: Confirm unrelated features still work against the renamed table**

Spot-check: the patient chairside profile drawer (`ClientProfileDrawer`), reception flows quick-reply context, admin AI "get patient summary" / "search patients" tools, and the system-log revert action for a patient-profile edit. All of these read/write the table by its literal name and were updated in Task 3 — confirm none throw a "relation patient_profiles does not exist" error.

- [ ] **Step 6: Report results to the user**

Summarize what was checked and any issues found — do not mark the plan complete if any manual check fails.
