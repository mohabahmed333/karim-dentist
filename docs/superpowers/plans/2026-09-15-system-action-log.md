# System Action Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a generic, database-level audit log covering every non-CMS admin write (reservations, patients/clinical records, access/roles, WhatsApp/chat metadata), with one-click revert for everything except messaging metadata, surfaced at `/admin/system-log` next to the existing `/admin/ai-actions` under a new "Logs" sidebar group.

**Architecture:** One generic Postgres trigger (`log_system_action()`) attached to 19 tracked tables writes every insert/update/delete into a new `system_action_log` table, with `auth.uid()` captured as the actor — zero changes to any of the 31 existing `mutations.ts` files. A second function, `revert_system_action(log_id)`, writes the stored `before` snapshot back (or deletes/re-inserts for insert/delete), guarded by a hardcoded revertible-tables list and a staleness check. The frontend mirrors the existing `/admin/ai-actions` page's cursor-pagination pattern, with the shared parts extracted into a `useCursorLog` hook so both pages use it.

**Tech Stack:** Next.js App Router, Supabase (Postgres + `@supabase/supabase-js`), `node:test` for unit tests, Playwright for e2e.

**Spec:** `docs/superpowers/specs/2026-09-14-system-action-log-design.md`

## Global Constraints

- CMS tables are entirely out of scope — not logged, not revertible (Customize already has its own undo).
- `whatsapp_messages`, `whatsapp_webhook_events`, `clinic_chat_messages` are never logged (noise, not "actions").
- Messaging metadata (`whatsapp_conversations`, `clinic_chat_threads`) is logged but never revertible (no corresponding Kapso API to keep in sync with).
- `role_permissions` is logged but never revertible (composite primary key `(role_id, permission_id)`, not a single row id — the revert mechanism only handles single-column keys).
- Every mutation already runs through the RLS-enforced session client, so `auth.uid()` resolves correctly inside the trigger — this has been verified against the actual mutation call sites (see spec, Decisions).
- New permissions: `system-log.view`, `system-log.revert`, both granted to the `owner` role only.
- No existing `mutations.ts` file changes — the whole point of the trigger approach.

---

### Task 1: `system_action_log` table, trigger function, and database types

**Files:**
- Create: `supabase/migrations/20260915000000_system_action_log.sql`
- Modify: `src/lib/supabase/database.types.ts` (insert a new table block; see Step 3)

**Interfaces:**
- Produces: table `public.system_action_log` with columns `id, table_name, row_id, operation, actor_id, before, after, created_at, reverted_at, reverted_by`; function `public.log_system_action()`; 19 triggers named `<table>_log_action`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260915000000_system_action_log.sql`:

```sql
-- Generic audit trail for every non-CMS admin write, with enough data to
-- write a row back to what it was before. See design doc
-- docs/superpowers/specs/2026-09-14-system-action-log-design.md.
--
-- Every one of the target tables is only writable by an authenticated admin
-- (each already has an `..._admin_all` RLS policy using is_admin()), so by
-- the time a trigger fires here the caller is already an admin — auth.uid()
-- resolves the same way it already does for public.is_admin() (see
-- 20260822201131_create_portfolio_cms.sql) and the trigger
-- enqueue_patient_notifications() in 20260911110000_patient_notifications_trigger.sql.
-- The one exception is accounts.createAccount's service-role profiles
-- upsert, which logs a null actor_id (service-role writes have no
-- auth.uid()) — acceptable, it's a single well-known write path.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS reservations_log_action ON public.reservations;
--   DROP TRIGGER IF EXISTS appointment_slots_log_action ON public.appointment_slots;
--   DROP TRIGGER IF EXISTS clinic_hours_log_action ON public.clinic_hours;
--   DROP TRIGGER IF EXISTS doctor_hours_log_action ON public.doctor_hours;
--   DROP TRIGGER IF EXISTS clinic_cdt_fees_log_action ON public.clinic_cdt_fees;
--   DROP TRIGGER IF EXISTS clinic_treatment_presets_log_action ON public.clinic_treatment_presets;
--   DROP TRIGGER IF EXISTS patient_profiles_log_action ON public.patient_profiles;
--   DROP TRIGGER IF EXISTS patient_clinical_notes_log_action ON public.patient_clinical_notes;
--   DROP TRIGGER IF EXISTS patient_treatments_log_action ON public.patient_treatments;
--   DROP TRIGGER IF EXISTS patient_imaging_log_action ON public.patient_imaging;
--   DROP TRIGGER IF EXISTS patient_tooth_notes_log_action ON public.patient_tooth_notes;
--   DROP TRIGGER IF EXISTS patient_tooth_note_attachments_log_action ON public.patient_tooth_note_attachments;
--   DROP TRIGGER IF EXISTS patient_tooth_surfaces_log_action ON public.patient_tooth_surfaces;
--   DROP TRIGGER IF EXISTS profiles_log_action ON public.profiles;
--   DROP TRIGGER IF EXISTS roles_log_action ON public.roles;
--   DROP TRIGGER IF EXISTS permissions_log_action ON public.permissions;
--   DROP TRIGGER IF EXISTS role_permissions_log_action ON public.role_permissions;
--   DROP TRIGGER IF EXISTS whatsapp_conversations_log_action ON public.whatsapp_conversations;
--   DROP TRIGGER IF EXISTS clinic_chat_threads_log_action ON public.clinic_chat_threads;
--   DROP FUNCTION IF EXISTS public.log_system_action();
--   DROP TABLE IF EXISTS public.system_action_log;

CREATE TABLE IF NOT EXISTS public.system_action_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text NOT NULL,
  row_id       text NOT NULL,
  operation    text NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  actor_id     uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  reverted_at  timestamptz,
  reverted_by  uuid
);

CREATE INDEX IF NOT EXISTS system_action_log_created_idx
  ON public.system_action_log (created_at DESC);
CREATE INDEX IF NOT EXISTS system_action_log_table_created_idx
  ON public.system_action_log (table_name, created_at DESC);

ALTER TABLE public.system_action_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_action_log_admin_all ON public.system_action_log;
CREATE POLICY system_action_log_admin_all
  ON public.system_action_log
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- One generic trigger function, attached below to every tracked table.
-- TG_ARGV[0] names the primary-key column(s), comma-separated for the one
-- composite-key table (role_permissions); defaults to 'id'. Never raises —
-- a logging failure must not roll back the write it's trying to record.
CREATE OR REPLACE FUNCTION public.log_system_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pk_columns text[] := string_to_array(COALESCE(TG_ARGV[0], 'id'), ',');
  row_data jsonb;
  row_id_value text;
  before_json jsonb;
  after_json jsonb;
  col text;
  parts text[] := '{}';
BEGIN
  IF TG_OP = 'DELETE' THEN
    before_json := to_jsonb(OLD);
    after_json := NULL;
    row_data := before_json;
  ELSIF TG_OP = 'INSERT' THEN
    before_json := NULL;
    after_json := to_jsonb(NEW);
    row_data := after_json;
  ELSE
    before_json := to_jsonb(OLD);
    after_json := to_jsonb(NEW);
    row_data := after_json;
  END IF;

  FOREACH col IN ARRAY pk_columns LOOP
    parts := parts || (row_data ->> col);
  END LOOP;
  row_id_value := array_to_string(parts, ':');

  INSERT INTO public.system_action_log (table_name, row_id, operation, actor_id, before, after)
  VALUES (TG_TABLE_NAME, COALESCE(row_id_value, ''), lower(TG_OP), auth.uid(), before_json, after_json);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Clinic ops
