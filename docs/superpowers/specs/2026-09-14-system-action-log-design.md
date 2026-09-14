# System action log: design

- **Date:** 2026-09-14 (revised same day: CMS dropped from scope, revert widened to every remaining tracked table)
- **Status:** proposed
- **Area:** new admin subsystem — `/admin/system-log`, alongside the existing `/admin/ai-actions`

## Problem

The AI actions log (`/admin/ai-actions`, shipped just before this) only covers writes the AI assistant proposes. Every other admin write — a staff member editing a service price, changing a reservation, updating clinic settings — leaves no trail and can't be undone. There is also no generic audit mechanism in the codebase: all 31 `src/services/*/mutations.ts` files call Supabase directly, with no shared layer to hook into.

## Goals

1. Log every write (insert/update/delete) across the admin-editable resource tables *outside the CMS*, with who did it and the full before/after row.
2. Let staff revert **any** logged action with one click — no curated subset; every tracked table gets a revert button.
3. Keep this fully separate from the AI actions log (different data, different lifecycle) but discoverable together in the sidebar.

## Non-goals

- **CMS is out of scope entirely** — `hero`, `about`, `callouts`, `site_settings`, `services`, `case_studies`, `featured_projects`, `clients`, `experience_entries`, `faqs`, `footer_links`, `social_links`, `clinic_knowledge`, `gallery_*`, `about_trust_items`, `solution_panels`. Not logged, not revertible here. (Customize already has its own client-side undo stack — `src/features/customize/context/editHistory.ts`.)
- Logging raw message/webhook content (`whatsapp_messages`, `whatsapp_webhook_events`, `clinic_chat_messages`) — noise, not "actions."
- A review/confirm step before revert (that's what the AI proposal flow is for). Revert here is destructive-immediate, gated by permission and a staleness check.
- Retroactive logging — the log starts from whenever this migration runs. Nothing before that is recoverable.

## Known risk, accepted

Revert now applies uniformly, including tables where writing the "before" row back doesn't undo everything the original action did:
- **`reservations`/`appointment_slots`/`clinic_hours`/`doctor_hours`:** reverting a cancellation doesn't check whether the freed slot was rebooked since; reverting clinic/doctor hours doesn't re-run slot regeneration, so hours and generated slots can drift apart.
- **`roles`/`permissions`/`role_permissions`/`profiles`:** reverting a role or permission change is itself a security-relevant action — it can silently re-grant or re-revoke access.

This is an explicit trade-off for simplicity over building per-table-safe revert logic. Every revert is itself logged (so drift is traceable and, in principle, reversible), and the staleness check in the RPC catches the most common conflict (someone else edited the same row in the meantime) even though it can't catch a side effect that landed on a *different* row.

## Decisions

- **Capture mechanism: a generic Postgres trigger**, not per-file JS instrumentation. Every mutation already runs through the RLS-enforced session client (verified: `services`, `reservations`, `site_settings`, `patient_profiles`, `roles` mutations all take the cookie-based client; only `accounts.createAccount`'s one `profiles` upsert uses the service-role client, so that single write logs a null actor). `auth.uid()` inside a trigger body is an already-proven pattern in this codebase (`is_admin()`, `enqueue_patient_notifications()`). This means zero changes to the 31 mutation files, and no future write path can accidentally skip logging.
- **Tracked-tables list is the only allowlist** — the same `Set` of table names gates both "does this show up in the log" and "can this be reverted" (no separate curated revert subset). It's checked both in the API route and again inside the revert SQL function (defense in depth, since the function takes a dynamic table name). Adding a table later is a one-line change + review, not a migration.
- **Kept separate from `ai_action_proposals`/`ai_action_audit_events`** — different shape (this is raw before/after JSON per row; AI proposals carry a summary, multi-action bundles, and a confirm/cancel lifecycle). Both surface under a new "Logs" nav group.

## Data

**Migration `20260915000000_system_action_log.sql`:**

```sql
create table system_action_log (
  id           uuid primary key default gen_random_uuid(),
  table_name   text not null,
  row_id       text not null,
  operation    text not null check (operation in ('insert','update','delete')),
  actor_id     uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz not null default now(),
  reverted_at  timestamptz,
  reverted_by  uuid
);
create index on system_action_log (created_at desc);
create index on system_action_log (table_name, created_at desc);
```

**Trigger function `public.log_system_action()`** (`plpgsql`, `security definer`): reads `TG_TABLE_NAME`, `TG_OP`, `TG_ARGV[0]` (PK column name, default `'id'`), builds `to_jsonb(OLD)`/`to_jsonb(NEW)`, resolves `row_id` from the PK column via `->>`, and inserts one row. Runs `AFTER INSERT OR UPDATE OR DELETE ... FOR EACH ROW`.

**Attached to** (all default PK `id`, except `doctor_hours` → `doctor_id`) — every one of these is also revertible, no further curation:

| Group | Tables |
|---|---|
| Clinic ops | `reservations`, `appointment_slots`, `clinic_hours`, `doctor_hours`, `clinic_cdt_fees`, `clinic_treatment_presets` |
| Patients / clinical | `patient_profiles`, `patient_clinical_notes`, `patient_treatments`, `patient_imaging`, `patient_tooth_notes`, `patient_tooth_note_attachments`, `patient_tooth_surfaces` |
| Access | `profiles`, `roles`, `permissions`, `role_permissions` |
| Messaging metadata | `whatsapp_conversations`, `clinic_chat_threads` |

Excluded entirely: every CMS table (see Non-goals) and the raw content tables `whatsapp_messages`, `whatsapp_webhook_events`, `clinic_chat_messages`.

**Revert policy**, defined in `src/services/system_log/revertPolicy.ts`: `isRevertible(table)` is just membership in the same tracked-tables list above — kept as its own module (rather than inlined) so the two concerns — "what do we track" and "what can be undone" — stay easy to split apart again later if a table in this list turns out to need the old curated treatment.

## Revert mechanism

**RPC `revert_system_action(p_log_id uuid)`** (`plpgsql`, `security definer`):
1. Load the log row; fail if already reverted, or table isn't in a hardcoded list of tracked tables duplicated inside the function (belt-and-braces against the dynamic SQL below ever being reachable for an untracked table, even if the API-layer check were bypassed).
2. **Staleness check:** for `update`/`delete` reverts, re-read the current row and compare it to `after` (update) or confirm it's still absent (nothing to compare for a delete-revert beyond "no row exists"); if the row moved on since, raise an error rather than clobber a newer edit — mirrors the `snapshot_hash` staleness check `ai_action_proposals` already does.
3. Apply the inverse via `format()`-built dynamic SQL: `insert`→delete the row, `update`→write `before` back, `delete`→re-insert `before`.
4. Mark the log row `reverted_at`/`reverted_by`.
5. The revert itself fires the same trigger, so it's logged too (a fresh `update`/`insert`/`delete` row pointing at the same `table_name`/`row_id`).

**API:** `POST /api/v1/admin/system-log/revert { logId }`, gated by `requirePermission("system-log.revert")`, then calls the RPC and surfaces its error message on conflict (409) vs. success (200).

## Permissions

New catalog entries: `system-log.view`, `system-log.revert` — both granted to `owner`; `view` only, not `revert`, could later go to a lower-trust role.

## Backend

- `src/services/system_log/listActions.ts`: `listSystemActions(db, { table?, operation?, cursor, limit })` — same cursor-on-`created_at` shape as `listAiActionProposals`.
- `src/services/system_log/revert.ts`: thin wrapper calling the RPC, typed result.
- `src/services/system_log/revertPolicy.ts`: the tracked-tables `Set` + `isRevertible(table)`.
- **Shared with the AI log:** extract the cursor-pagination/status-filter fetch loop currently inlined in `AiActionsLog.tsx` into a small hook, `useCursorLog<T>(fetchPage)`, used by both `AiActionsLog` and the new `SystemActionLog` component — the two components were about to duplicate the same loading-state dance verbatim.
- Diff rendering reuses the existing pure `changedKeys` (`src/services/admin_ai/diff.ts`) and the value-formatting half of `diffFieldLines` (`src/features/admin/components/chat/reviewCardFormat.ts`), generalized to take raw `before`/`after` JSON instead of an `ActionDiff`.

## UI

- New page `src/app/(internal)/admin/(dashboard)/system-log/page.tsx` + `SystemActionLog.tsx` component: table filter (dropdown, grouped as above), operation filter, cursor pagination, one card per row (actor, table, operation, timestamp, before→after diff), a **Revert** button when `isRevertible(...)` and the viewer has `system-log.revert` — with a native `confirm()` before firing (immediate, no separate review screen, per the "one-click" decision, but a stray click shouldn't silently rewrite data).
- **Nav:** replace the standalone "AI actions log" link with a **Logs** group (same level, under Site) containing two children: **System** (`/admin/system-log`) and **AI actions** (`/admin/ai-actions`, unchanged).
- i18n additions in both `en.ts`/`ar.ts` for the new page, group label, and table/operation names.

## Error handling

- Trigger failure must never block the underlying write — logging is `AFTER` on the same transaction, so if `log_system_action()` itself errors, the whole write rolls back. To avoid that, the function is defensive (never raises on missing/odd data; a jsonb-serialization edge case degrades to a partial `before`/`after` rather than failing the trigger).
- Revert conflict (row changed since) → 409 with a message identifying what changed; UI shows a toast and refreshes that entry's row from a re-fetch rather than assuming success.
- Revert on an already-reverted entry → RPC no-ops with an error; button is hidden client-side once `reverted_at` is set, but the RPC re-checks server-side regardless.

## Delivery

Three PRs, in order (each depends on the previous):
1. **Database:** `system_action_log` table, trigger function, attach to all tables, `revert_system_action` RPC, `system-log.view`/`system-log.revert` permissions.
2. **Backend:** `listSystemActions`, `revertPolicy`, revert service + API route, `useCursorLog` extraction (refactor `AiActionsLog` onto it, no behavior change).
3. **UI:** `system-log` page, nav restructuring into the "Logs" group, i18n.

## Testing

- **Unit:** `listActions.test.ts` (fakeDb, mirrors `listProposals.test.ts`), `revertPolicy.test.ts` (allowlist membership), `useCursorLog` behavior via a small component test if the harness supports it, otherwise covered by the existing manual pattern used for `AiActionsLog`.
- **The trigger and RPC themselves can't be unit-tested** (no DB in `node:test`) — covered by a new e2e spec, `e2e/system-log.spec.ts`, against local Supabase:
  1. Edit a patient profile field via the admin UI → a matching `update` row appears in `/admin/system-log` with the correct before/after.
  2. Click Revert on it → the field is back to the original, and the log shows a second entry (the revert itself).
  3. Cancel a reservation → log shows an `update` row with `before` populated; Revert restores its prior status.
  4. Editing a CMS table (e.g. a service) produces no system-log entry at all — confirms the exclusion.
  5. Reverting the same entry twice: the second attempt is rejected (button already hidden, but also assert the API returns non-200 if hit directly).
