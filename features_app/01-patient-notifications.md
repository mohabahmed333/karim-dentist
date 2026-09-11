# 01 · Patient notifications — confirmations and reminders

## The problem it solves

Before this, **no booking sent the patient anything**. `/api/v1/booking` returned
an id and stopped. Worse, the WhatsApp assistant's prompt told it *"never claim a
booking succeeded — the system confirms separately"*, and nothing confirmed
separately.

## How a message happens

```
reservations INSERT / UPDATE
  → enqueue_patient_notifications()   Postgres trigger, same transaction as the booking
  → patient_notifications row          status = pending, scheduled_for = when to send

pg_cron (every minute)
  → POST /api/v1/notifications/dispatch   (Authorization: Bearer CRON_SECRET)
  → sweepExpiredLeases                   free or abandon dead claims
  → enqueueFollowupsAndRecalls           time-based messages (see file 03)
  → findDue + claim                      conditional UPDATE acts as a lock
  → evaluateDispatchPolicy               skip | defer | send
  → resolveOrCreateConversation          only for a real send
  → markSendStarted                      ALWAYS before calling WhatsApp
  → sendWhatsappMessage(template, senderKind 'system')
```

## Why a trigger and not application code

Bookings reach the database four ways, and only three use an RPC. The admin panel
writes reservations **directly from the browser** (`createReservation`,
`updateReservation`, `rescheduleReservation`) at about ten call sites. Code-level
enqueueing would silently miss most real bookings. A trigger cannot be bypassed.

It is also transactional: if the booking fails ("slot no longer available"), its
notification disappears with it.

**A broken trigger can never break a booking.** The body runs inside a plpgsql
exception block that downgrades any failure to `RAISE WARNING`. Tested by forcing
every enqueue to fail: the booking still committed and nothing was queued.

## What the trigger queues

| Event on a reservation | Result |
|---|---|
| Booked, in the future | `confirmation` now + `reminder_24h` one lead ahead (only if that is more than 1 hour away) |
| Time changed | pending rows withdrawn, `reschedule` notice + a new reminder |
| Status → `cancelled` | pending rows withdrawn, `cancellation` |
| Soft-deleted | pending rows withdrawn, **nothing sent** (deleting is records tidying, not telling the patient) |
| Status → `completed` / `no_show` | pending reminders withdrawn |

Each row has a unique `dedupe_key` such as `<reservation>:reminder_24h:<epoch>`, so
a retry or double-click can never queue the same message twice, but a second
reschedule is correctly a new event.

## The dispatch policy — in order, first match wins

| # | Rule | Outcome |
|---|---|---|
| 1 | `mode = 'off'` | skip `mode_off` (not held, so switching on later does not blast a backlog) |
| 2 | WhatsApp credentials missing | defer 15 min `no_transport` |
| 3 | patient opted out | skip `opted_out` |
| 4 | cancellation already sent by the bot | skip `bot_already_told_patient` |
| 5 | appointment already passed | skip `appointment_passed` |
| 6 | due more than 6 hours ago | skip `stale` |
| 7 | reminder no longer for tomorrow | skip `no_longer_tomorrow` |
| 8 | 22:00–09:00 Cairo time | defer to 09:00 `quiet_hours` |
| 9 | 3 messages to this patient in 24h | defer 1 hour `daily_cap` |
| 10 | `mode = 'dry_run'` | skip `dry_run` — but the template and text are saved first |
| — | otherwise | **send** |

Rule 7 exists because the approved reminder template literally says "tomorrow".
A reminder pushed past midnight by quiet hours would state the wrong day.

Staleness (rule 6) is measured from `scheduled_for`, never `created_at` —
reminders are created days ahead by design.

Egypt observes daylight saving (since 2023), so all time logic uses `Intl` with
`Africa/Cairo`, never a fixed +2 offset.

## Duplicate-message safety

- `send_started_at` is written **before** the WhatsApp call. A row that dies after
  that point is abandoned by the sweeper, never retried — a provider timeout is
  ambiguous and a duplicate message is worse than a missed one.
- Sends use `senderKind: 'system'`, so they do not eat the assistant's rate budget
  or trip its "a human is replying" gate.
- The dispatcher never calls `markHumanHandoff` — that would silence the assistant
  for 30 minutes right when the patient replies "cancel".

## The WhatsApp templates

Submitted to Meta, **still waiting for approval**. All UTILITY. All registered as
language `en_US`, whatever language the text is in.

| Name (exactly as registered) | Params | Text is in | Warning |
|---|---|---|---|
| `appoinment_en` | 4 | English | misspelled — permanent |
| `appoinment_ar` | 4 | Arabic | misspelled — permanent |
| `reminder_en` | 3 | **Arabic** | name and language are swapped |
| `reminder_ar` | 3 | **English** | name and language are swapped |

Template names cannot be changed after submission, so
`src/services/patient_notifications/templates.ts` maps around both problems. A
test named *"reminder template names are swapped in Meta — do not 'fix' this"*
stops anyone "correcting" the mapping.

Parameters:

- Confirmation: `{{1}}` patient · `{{2}}` clinic · `{{3}}` full date and time · `{{4}}` service
- Reminder: `{{1}}` patient · `{{2}}` clinic · `{{3}}` **time only** (the text already says "tomorrow")

Parameters are sent positionally, with no `parameterName`, or Meta rejects them.
Arabic dates use Western digits (`ar-EG-u-nu-latn`).

## Which language a patient gets

No database column stores it, so it is inferred:
1. The script of the patient's last WhatsApp message
2. The script of their name
3. Arabic by default

## The feature flag — `/admin/settings` → Patient notifications

- **Mode:** Off / Dry run / Send
- Quiet hours, daily cap per patient, reminder lead time
- **Recalls and review requests** — a separate marketing switch (file 03)
- **What's missing** panel: CRON_SECRET · WhatsApp credentials · service role key ·
  the 4 approved templates · the pg_cron job · the settings row

The server **refuses** to switch to Send while anything required is missing, and
names what is blocking. "Could not check" counts as blocking.

When run against the real environment on 11 Sept the panel reported: keys all
present; **none of the 4 templates approved**; scheduler unknown; settings row
missing (production has not had the migrations yet).

## Key files

| Path | Role |
|---|---|
| `supabase/migrations/20260911100000_patient_notifications.sql` | Outbox, settings, opt-out tables |
| `supabase/migrations/20260911110000_patient_notifications_trigger.sql` | The enqueue trigger |
| `src/services/patient_notifications/templates.ts` | Template names and the swap |
| `src/services/patient_notifications/templateParams.ts` | Building the WhatsApp payload |
| `src/services/patient_notifications/formatWhen.ts` | Cairo dates, `isTomorrowIn` |
| `src/services/patient_notifications/dispatchPolicy.ts` | skip / defer / send |
| `src/services/patient_notifications/dispatchNotification.ts` | One message, dependencies injected |
| `src/services/patient_notifications/runDispatch.ts` | Real wiring, batches of 10 |
| `src/services/patient_notifications/readiness.ts` | The "what's missing" rules |
| `src/app/api/v1/notifications/dispatch/route.ts` | The cron endpoint |
| `supabase/scripts/schedule_notifications_dispatch.sql` | pg_cron setup — run by hand, **not** a migration |
| `docs/PATIENT_NOTIFICATIONS.md` | Operator runbook |