DROP TRIGGER IF EXISTS reservations_log_action ON public.reservations;
CREATE TRIGGER reservations_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS appointment_slots_log_action ON public.appointment_slots;
CREATE TRIGGER appointment_slots_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.appointment_slots
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS clinic_hours_log_action ON public.clinic_hours;
CREATE TRIGGER clinic_hours_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_hours
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS doctor_hours_log_action ON public.doctor_hours;
CREATE TRIGGER doctor_hours_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.doctor_hours
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('doctor_id');

DROP TRIGGER IF EXISTS clinic_cdt_fees_log_action ON public.clinic_cdt_fees;
CREATE TRIGGER clinic_cdt_fees_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_cdt_fees
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('code');

DROP TRIGGER IF EXISTS clinic_treatment_presets_log_action ON public.clinic_treatment_presets;
CREATE TRIGGER clinic_treatment_presets_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_treatment_presets
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('slot');

-- Patients / clinical
DROP TRIGGER IF EXISTS patient_profiles_log_action ON public.patient_profiles;
CREATE TRIGGER patient_profiles_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_clinical_notes_log_action ON public.patient_clinical_notes;
CREATE TRIGGER patient_clinical_notes_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_treatments_log_action ON public.patient_treatments;
CREATE TRIGGER patient_treatments_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_treatments
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_imaging_log_action ON public.patient_imaging;
CREATE TRIGGER patient_imaging_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_imaging
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_tooth_notes_log_action ON public.patient_tooth_notes;
CREATE TRIGGER patient_tooth_notes_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_tooth_notes
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_tooth_note_attachments_log_action ON public.patient_tooth_note_attachments;
CREATE TRIGGER patient_tooth_note_attachments_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_tooth_note_attachments
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS patient_tooth_surfaces_log_action ON public.patient_tooth_surfaces;
CREATE TRIGGER patient_tooth_surfaces_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.patient_tooth_surfaces
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

-- Access
DROP TRIGGER IF EXISTS profiles_log_action ON public.profiles;
CREATE TRIGGER profiles_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS roles_log_action ON public.roles;
CREATE TRIGGER roles_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS permissions_log_action ON public.permissions;
CREATE TRIGGER permissions_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS role_permissions_log_action ON public.role_permissions;
CREATE TRIGGER role_permissions_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('role_id,permission_id');

-- Messaging metadata (logged, not revertible — see revertPolicy.ts)
DROP TRIGGER IF EXISTS whatsapp_conversations_log_action ON public.whatsapp_conversations;
CREATE TRIGGER whatsapp_conversations_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();

