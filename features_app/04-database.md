# 04 · Database

## Migrations — apply in this order

| # | File | What it does |
|---|---|---|
| 1 | `20260911100000_patient_notifications.sql` | Tables `patient_notifications`, `patient_notification_settings` (starts `off`), `patient_notification_optouts` |
| 2 | `20260911110000_patient_notifications_trigger.sql` | Function + 2 triggers on `reservations` |
| 3 | `20260911120000_whatsapp_conversations_phone_suffix.sql` | Generated `phone_suffix` + index on conversations |
| 4 | `20260911130000_patient_notifications_cron_probe.sql` | Function so the app can see whether pg_cron is scheduled |
| 5 | `20260911140000_clinic_knowledge.sql` | `clinic_knowledge` + full-text search function + seed from FAQs/services |
| 6 | `20260911150000_whatsapp_ai_corrections.sql` | `whatsapp_ai_corrections` |
| 7 | `20260911160000_appointment_waitlist.sql` | `appointment_waitlist`, waitlist trigger, outbox gains `waitlist_id` + `slot_id` |
| 8 | `20260911170000_patient_notifications_recall_flag.sql` | `recall_enabled` switch (default false) |
| 9 | `20260911180000_patient_notifications_review_request.sql` | Allows kind `review_request` |

Every file starts with its own **Rollback** SQL.

Verified: `supabase db reset --local` from scratch applies all of them cleanly.

### Not a migration

`supabase/scripts/schedule_notifications_dispatch.sql` sets up pg_cron. It is
deliberately a hand-run script: `db reset` runs on every local start and in CI, and
a migration would make every laptop call production every minute. It does nothing
unless the Vault secret exists.

## New tables

| Table | Holds | Access |
|---|---|---|
| `patient_notifications` | The outbox: one row per message | admin only |
| `patient_notification_settings` | One row: mode, quiet hours, cap, lead, recall switch | admin only |
| `patient_notification_optouts` | Opted-out numbers, by last 8 digits | admin only |
| `clinic_knowledge` | Facts the assistant may state, EN + AR | admin only |
| `whatsapp_ai_corrections` | Assistant draft vs what staff sent | admin only |
| `appointment_waitlist` | Patients waiting for an earlier slot | admin only |

The dispatcher uses the service-role key, which bypasses these rules.

## Changed tables

| Table | Change |
|---|---|
| `whatsapp_conversations` | `phone_suffix` (generated) + index |
| `patient_notifications` | later gains `waitlist_id`, `slot_id` |

## Triggers

| Trigger | On | Calls |
|---|---|---|
| `reservations_notify_ins` | insert on `reservations` | `enqueue_patient_notifications()` |
| `reservations_notify_upd` | update of `starts_at`, `status`, `deleted_at` | same |
| `appointment_slots_offer_waitlist` | slot `booked` → `open` | `offer_freed_slot_to_waitlist()` |

Both trigger functions catch their own errors and only log a warning — a failure
can never cancel the booking or cancellation that fired them.

These are the **first triggers in this schema**.

## Functions callable by the app

| Function | Used by |
|---|---|
| `search_clinic_knowledge(p_query, p_limit)` | the assistant's knowledge lookup |
| `patient_notifications_cron_scheduled()` | the "what's missing" panel (null = cannot tell) |

## Traps hit while building (so nobody repeats them)

- A generated column must be **IMMUTABLE**. `to_tsvector('simple', …)` is not —
  cast it: `'simple'::regconfig`. `array_to_string()` and `text[]::text` are not
  either, which is why tags are not searchable.
- `websearch_to_tsquery` / `plainto_tsquery` **AND** their words; with the `simple`
  config that matches nothing for natural questions. OR the lexemes instead.
- `service_role` already has EXECUTE on every function in `public` through
  Supabase default privileges, even when a migration only grants
  `anon, authenticated`. That is not a bug.
