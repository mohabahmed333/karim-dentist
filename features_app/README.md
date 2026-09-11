# features_app — what was built, and how to run it

Everything added to The Dental Lounge app in the session of **11 September 2026**:
WhatsApp messages to patients about their appointments, and a smarter WhatsApp
assistant.

> **Status:** built, tested, and on local `main` — **25 commits, not pushed**.
> Nothing sends to patients yet. Every feature ships switched **off**.

## Read in this order

| File | What it covers |
|---|---|
| [01-patient-notifications.md](01-patient-notifications.md) | Booking confirmations and reminders: the core pipeline |
| [02-whatsapp-assistant.md](02-whatsapp-assistant.md) | Voice notes, cancel-by-reply, knowledge base, learning from staff |
| [03-waitlist-followups-recalls.md](03-waitlist-followups-recalls.md) | Waitlist, follow-ups, check-up recalls, review requests, STOP |
| [04-database.md](04-database.md) | Every migration, table, trigger and function |
| [05-admin-pages-and-api.md](05-admin-pages-and-api.md) | Every screen and API route |
| [06-go-live-checklist.md](06-go-live-checklist.md) | **What must happen before a patient gets a message** |
| [07-decisions-and-known-gaps.md](07-decisions-and-known-gaps.md) | Why things are built this way, and what is not done |
| [08-commit-log.md](08-commit-log.md) | All 25 commits, in order |
| [MERGE_INSTRUCTIONS.md](MERGE_INSTRUCTIONS.md) | **Paste this to the other Claude session** to merge its branch safely |

## In one picture

```
Booking (website / admin / AI / WhatsApp bot)
   │
   ▼  Postgres trigger, inside the booking transaction
patient_notifications  ──── the outbox (one row per message to send)
   │
   ▼  pg_cron every minute → /api/v1/notifications/dispatch
Dispatcher: claim → policy (quiet hours, opt-out, cap…) → template → WhatsApp
   │
   ▼
Patient replies on WhatsApp ──► WhatsApp assistant (processJob)
                                 knowledge base · voice notes · cancel-by-reply
```

## Where staff find things

| Page | Purpose |
|---|---|
| `/admin/settings` → **Patient notifications** tab | The on/off switch, and a list of what is still missing |
| `/admin/outbox` | Every queued message, what happened to it, opt-outs |
| `/admin/waitlist` | Patients waiting for an earlier appointment |
| `/admin/knowledge` | Facts the assistant is allowed to tell patients |
| `/admin/assistant-review` | Drafts staff rewrote — where the assistant needs help |

These pages are reached by URL or the ⌘K command palette; they are not in the sidebar.

## Numbers

- 94 files changed, +7,331 lines
- 9 database migrations + 1 operator script
- 1,072 unit tests passing on `main` (955 when this work started); 1,082 once the other session's branch is merged
- Typecheck, lint and production build clean