DROP TRIGGER IF EXISTS clinic_chat_threads_log_action ON public.clinic_chat_threads;
CREATE TRIGGER clinic_chat_threads_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action();
```

- [ ] **Step 2: Apply it locally and check for errors**

Run: `supabase db reset --local`
Expected: every migration applies, ending with `Finished supabase db reset on branch main.` and no error about `system_action_log`, `log_system_action`, or any of the 19 `CREATE TRIGGER` statements.

- [ ] **Step 3: Update the database types**

In `src/lib/supabase/database.types.ts`, find the end of the `solution_panels` block (its closing `Relationships: []` and `}`, immediately followed by `whatsapp_ai_corrections: {`). Insert a new `system_action_log` block between them, so the file reads:

```ts
      solution_panels: {
        Row: {
          body: string
          body_ar: string
          created_at: string
          id: string
          image_url: string
          link_href: string | null
          sort_order: number
          title: string
          title_ar: string
          updated_at: string
          variant: "dark" | "photo"
        }
        Insert: {
          body?: string
          body_ar?: string
          created_at?: string
          id?: string
          image_url: string
          link_href?: string | null
          sort_order?: number
          title: string
          title_ar?: string
          updated_at?: string
          variant?: "dark" | "photo"
        }
        Update: {
          body?: string
          body_ar?: string
          created_at?: string
          id?: string
          image_url?: string
          link_href?: string | null
          sort_order?: number
          title?: string
          title_ar?: string
          updated_at?: string
          variant?: "dark" | "photo"
        }
        Relationships: []
      }
      system_action_log: {
        Row: {
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          operation: "insert" | "update" | "delete"
          reverted_at: string | null
          reverted_by: string | null
          row_id: string
          table_name: string
        }
        Insert: {
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          operation: "insert" | "update" | "delete"
          reverted_at?: string | null
          reverted_by?: string | null
          row_id: string
          table_name: string
        }
        Update: {
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          operation?: "insert" | "update" | "delete"
          reverted_at?: string | null
          reverted_by?: string | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      whatsapp_ai_corrections: {
        Row: {
          ai_text: string
```

(Only the `solution_panels` closing brace, the new `system_action_log` block, and the first line of `whatsapp_ai_corrections` are shown for anchoring — leave everything else in the file untouched.)

- [ ] **Step 4: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260915000000_system_action_log.sql src/lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
feat(db): generic system action log trigger across 19 admin tables

One trigger function, attached to every non-CMS admin-editable table,
captures every insert/update/delete with the actor and full before/after
row — no changes needed to any of the 31 existing mutations.ts files.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `revert_system_action` RPC

**Files:**
- Create: `supabase/migrations/20260915010000_system_action_log_revert_rpc.sql`

**Interfaces:**
- Consumes: `public.system_action_log` (Task 1), `public.is_admin()` (existing).
- Produces: `public.revert_system_action(p_log_id uuid) RETURNS void`, callable via `db.rpc("revert_system_action", { p_log_id })`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260915010000_system_action_log_revert_rpc.sql`:

```sql
-- One-click revert for system_action_log entries — writes the stored
-- "before" snapshot back (update), deletes the row (insert), or re-inserts
-- it (delete). Guarded by a hardcoded revertible-tables list (kept separate
-- from which tables are merely tracked — role_permissions and messaging
-- metadata are tracked but excluded here) and a staleness check so a revert
-- can't silently clobber a newer edit. See
-- docs/superpowers/specs/2026-09-14-system-action-log-design.md.
--
-- jsonb_populate_record (not a hand-built SET clause) does the type
-- coercion, because several tracked tables have array columns
-- (patient_profiles.medical_history text[], doctor_hours.time_windows
-- text[]) that a naive text-literal UPDATE would mangle.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.revert_system_action(uuid);

CREATE OR REPLACE FUNCTION public.revert_system_action(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_row public.system_action_log%ROWTYPE;
  revertible_tables text[] := ARRAY[
    'reservations', 'appointment_slots', 'clinic_hours', 'doctor_hours',
    'clinic_cdt_fees', 'clinic_treatment_presets',
    'patient_profiles', 'patient_clinical_notes', 'patient_treatments',
    'patient_imaging', 'patient_tooth_notes', 'patient_tooth_note_attachments',
    'patient_tooth_surfaces',
    'profiles', 'roles', 'permissions'
  ];
  pk_column text;
  cols text;
  current_row jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO log_row FROM public.system_action_log WHERE id = p_log_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Log entry not found';
  END IF;
  IF log_row.reverted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already reverted';
  END IF;
  IF NOT (log_row.table_name = ANY(revertible_tables)) THEN
    RAISE EXCEPTION 'Table % is not revertible', log_row.table_name;
  END IF;

  pk_column := CASE log_row.table_name
    WHEN 'doctor_hours' THEN 'doctor_id'
    WHEN 'clinic_cdt_fees' THEN 'code'
    WHEN 'clinic_treatment_presets' THEN 'slot'
    ELSE 'id'
  END;

  IF log_row.operation = 'insert' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %I::text = $1', log_row.table_name, pk_column)
      INTO current_row USING log_row.row_id;
    IF current_row IS NULL THEN
      RAISE EXCEPTION 'Row already gone — nothing to revert';
    END IF;
    EXECUTE format('DELETE FROM %I WHERE %I::text = $1', log_row.table_name, pk_column)
      USING log_row.row_id;

  ELSIF log_row.operation = 'update' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %I::text = $1', log_row.table_name, pk_column)
      INTO current_row USING log_row.row_id;
    IF current_row IS DISTINCT FROM log_row.after THEN
      RAISE EXCEPTION 'Row changed since this action — refresh and try again';
    END IF;

    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
      INTO cols
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = log_row.table_name;

    EXECUTE format(
      'UPDATE %I AS t SET (%s) = (SELECT %s FROM jsonb_populate_record(null::%I, $1)) WHERE t.%I::text = $2',
      log_row.table_name, cols, cols, log_row.table_name, pk_column
    ) USING log_row.before, log_row.row_id;

  ELSIF log_row.operation = 'delete' THEN
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE %I::text = $1', log_row.table_name, pk_column)
      INTO current_row USING log_row.row_id;
    IF current_row IS NOT NULL THEN
      RAISE EXCEPTION 'A row with this id already exists — cannot restore';
    END IF;
    EXECUTE format(
      'INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1)',
      log_row.table_name, log_row.table_name
    ) USING log_row.before;
  END IF;

  UPDATE public.system_action_log
  SET reverted_at = now(), reverted_by = auth.uid()
  WHERE id = p_log_id;
END;
$$;
```

- [ ] **Step 2: Apply it locally**

Run: `supabase db reset --local`
Expected: applies cleanly (this migration runs after Task 1's, so `system_action_log` already exists).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260915010000_system_action_log_revert_rpc.sql
git commit -m "$(cat <<'EOF'
feat(db): revert_system_action RPC for one-click undo

Writes the logged before-snapshot back via jsonb_populate_record (so
array columns like patient_profiles.medical_history revert correctly),
guarded by a revertible-tables allowlist and a staleness check.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `system-log.view` / `system-log.revert` permissions

**Files:**
- Create: `supabase/migrations/20260915020000_system_action_log_permissions.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260915020000_system_action_log_permissions.sql`:

```sql
-- Permissions for the new /admin/system-log page (log of every non-CMS
-- admin write, with one-click revert on everything except messaging
-- metadata).
-- Rollback:
--   DELETE FROM public.role_permissions WHERE permission_id IN
--     (SELECT id FROM public.permissions WHERE key IN ('system-log.view', 'system-log.revert'));
--   DELETE FROM public.permissions WHERE key IN ('system-log.view', 'system-log.revert');

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('system-log.view', 'system-log', 'View system action log', 113),
  ('system-log.revert', 'system-log', 'Revert a logged system action', 114)
ON CONFLICT (key) DO UPDATE
SET category = EXCLUDED.category,
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key IN ('system-log.view', 'system-log.revert')
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Apply and verify**

Run: `supabase db reset --local`

Then verify both functions and the new table exist:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\
SELECT proname FROM pg_proc WHERE proname IN ('log_system_action', 'revert_system_action'); \
SELECT count(*) FROM pg_trigger WHERE tgname LIKE '%_log_action'; \
SELECT key FROM public.permissions WHERE key LIKE 'system-log.%';"
```

Expected: both function names listed, trigger count `19`, and both permission keys listed. (If the local Postgres port differs from `54322`, check with `supabase status`.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260915020000_system_action_log_permissions.sql
git commit -m "$(cat <<'EOF'
feat(db): add system-log.view/revert permissions, granted to owner

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `revertPolicy.ts`

**Files:**
- Create: `src/services/system_log/revertPolicy.ts`
- Test: `src/services/system_log/revertPolicy.test.ts`

**Interfaces:**
- Produces: `TRACKED_TABLES: readonly string[]`, `isRevertible(table: string): boolean` — used by `listActions.ts` (Task 6) and mirrored inside the `revert_system_action` SQL function (Task 2) as the single source of truth for "what can be reverted."

- [ ] **Step 1: Write the failing test**

Create `src/services/system_log/revertPolicy.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isRevertible, TRACKED_TABLES } from "./revertPolicy.ts";

describe("isRevertible", () => {
  it("allows a plain tracked table", () => {
    assert.equal(isRevertible("reservations"), true);
    assert.equal(isRevertible("patient_profiles"), true);
  });

  it("excludes messaging metadata even though it is tracked", () => {
    assert.equal(TRACKED_TABLES.includes("whatsapp_conversations"), true);
    assert.equal(isRevertible("whatsapp_conversations"), false);
    assert.equal(isRevertible("clinic_chat_threads"), false);
  });

  it("excludes role_permissions (composite key, no single row id)", () => {
    assert.equal(TRACKED_TABLES.includes("role_permissions"), true);
    assert.equal(isRevertible("role_permissions"), false);
  });

  it("rejects a table that isn't tracked at all", () => {
    assert.equal(isRevertible("hero"), false);
    assert.equal(isRevertible("services"), false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/system_log/revertPolicy.test.ts`
Expected: FAIL — `Cannot find module './revertPolicy.ts'`.

- [ ] **Step 3: Write the implementation**

Create `src/services/system_log/revertPolicy.ts`:

```ts
/**
 * Every table the system_action_log trigger is attached to, and which of
 * those support one-click revert. Kept as two lists (not one) because a
 * table can be tracked without being safe to revert — see
 * docs/superpowers/specs/2026-09-14-system-action-log-design.md.
 */
export const TRACKED_TABLES = [
  "reservations",
  "appointment_slots",
  "clinic_hours",
  "doctor_hours",
  "clinic_cdt_fees",
  "clinic_treatment_presets",
  "patient_profiles",
  "patient_clinical_notes",
  "patient_treatments",
  "patient_imaging",
  "patient_tooth_notes",
  "patient_tooth_note_attachments",
  "patient_tooth_surfaces",
  "profiles",
  "roles",
  "permissions",
  "role_permissions",
  "whatsapp_conversations",
  "clinic_chat_threads",
] as const;

export type TrackedTable = (typeof TRACKED_TABLES)[number];

/** Tracked, but excluded from revert: composite key or no external system to stay in sync with. */
const NOT_REVERTIBLE = new Set<TrackedTable>([
  "role_permissions",
  "whatsapp_conversations",
  "clinic_chat_threads",
]);

export function isRevertible(table: string): boolean {
  return (
    (TRACKED_TABLES as readonly string[]).includes(table) &&
    !NOT_REVERTIBLE.has(table as TrackedTable)
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/system_log/revertPolicy.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/system_log/revertPolicy.ts src/services/system_log/revertPolicy.test.ts
git commit -m "$(cat <<'EOF'
feat(system-log): revert policy — the tracked-tables list minus messaging

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `listSystemActions`

**Files:**
- Create: `src/services/system_log/listActions.ts`
- Test: `src/services/system_log/listActions.test.ts`

**Interfaces:**
- Consumes: `isRevertible` (Task 4), `SupabaseClient<Database>` from `@supabase/supabase-js` / `@/lib/supabase/database.types`.
- Produces: `SystemActionOperation`, `SystemActionRow`, `listSystemActions(db, opts): Promise<{ rows: SystemActionRow[]; nextCursor: string | null }>` — used by the GET route (Task 7) and the UI (Task 10).

- [ ] **Step 1: Write the failing test**

Create `src/services/system_log/listActions.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { listSystemActions } from "./listActions.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../admin_ai/testing/fakeDb.ts";

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: "e1",
    table_name: "reservations",
    row_id: "r1",
    operation: "update",
    actor_id: "u1",
    before: { status: "confirmed" },
    after: { status: "cancelled" },
    created_at: "2026-09-15T00:00:00.000Z",
    reverted_at: null,
    reverted_by: null,
    ...overrides,
  };
}

describe("listSystemActions", () => {
  it("returns newest-first entries, marking revertible ones", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [
          entry({ id: "e1", created_at: "2026-09-15T00:00:00.000Z", table_name: "reservations" }),
          entry({ id: "e2", created_at: "2026-09-14T00:00:00.000Z", table_name: "whatsapp_conversations" }),
        ],
      },
    });

    const { rows, nextCursor } = await listSystemActions(db, {});

    assert.equal(rows.length, 2);
    assert.equal(rows[0].id, "e1");
    assert.equal(rows[0].revertible, true);
    assert.equal(rows[1].id, "e2");
    assert.equal(rows[1].revertible, false);
    assert.equal(nextCursor, null);
  });

  it("marks an already-reverted entry as not revertible", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [entry({ reverted_at: "2026-09-15T01:00:00.000Z" })],
      },
    });

    const { rows } = await listSystemActions(db, {});
    assert.equal(rows[0].revertible, false);
  });

  it("filters by table and operation", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [
          entry({ id: "e1", table_name: "reservations", operation: "update" }),
          entry({ id: "e2", table_name: "patient_profiles", operation: "delete" }),
        ],
      },
    });

    const byTable = await listSystemActions(db, { table: "patient_profiles" });
    assert.deepEqual(byTable.rows.map((r: { id: string }) => r.id), ["e2"]);

    const byOperation = await listSystemActions(db, { operation: "delete" });
    assert.deepEqual(byOperation.rows.map((r: { id: string }) => r.id), ["e2"]);
  });

  it("paginates with a created_at cursor, one page ahead to detect more", async () => {
    const db = createFakeDb({
      tables: {
        system_action_log: [
          entry({ id: "e1", created_at: "2026-09-15T00:00:00.000Z" }),
          entry({ id: "e2", created_at: "2026-09-14T00:00:00.000Z" }),
          entry({ id: "e3", created_at: "2026-09-13T00:00:00.000Z" }),
        ],
      },
    });

    const { rows, nextCursor } = await listSystemActions(db, { limit: 2 });
    assert.deepEqual(rows.map((r: { id: string }) => r.id), ["e1", "e2"]);
    assert.equal(nextCursor, "2026-09-14T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/system_log/listActions.test.ts`
Expected: FAIL — `Cannot find module './listActions.ts'`.

- [ ] **Step 3: Write the implementation**

Create `src/services/system_log/listActions.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isRevertible } from "./revertPolicy";

export type SystemActionOperation = "insert" | "update" | "delete";

export type SystemActionRow = {
  id: string;
  table_name: string;
  row_id: string;
  operation: SystemActionOperation;
  actor_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
  reverted_at: string | null;
  reverted_by: string | null;
  revertible: boolean;
};

const DEFAULT_LIMIT = 20;

/**
 * Read-only, cursor-paginated history for /admin/system-log — every tracked
 * write, newest first. `revertible` is computed here from revertPolicy.ts
 * (not trusted from a stored flag), so that stays the single source of truth.
 */
export async function listSystemActions(
  db: SupabaseClient<Database>,
  opts: {
    table?: string;
    operation?: SystemActionOperation;
    cursor?: string;
    limit?: number;
  },
): Promise<{ rows: SystemActionRow[]; nextCursor: string | null }> {
  const limit = opts.limit ?? DEFAULT_LIMIT;

  let query = db
    .from("system_action_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (opts.table) query = query.eq("table_name", opts.table);
  if (opts.operation) query = query.eq("operation", opts.operation);
  if (opts.cursor) query = query.lt("created_at", opts.cursor);

  const { data, error } = await query;
  if (error) throw error;

  const entries = data ?? [];
  const hasMore = entries.length > limit;
  const page = hasMore ? entries.slice(0, limit) : entries;
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  const rows: SystemActionRow[] = page.map((row) => ({
    id: row.id,
    table_name: row.table_name,
    row_id: row.row_id,
    operation: row.operation,
    actor_id: row.actor_id,
    before: (row.before ?? null) as Record<string, unknown> | null,
    after: (row.after ?? null) as Record<string, unknown> | null,
    created_at: row.created_at,
    reverted_at: row.reverted_at,
    reverted_by: row.reverted_by,
    revertible: isRevertible(row.table_name) && !row.reverted_at,
  }));

  return { rows, nextCursor };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/system_log/listActions.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/system_log/listActions.ts src/services/system_log/listActions.test.ts
git commit -m "$(cat <<'EOF'
feat(system-log): listSystemActions — cursor-paginated read of the log

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `revertSystemAction` service wrapper

**Files:**
- Create: `src/services/system_log/revert.ts`
- Test: `src/services/system_log/revert.test.ts`

**Interfaces:**
- Produces: `revertSystemAction(db: SupabaseClient<Database>, logId: string): Promise<void>` — used by the POST route (Task 8).

- [ ] **Step 1: Write the failing test**

Create `src/services/system_log/revert.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { revertSystemAction } from "./revert.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../admin_ai/testing/fakeDb.ts";

describe("revertSystemAction", () => {
  it("calls the RPC with the log id", async () => {
    const db = createFakeDb();
    await revertSystemAction(db, "log-1");
    const calls = db.rpcCalls();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].fn, "revert_system_action");
    assert.deepEqual(calls[0].args, { p_log_id: "log-1" });
  });

  it("throws the RPC's error message on failure", async () => {
    const db = createFakeDb({
      rpc: { revert_system_action: { data: null, error: { message: "Already reverted" } } },
    });
    await assert.rejects(() => revertSystemAction(db, "log-1"), /Already reverted/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/system_log/revert.test.ts`
Expected: FAIL — `Cannot find module './revert.ts'`.

- [ ] **Step 3: Write the implementation**

Create `src/services/system_log/revert.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Thin wrapper so API routes never call db.rpc directly. */
export async function revertSystemAction(
  db: SupabaseClient<Database>,
  logId: string,
): Promise<void> {
  const { error } = await db.rpc("revert_system_action", { p_log_id: logId });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/system_log/revert.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/system_log/revert.ts src/services/system_log/revert.test.ts
git commit -m "$(cat <<'EOF'
feat(system-log): revertSystemAction service wrapper around the RPC

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `GET /api/v1/admin/system-log`

**Files:**
- Create: `src/app/api/v1/admin/system-log/route.ts`

**Interfaces:**
- Consumes: `requirePermission` (`@/lib/api/requirePermission`), `listSystemActions` (Task 5).
- Produces: `GET` handler returning `{ rows: SystemActionRow[], nextCursor: string | null }` — consumed by the UI (Task 10).

- [ ] **Step 1: Write the route**

Create `src/app/api/v1/admin/system-log/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { listSystemActions, type SystemActionOperation } from "@/services/system_log/listActions";

const OPERATIONS: SystemActionOperation[] = ["insert", "update", "delete"];

export async function GET(request: Request) {
  const auth = await requirePermission("system-log.view");
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const table = url.searchParams.get("table") ?? undefined;
  const operationParam = url.searchParams.get("operation");
  const operation = OPERATIONS.includes(operationParam as SystemActionOperation)
    ? (operationParam as SystemActionOperation)
    : undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const { rows, nextCursor } = await listSystemActions(auth.supabase, {
      table,
      operation,
      cursor,
    });
    return NextResponse.json({ rows, nextCursor });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load the system log" },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint src/app/api/v1/admin/system-log/route.ts`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/admin/system-log/route.ts
git commit -m "$(cat <<'EOF'
feat(system-log): GET /api/v1/admin/system-log list endpoint

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `POST /api/v1/admin/system-log/revert`

**Files:**
- Create: `src/app/api/v1/admin/system-log/revert/route.ts`

**Interfaces:**
- Consumes: `requirePermission`, `revertSystemAction` (Task 6).
- Produces: `POST` handler accepting `{ logId: string }`, returning `{ ok: true }` or a 4xx `{ error }` — consumed by the UI (Task 10).

- [ ] **Step 1: Write the route**

Create `src/app/api/v1/admin/system-log/revert/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import { revertSystemAction } from "@/services/system_log/revert";

const bodySchema = z.object({ logId: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await requirePermission("system-log.revert");
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await revertSystemAction(auth.supabase, parsed.data.logId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Revert failed" },
      { status: 409 },
    );
  }
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint src/app/api/v1/admin/system-log/revert/route.ts`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/v1/admin/system-log/revert/route.ts
git commit -m "$(cat <<'EOF'
feat(system-log): POST /api/v1/admin/system-log/revert endpoint

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Extract `useCursorLog`, refactor `AiActionsLog` onto it

**Files:**
- Create: `src/features/admin/hooks/useCursorLog.ts`
- Modify: `src/features/admin/components/admin-ai/AiActionsLog.tsx` (full replacement, see Step 3)

**Interfaces:**
- Produces: `CursorPage<T> = { rows: T[]; nextCursor: string | null }`, `useCursorLog<T>(filterKey: string, fetchPage: (cursor: string | null) => Promise<CursorPage<T>>, onError: () => void): { rows: T[] | null; nextCursor: string | null; loadingMore: boolean; loadMore: () => void }` — used by `AiActionsLog.tsx` here and `SystemActionLog.tsx` in Task 10.

- [ ] **Step 1: Write the hook**

Create `src/features/admin/hooks/useCursorLog.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

export type CursorPage<T> = { rows: T[]; nextCursor: string | null };

type LoadedPage<T> = { key: string; rows: T[]; nextCursor: string | null };

/**
 * Shared "cursor-paginated, filterable log" state machine behind both the
 * AI actions log and the system action log: fetch page one whenever the
 * filter changes, offer `loadMore` for subsequent pages, and treat a page
 * whose `key` doesn't match the current filter as still loading — this is
 * what keeps a synchronous setState out of the effect body (calling
 * setState directly inside an effect body triggers cascading renders the
 * react-hooks/set-state-in-effect lint rule flags).
 */
export function useCursorLog<T>(
  filterKey: string,
  fetchPage: (cursor: string | null) => Promise<CursorPage<T>>,
  onError: () => void,
) {
  const [page, setPage] = useState<LoadedPage<T> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchPage(null)
      .then((result) => {
        if (alive) setPage({ key: filterKey, rows: result.rows, nextCursor: result.nextCursor });
      })
      .catch(() => {
        if (alive) {
          setPage({ key: filterKey, rows: [], nextCursor: null });
          onError();
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilize by filterKey
  }, [filterKey]);

  const rows = page && page.key === filterKey ? page.rows : null;
  const nextCursor = page && page.key === filterKey ? page.nextCursor : null;

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await fetchPage(nextCursor);
      setPage((prev) =>
        prev && prev.key === filterKey
          ? { key: filterKey, rows: [...prev.rows, ...result.rows], nextCursor: result.nextCursor }
          : prev,
      );
    } catch {
      onError();
    } finally {
      setLoadingMore(false);
    }
  }

  return { rows, nextCursor, loadingMore, loadMore };
}
```

- [ ] **Step 2: Typecheck the new file in isolation**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean (the hook isn't imported anywhere yet, so this just confirms it's valid TS on its own).

- [ ] **Step 3: Refactor `AiActionsLog.tsx` to use the hook**

Replace the entire contents of `src/features/admin/components/admin-ai/AiActionsLog.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale, useTranslations, type AdminMessageKey } from "@/lib/i18n";
import { actionKindLabel } from "@/services/admin_ai/actionKindLabels";
import type { ProposalStatus } from "@/services/admin_ai/schemas";
import type { ProposalLogRow } from "@/services/admin_ai/listProposals";
import { diffFieldLines } from "../chat/reviewCardFormat";
import { AdminSkeleton } from "../AdminSkeleton";
import { useCursorLog, type CursorPage } from "../../hooks/useCursorLog";

const STATUS_FILTERS: (ProposalStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "cancelled",
  "expired",
  "failed",
];

const STATUS_BADGE_VARIANT: Record<ProposalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "secondary",
  expired: "secondary",
  failed: "destructive",
};

const STATUS_LABEL_KEY: Record<ProposalStatus | "all", AdminMessageKey> = {
  all: "admin.aiActions.status.all",
  pending: "admin.aiActions.status.pending",
  confirmed: "admin.aiActions.status.confirmed",
  cancelled: "admin.aiActions.status.cancelled",
  expired: "admin.aiActions.status.expired",
  failed: "admin.aiActions.status.failed",
};

const OUTCOME_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  proposed: "outline",
  confirmed: "default",
  cancelled: "secondary",
  failed: "destructive",
  stale: "secondary",
};

const OUTCOME_LABEL_KEY: Record<string, AdminMessageKey> = {
  proposed: "admin.aiActions.outcome.proposed",
  confirmed: "admin.aiActions.outcome.confirmed",
  cancelled: "admin.aiActions.outcome.cancelled",
  failed: "admin.aiActions.outcome.failed",
  stale: "admin.aiActions.outcome.stale",
};

async function fetchLog(
  status: ProposalStatus | "all",
  cursor: string | null,
): Promise<CursorPage<ProposalLogRow>> {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/v1/ai/admin-actions/log?${params.toString()}`);
  if (!res.ok) throw new Error("load failed");
  return (await res.json()) as CursorPage<ProposalLogRow>;
}

export function AiActionsLog() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [status, setStatus] = useState<ProposalStatus | "all">("all");
  const { rows, nextCursor, loadingMore, loadMore } = useCursorLog<ProposalLogRow>(
    status,
    (cursor) => fetchLog(status, cursor),
    () => toast.error(t("admin.aiActions.loadError")),
  );

  return (
    <div className="space-y-3" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={status === option ? "default" : "outline"}
            onClick={() => setStatus(option)}
          >
            {t(STATUS_LABEL_KEY[option])}
          </Button>
        ))}
      </div>

      {rows === null ? (
        <div aria-busy="true" className="space-y-3">
          <span className="sr-only">{t("admin.aiActions.loading")}</span>
          {[0, 1, 2].map((card) => (
            <Card key={card} className="gap-2 p-4">
              <AdminSkeleton className="h-4 w-56" />
              <AdminSkeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.aiActions.empty")}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ProposalCard key={row.id} row={row} locale={locale} t={t} />
          ))}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center pt-2">
          <Button type="button" size="sm" variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
            {t("admin.aiActions.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ProposalCard({
  row,
  locale,
  t,
}: {
  row: ProposalLogRow;
  locale: "en" | "ar";
  t: (key: AdminMessageKey) => string;
}) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{t(STATUS_LABEL_KEY[row.status])}</Badge>
        <span className="font-mono">{row.source}</span>
        {row.patient_key ? <span className="font-mono">{row.patient_key}</span> : null}
        <span>{new Date(row.created_at).toLocaleString(locale === "ar" ? "ar" : "en")}</span>
      </div>

      {row.summary ? (
        <p className="text-sm text-[var(--admin-text)]" dir="auto">
          {row.summary}
        </p>
      ) : null}

      {row.diffs.length ? (
        <ul className="space-y-2">
          {row.diffs.map((diff) => {
            const fields = diffFieldLines(diff);
            return (
              <li key={diff.actionId} className="rounded-lg border bg-[var(--admin-hover)] px-2.5 py-2 text-xs">
                <p className="font-medium">{actionKindLabel(diff.kind, locale)}</p>
                <p className="text-[11px] text-muted-foreground">{diff.target}</p>
                {fields.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {fields.map((f) => (
                      <li key={f.field} className="text-[11px] text-[var(--admin-text)]">
                        <span className="text-muted-foreground">{f.field}: </span>
                        <span className="text-muted-foreground line-through">{f.before}</span>
                        {" → "}
                        <span className="font-medium">{f.after}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {row.auditEvents.length ? (
        <div className="flex flex-wrap gap-1.5">
          {row.auditEvents.map((event) => (
            <Badge key={event.id} variant={OUTCOME_BADGE_VARIANT[event.outcome] ?? "outline"} title={event.error_message ?? undefined}>
              {actionKindLabel(event.action_kind, locale)}:{" "}
              {OUTCOME_LABEL_KEY[event.outcome] ? t(OUTCOME_LABEL_KEY[event.outcome]) : event.outcome}
            </Badge>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint src/features/admin/hooks/useCursorLog.ts src/features/admin/components/admin-ai/AiActionsLog.tsx`
Expected: both clean. This is a pure refactor — no behavior change, so no test assertions change; the existing `listProposals.test.ts` (unaffected, it doesn't import this file) must still pass:

Run: `GITHUB_TOKEN=x yarn test`
Expected: all tests still pass (same count as before this task).

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/hooks/useCursorLog.ts src/features/admin/components/admin-ai/AiActionsLog.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): extract useCursorLog from AiActionsLog

Pulls the cursor-pagination/filter-loading state machine into a shared
hook so the new SystemActionLog component doesn't duplicate it. No
behavior change.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `SystemActionLog` component and page

**Files:**
- Create: `src/features/admin/components/system-log/SystemActionLog.tsx`
- Create: `src/app/(internal)/admin/(dashboard)/system-log/page.tsx`

**Interfaces:**
- Consumes: `useCursorLog` (Task 9), `TRACKED_TABLES` (Task 4), `SystemActionOperation`/`SystemActionRow` (Task 5), `diffFieldLines` (existing, `@/features/admin/components/chat/reviewCardFormat`), `requirePagePermission` (existing).

- [ ] **Step 1: Write the component**

Create `src/features/admin/components/system-log/SystemActionLog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale, useTranslations } from "@/lib/i18n";
import { TRACKED_TABLES } from "@/services/system_log/revertPolicy";
import type { SystemActionOperation, SystemActionRow } from "@/services/system_log/listActions";
import { diffFieldLines } from "../chat/reviewCardFormat";
import { AdminSkeleton } from "../AdminSkeleton";
import { useCursorLog, type CursorPage } from "../../hooks/useCursorLog";

const OPERATIONS: SystemActionOperation[] = ["insert", "update", "delete"];

async function fetchLog(
  table: string,
  operation: string,
  cursor: string | null,
): Promise<CursorPage<SystemActionRow>> {
  const params = new URLSearchParams();
  if (table) params.set("table", table);
  if (operation) params.set("operation", operation);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/v1/admin/system-log?${params.toString()}`);
  if (!res.ok) throw new Error("load failed");
  return (await res.json()) as CursorPage<SystemActionRow>;
}

export function SystemActionLog({ canRevert }: { canRevert: boolean }) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [table, setTable] = useState("");
  const [operation, setOperation] = useState("");
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [revertedIds, setRevertedIds] = useState<Set<string>>(new Set());

  const filterKey = `${table}:${operation}`;
  const { rows, nextCursor, loadingMore, loadMore } = useCursorLog<SystemActionRow>(
    filterKey,
    (cursor) => fetchLog(table, operation, cursor),
    () => toast.error(t("admin.systemLog.loadError")),
  );

  async function revert(id: string) {
    if (!window.confirm(t("admin.systemLog.confirmRevert"))) return;
    setRevertingId(id);
    try {
      const res = await fetch("/api/v1/admin/system-log/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: id }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error ?? t("admin.systemLog.revertFailed"));
      setRevertedIds((prev) => new Set(prev).add(id));
      toast.success(t("admin.systemLog.reverted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.systemLog.revertFailed"));
    } finally {
      setRevertingId(null);
    }
  }

  return (
    <div className="space-y-3" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-wrap gap-2">
        <select
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
          value={table}
          onChange={(e) => setTable(e.target.value)}
        >
          <option value="">{t("admin.systemLog.allTables")}</option>
          {TRACKED_TABLES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="h-8 rounded-md border bg-transparent px-2 text-sm"
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
        >
          <option value="">{t("admin.systemLog.allOperations")}</option>
          {OPERATIONS.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>

      {rows === null ? (
        <div aria-busy="true" className="space-y-3">
          <span className="sr-only">{t("admin.systemLog.loading")}</span>
          {[0, 1, 2].map((card) => (
            <Card key={card} className="gap-2 p-4">
              <AdminSkeleton className="h-4 w-56" />
              <AdminSkeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.systemLog.empty")}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const fields = diffFieldLines({ before: row.before ?? {}, after: row.after ?? {} });
            const reverted = Boolean(row.reverted_at) || revertedIds.has(row.id);
            return (
              <Card key={row.id} className="gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded border px-1.5 py-0.5 font-mono">{row.table_name}</span>
                  <span className="rounded border px-1.5 py-0.5 font-mono">{row.operation}</span>
                  <span className="font-mono">{row.row_id}</span>
                  <span>{new Date(row.created_at).toLocaleString(locale === "ar" ? "ar" : "en")}</span>
                  {reverted ? <Badge variant="secondary">{t("admin.systemLog.revertedBadge")}</Badge> : null}
                </div>

                {fields.length ? (
                  <ul className="space-y-1 text-xs">
                    {fields.map((f) => (
                      <li key={f.field}>
                        <span className="text-muted-foreground">{f.field}: </span>
                        <span className="text-muted-foreground line-through">{f.before}</span>
                        {" → "}
                        <span className="font-medium">{f.after}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {canRevert && row.revertible && !reverted ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={revertingId === row.id}
                      onClick={() => void revert(row.id)}
                    >
                      {t("admin.systemLog.revert")}
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center pt-2">
          <Button type="button" size="sm" variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
            {t("admin.systemLog.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Write the page**

Create `src/app/(internal)/admin/(dashboard)/system-log/page.tsx`:

```tsx
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { SystemActionLog } from "@/features/admin/components/system-log/SystemActionLog";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSystemLogPage() {
  const session = await requirePagePermission("system-log.view");
  const canRevert = session.permissions.has("system-log.revert");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.systemLog.title"
        descriptionKey="admin.pages.systemLog.description"
      />
      <SystemActionLog canRevert={canRevert} />
    </AdminPageMotion>
  );
}
```

- [ ] **Step 3: Add the i18n keys these reference**

In `src/lib/i18n/messages/admin/en.ts`, find the line `"admin.pages.aiActions.description": "Every action the AI assistant has proposed across the clinic, its summary, what it would change, and what happened to it.",` and add immediately after it:

```ts
  "admin.pages.systemLog.title": "System log",
  "admin.pages.systemLog.description": "Every reservation, patient, and access change made by staff — who did it, what changed, and a one-click way to undo it.",
```

Find the line `"admin.aiActions.loadMore": "Load more",` and add immediately after it:

```ts
  "admin.systemLog.allTables": "All tables",
  "admin.systemLog.allOperations": "All operations",
  "admin.systemLog.loading": "Loading the system log…",
  "admin.systemLog.loadError": "Could not load the system log",
  "admin.systemLog.empty": "No actions logged yet.",
  "admin.systemLog.loadMore": "Load more",
  "admin.systemLog.confirmRevert": "Revert this action? This writes the previous value back immediately.",
  "admin.systemLog.revert": "Revert",
  "admin.systemLog.reverted": "Reverted",
  "admin.systemLog.revertFailed": "Could not revert this action",
  "admin.systemLog.revertedBadge": "Reverted",
```

In `src/lib/i18n/messages/admin/ar.ts`, find the matching `"admin.pages.aiActions.description": ...` line and add immediately after it:

```ts
  "admin.pages.systemLog.title": "سجل النظام",
  "admin.pages.systemLog.description": "كل تغيير في الحجوزات والمرضى والصلاحيات قام به الفريق — من قام به، وما الذي تغيّر، وطريقة للتراجع عنه بضغطة واحدة.",
```

Find the matching `"admin.aiActions.loadMore": "تحميل المزيد",` line and add immediately after it:

```ts
  "admin.systemLog.allTables": "كل الجداول",
  "admin.systemLog.allOperations": "كل العمليات",
  "admin.systemLog.loading": "جارٍ تحميل سجل النظام…",
  "admin.systemLog.loadError": "تعذّر تحميل سجل النظام",
  "admin.systemLog.empty": "لا توجد إجراءات مسجّلة بعد.",
  "admin.systemLog.loadMore": "تحميل المزيد",
  "admin.systemLog.confirmRevert": "التراجع عن هذا الإجراء؟ سيتم إرجاع القيمة السابقة فورًا.",
  "admin.systemLog.revert": "تراجع",
  "admin.systemLog.reverted": "تم التراجع",
  "admin.systemLog.revertFailed": "تعذّر التراجع عن هذا الإجراء",
  "admin.systemLog.revertedBadge": "تم التراجع",
```

(If the exact `admin.aiActions.*` lines have shifted slightly since this plan was written, search for the nearest matching key instead of the line number.)

- [ ] **Step 4: Typecheck, lint, build**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint src/features/admin/components/system-log/SystemActionLog.tsx "src/app/(internal)/admin/(dashboard)/system-log/page.tsx" && GITHUB_TOKEN=x yarn build`
Expected: all three clean, and the build's route list includes `/admin/system-log` and `/api/v1/admin/system-log`.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/system-log/SystemActionLog.tsx "src/app/(internal)/admin/(dashboard)/system-log/page.tsx" src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "$(cat <<'EOF'
feat(admin): system action log page at /admin/system-log

Table/operation filters, cursor pagination, per-entry diff, and a
Revert button gated on the system-log.revert permission and each
row's revertible flag from revertPolicy.ts.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Sidebar — "Logs" group with System + AI actions

**Files:**
- Modify: `src/features/admin/lib/adminNav.ts`

- [ ] **Step 1: Move `ai-actions` into a new "Logs" group, add `system-log`**

In `src/features/admin/lib/adminNav.ts`, find (inside `adminNavSections`, the `"site"` section):

```ts
      { href: "/admin/assist-analytics", labelKey: "admin.nav.assistAnalytics", permission: "assist-analytics.view" },
      { href: "/admin/ai-actions", labelKey: "admin.nav.aiActions", permission: "ai-actions.view" },
    ],
    groups: [
      {
        id: "settings",
```

Replace it with:

```ts
      { href: "/admin/assist-analytics", labelKey: "admin.nav.assistAnalytics", permission: "assist-analytics.view" },
    ],
    groups: [
      {
        id: "logs",
        labelKey: "admin.nav.logs",
        defaultOpen: false,
        items: [
          { href: "/admin/system-log", labelKey: "admin.nav.systemLog", permission: "system-log.view" },
          { href: "/admin/ai-actions", labelKey: "admin.nav.aiActions", permission: "ai-actions.view" },
        ],
      },
      {
        id: "settings",
```

- [ ] **Step 2: Add the page label and permission map entries**

Find `"/admin/ai-actions": "admin.nav.aiActions",` in `adminPageLabelKeys` and add immediately after it:

```ts
  "/admin/system-log": "admin.nav.systemLog",
```

Find `"/admin/ai-actions": "ai-actions.view",` in `adminPagePermissions` and add immediately after it:

```ts
  "/admin/system-log": "system-log.view",
```

- [ ] **Step 3: Add the two new nav label keys**

In `src/lib/i18n/messages/admin/en.ts`, find `"admin.nav.aiActions": "AI actions log",` and add immediately after it:

```ts
  "admin.nav.logs": "Logs",
  "admin.nav.systemLog": "System log",
```

In `src/lib/i18n/messages/admin/ar.ts`, find `"admin.nav.aiActions": "سجل إجراءات الذكاء الاصطناعي",` and add immediately after it:

```ts
  "admin.nav.logs": "السجلات",
  "admin.nav.systemLog": "سجل النظام",
```

- [ ] **Step 4: Typecheck and lint**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint src/features/admin/lib/adminNav.ts`
Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/lib/adminNav.ts src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "$(cat <<'EOF'
feat(admin): group AI actions + System log under a "Logs" sidebar entry

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Fix e2e admin seed to carry RBAC permissions, then e2e-verify the log + revert

**Why this fix is needed:** `e2e/helpers/seed.ts`'s `ensureUser` sets the legacy `profiles.role` text column but never `profiles.role_id`. `resolveSessionPermissions` (`src/lib/auth/permissions.ts`) requires `profile.role_id` and returns an *empty* permission set without it. This means the seeded e2e admin currently passes only the coarse `is_admin()` check and has **zero** granular permissions — every page/route gated by `requirePagePermission`/`requirePermission` (including `/admin/ai-actions` and this task's `/admin/system-log`) is invisible to it. Every existing e2e spec predates the RBAC system and only exercises `requireAdmin()`-gated routes, so this has never been hit before.

**Files:**
- Modify: `e2e/helpers/seed.ts`
- Create: `e2e/system-log.spec.ts`

- [ ] **Step 1: Fix `ensureUser` to set `role_id` for the admin fixture**

In `e2e/helpers/seed.ts`, replace:

```ts
async function ensureUser(
  db: ReturnType<typeof serviceClient>,
  email: string,
  password: string,
  role: "admin" | "viewer",
) {
  const { data: list } = await db.auth.admin.listUsers();
  let user = list?.users.find((u) => u.email === email) ?? null;
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }
  // profiles.role is what public.is_admin() reads; a viewer row is what proves
  // the authorization fix works.
  await db.from("profiles").upsert(
    { id: user!.id, role, display_name: role, deleted_at: null },
    { onConflict: "id" },
  );
  return user!;
}
```

with:

```ts
async function ensureUser(
  db: ReturnType<typeof serviceClient>,
  email: string,
  password: string,
  role: "admin" | "viewer",
) {
  const { data: list } = await db.auth.admin.listUsers();
  let user = list?.users.find((u) => u.email === email) ?? null;
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }

  // profiles.role is the legacy flag public.is_admin() reads (a viewer row
  // proves the coarse authorization check works); profiles.role_id is what
  // the granular RBAC system (resolveSessionPermissions) requires — without
  // it the admin fixture would pass is_admin() but hold zero permissions.
  let roleId: string | null = null;
  if (role === "admin") {
    const { data: ownerRole } = await db
      .from("roles")
      .select("id")
      .eq("key", "owner")
      .maybeSingle();
    roleId = ownerRole?.id ?? null;
  }

  await db.from("profiles").upsert(
    { id: user!.id, role, role_id: roleId, display_name: role, deleted_at: null },
    { onConflict: "id" },
  );
  return user!;
}
```

- [ ] **Step 2: Write the e2e spec**

Create `e2e/system-log.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { serviceClient } from "./helpers/seed";
import { VIEWER_EMAIL } from "./helpers/env";

async function viewerProfileId(): Promise<string> {
  const db = serviceClient();
  const { data, error } = await db.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((u) => u.email === VIEWER_EMAIL);
  if (!user) throw new Error("viewer not seeded — run global setup first");
  return user.id;
}

test.describe("system action log", () => {
  test.beforeEach(async () => {
    const id = await viewerProfileId();
    await serviceClient().from("profiles").update({ deleted_at: null }).eq("id", id);
  });

  test("logs a profiles update, shows the diff, and reverts it", async ({ page }) => {
    const id = await viewerProfileId();

    const deactivate = await page.request.patch(`/api/v1/admin/accounts/${id}`, {
      data: { deleted: true },
    });
    expect(deactivate.ok()).toBe(true);

    await page.goto("/admin/system-log");
    await page.locator("select").first().selectOption("profiles");
    await expect(page.getByText("deleted_at", { exact: false }).first()).toBeVisible();

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Revert" }).first().click();
    await expect(page.getByRole("button", { name: "Revert" })).toHaveCount(0, { timeout: 10_000 });

    const { data: reverted } = await serviceClient()
      .from("profiles")
      .select("deleted_at")
      .eq("id", id)
      .single();
    expect(reverted?.deleted_at).toBeNull();
  });

  test("messaging metadata is logged but never shows a revert button", async ({ page }) => {
    await page.goto("/admin/system-log");
    await page.locator("select").first().selectOption("whatsapp_conversations");
    await expect(page.getByRole("button", { name: "Revert" })).toHaveCount(0);
  });

  test("a CMS table never appears in the system log", async ({ page }) => {
    const res = await page.request.get("/api/v1/admin/system-log?table=services");
    const body = await res.json();
    expect(body.rows).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the e2e suite**

Run: `GITHUB_TOKEN=x yarn e2e system-log.spec.ts`
Expected: all 3 tests pass. (This also re-runs `global.setup.ts`, which re-seeds through the fixed `ensureUser` — if any *other* spec that depends on granular permissions was silently broken before, it would start passing now too; if any spec depended on the admin fixture having *no* granular permissions, it would now fail — none currently do, since every existing spec predates the RBAC system.)

- [ ] **Step 4: Run the full e2e suite to check for regressions**

Run: `GITHUB_TOKEN=x yarn e2e`
Expected: all specs pass, same as before this task (the `ensureUser` change only adds a `role_id`, it doesn't change `role` or remove anything existing specs asserted on).

- [ ] **Step 5: Commit**

```bash
git add e2e/helpers/seed.ts e2e/system-log.spec.ts
git commit -m "$(cat <<'EOF'
fix(e2e): seed the admin fixture's role_id, add system-log e2e coverage

The e2e admin previously had profiles.role='admin' (passes the coarse
is_admin() check) but no role_id, so resolveSessionPermissions gave it
zero granular permissions — every requirePagePermission/requirePermission
route was invisible to it, undetected until now because no existing spec
touched the RBAC system. Backfills role_id to 'owner' for the admin
fixture, and adds e2e coverage for the new system log: an update on
profiles shows its diff and reverts, messaging metadata never shows a
revert button, and CMS writes never appear in this log at all.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** table + trigger (Task 1), revert RPC (Task 2), permissions (Task 3), revert policy as the single source of truth for both tracking and reverting (Task 4), read API (Tasks 5, 7), revert API (Tasks 6, 8), shared pagination hook + AI-log refactor (Task 9), system-log UI (Task 10), sidebar grouping (Task 11), e2e coverage including the CMS-exclusion and messaging-metadata-no-revert assertions from the spec's Testing section (Task 12). The e2e RBAC seed gap was discovered while writing Task 12 and is fixed in the same task, since the new e2e spec is what needs it.
- **Not covered by an automated test:** the trigger function's own SQL correctness (Task 1) and the revert RPC's dynamic SQL correctness (Task 2) can only be verified by `supabase db reset --local` succeeding plus the Task 12 e2e spec exercising a real revert — there's no way to unit-test Postgres trigger/function bodies in this repo's `node:test` setup.
- **Type consistency checked:** `SystemActionOperation`/`SystemActionRow` (Task 5) match the `Database["public"]["Tables"]["system_action_log"]` shape added in Task 1; `CursorPage<T>` (Task 9) is used identically by both `AiActionsLog` (Task 9) and `SystemActionLog` (Task 10); `isRevertible`/`TRACKED_TABLES` (Task 4) are the same names used by `listSystemActions` (Task 5) and referenced (by value, duplicated in SQL) by the RPC (Task 2).
