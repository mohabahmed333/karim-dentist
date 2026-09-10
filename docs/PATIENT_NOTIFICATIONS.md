# Patient notifications

Tells a patient on WhatsApp that their appointment is booked, and reminds them
the day before.

**It ships disabled.** `patient_notification_settings.mode` defaults to `off`.
Rollout is `off` → `dry_run` for a week → `send`.

## How a notification happens

```
reservations INSERT/UPDATE
  -> enqueue_patient_notifications()    trigger, inside the booking transaction
       -> patient_notifications         status=pending, scheduled_for

pg_cron, every minute
  -> pg_net POST /api/v1/notifications/dispatch   (Bearer CRON_SECRET)
       -> sweepExpiredLeases            returns or abandons dead claims
       -> findDue + claim               conditional UPDATE = lease
       -> evaluateDispatchPolicy        skip | defer | send
       -> resolveOrCreateConversation   only for a real send
       -> markSendStarted               before the provider call, always
       -> sendWhatsappMessage           template, senderKind 'system'
```

The enqueue is a **trigger** because bookings arrive from four paths and only
three use an RPC — `createReservation()`, `updateReservation()` and
`rescheduleReservation()` are plain browser-client writes with about ten call
sites. It runs in the booking's own transaction, so a booking that later fails
takes its notification with it.

## Key files

| Path | Role |
|---|---|
| `supabase/migrations/*_patient_notifications.sql` | Outbox, settings, opt-outs |
| `supabase/migrations/*_patient_notifications_trigger.sql` | The enqueue trigger |
| `src/services/patient_notifications/templates.ts` | The approved Meta templates |
| `src/services/patient_notifications/dispatchPolicy.ts` | skip / defer / send |
| `src/services/patient_notifications/dispatchNotification.ts` | One row, deps injected |
| `src/services/patient_notifications/runDispatch.ts` | Real wiring, batch of 10 |
| `src/app/api/v1/notifications/dispatch/route.ts` | The cron endpoint |
| `supabase/scripts/schedule_notifications_dispatch.sql` | pg_cron setup, run by hand |

## Operating it

```sql
-- stop everything, effective on the next tick, no deploy needed
update patient_notification_settings set mode = 'off';

-- rehearse: resolve templates and record them, send nothing
update patient_notification_settings set mode = 'dry_run';

-- read a week of rehearsal: exactly what each patient would have received
select kind, status, skip_reason, language, template_name, payload
from patient_notifications
where created_at > now() - interval '7 days'
order by created_at desc;

-- why nothing is going out
select status, skip_reason, count(*) from patient_notifications
group by 1, 2 order by 3 desc;

-- stop messaging one patient (last 8 digits, any format)
insert into patient_notification_optouts (phone_suffix, phone, reason)
values (right(regexp_replace('+20 100 555 1234','[^0-9]','','g'), 8),
        '+20 100 555 1234', 'asked on the phone');
```

## Environment

| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Required. Without it `/dispatch` returns 503, not 200 |
| `KAPSO_*` | WhatsApp transport. Absent means `defer: no_transport`, never a send |

Plus the two Vault secrets in
`supabase/scripts/schedule_notifications_dispatch.sql`.

## Things that will bite you

- **The approved template names are wrong, on purpose.** `appoinment_en` /
  `appoinment_ar` are misspelled, and the reminder suffixes are **swapped** —
  the body of `reminder_en` is Arabic and the body of `reminder_ar` is English.
  Template names are immutable once submitted, so `templates.ts` maps around it
  and a test named *"do not 'fix' this"* stops anyone from aligning them. All
  four are registered `en_US` whatever their body language.

- **Only confirmations and reminders can be sent.** There is no approved
  template for a cancellation or a reschedule, and Meta forbids free text
  outside the 24h window, so those rows record `no_approved_template` and stay
  quiet. Submit the templates, add them to `PATIENT_TEMPLATES`, extend
  `buildTemplateForKind`.

- **The reminder template hardcodes "tomorrow".** If a send slips past midnight
  — deferred by quiet hours, say — the message would name the wrong day with
  total confidence, so the policy skips it with `no_longer_tomorrow` instead.

- **A row that reached the send call is never retried.** `send_started_at` is
  written first; the lease sweeper abandons anything that dies past it. A
  provider timeout is ambiguous, and a duplicate WhatsApp to a patient is worse
  than a missed one.

- **Deleting a reservation tells the patient nothing.** Soft delete withdraws
  pending work silently; cancelling is what messages them. Conflating the two
  would message people about records maintenance.

- **Never call `markHumanHandoff` from here.** It pauses the auto-responder for
  thirty minutes — precisely the window in which the patient replies "cancel" to
  the reminder. Sends use `senderKind: 'system'`, which also keeps them out of
  the responder's rate budget and away from its `human_active` gate.

## If nothing is being sent

1. **Is the endpoint deployed and locked?**
   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/api/v1/notifications/dispatch
   ```
   `401` or `503` means it exists. `404` means production is running an older
   build.

2. **Is anything queued?**
   ```sql
   select kind, status, scheduled_for from patient_notifications
   order by created_at desc limit 10;
   ```
   Zero rows after a booking means the trigger is missing — check
   `pg_trigger` for `reservations_notify_ins`. Note the trigger downgrades its
   own failures to `RAISE WARNING` so a booking never fails; look in the
   Postgres logs for `enqueue_patient_notifications failed`.

3. **Is pg_cron actually calling?**
   ```sql
   select * from cron.job where jobname = 'patient-notifications-dispatch';
   select status_code, error_msg, created from net._http_response
   order by created desc limit 20;
   ```
   `net._http_response` is auto-vacuumed after about six hours.

4. **What did the dispatcher decide?** `skip_reason` names the exact gate:
   `mode_off`, `no_transport`, `opted_out`, `quiet_hours`, `daily_cap`,
   `stale`, `no_longer_tomorrow`, `no_approved_template`, `dry_run`.

The quietest failure is `mode_off`: it is the default, and it looks identical to
a working system with nothing to say.
