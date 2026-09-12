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

## Beyond confirmations

### Waitlist offers — `/admin/waitlist`

When a booked slot goes back to `open` (a cancellation, a reschedule away from
it), the trigger `appointment_slots_offer_waitlist` queues a `waitlist_offer`
for the **three longest-waiting** patients whose preferred window contains the
slot, and marks them `offered`.

- At send time the dispatcher re-checks the slot is still open and skips with
  `slot_taken` if not — a deferral can hold an offer back for hours.
- After the send it registers the slot in `whatsapp_ai_state.offered_slot_ids`
  with a 30-minute expiry. That is what lets the assistant accept "take it":
  `processJob` now reads held slots back into its slot list. Before this, that
  column was written and never read.
- First answer wins through `book_open_appointment_slot`, which is atomic; the
  others get "that time was just taken".
- Removing someone from the waitlist withdraws any offer not yet sent.

### Follow-ups and recalls

Neither has a triggering row, so `enqueueFollowupsAndRecalls` scans on every
dispatch tick. Each enqueue is idempotent on `dedupe_key`, so the scan can run
any number of times.

| Kind | When | Dedupe key |
|---|---|---|
| `followup` | 18h–3 days after a visit marked `completed` | `<reservation>:followup` |
| `recall_6m` | last completed visit over 180 days ago, nothing booked | `<phone suffix>:recall_6m:<that visit>` |

The scan does **not** run while `mode = 'off'`: a row queued then would be
skipped as `mode_off` with its dedupe key spent, and that lapse would never be
recalled.

**Recalls have their own switch**, `recall_enabled`, off by default and separate
from `mode`. A "you're due a check-up" message is marketing in Meta's
classification and in the patient's eyes, and needs its own template and consent.

### Review requests

Queued by the same scan, under the same `recall_enabled` switch, only when a
patient replies to their follow-up and the assistant classifies that reply as
`feedback_positive`. Any `feedback_negative` reply in the same three-day window
vetoes it — a patient who says "the filling is fine but I waited an hour" is not
someone to send to a public review page. Dedupe key: `<followup>:review_request`.

### Opt-outs — `/admin/outbox`

A patient who texts a whole-message opt-out — `STOP`, `unsubscribe`, `إيقاف`,
`إلغاء الاشتراك` — is added to `patient_notification_optouts` before the model
ever sees the message, and anything already queued for them is withdrawn. It
only stops business-initiated messages: if they write to the clinic later, the
assistant still answers. `الغاء` on its own is deliberately **not** an opt-out,
because a patient replying it to a reminder is cancelling an appointment.

`/admin/outbox` also lists the last 100 queued messages with their outcome and
`skip_reason`, and lets staff add or remove an opt-out by hand.

### Templates to submit

Six message types are built and queue correctly, but nothing has been submitted
to Meta for them, so each one is recorded as `no_approved_template` and never
sent. Meta only allows an approved template to *start* a conversation.

To turn one on: submit it in Meta Business Manager under the name below, wait
for approval, then add that name to `PATIENT_TEMPLATES` and render its params in
`buildTemplateForKind`. Register every template under language **en_US**, as the
four approved ones are, and keep the body **positional** — `{{1}}`, `{{2}}` — not
named. The two MARKETING ones need patient consent and are rate-limited by Meta;
the rest are UTILITY.

Settings → Patient notifications shows the same text, with a copy button, behind
each "No template submitted for this message" row. Both come from
`TEMPLATE_PROPOSALS` in `src/services/patient_notifications/templateProposals.ts`
— edit there and run
`node --experimental-strip-types --import ./scripts/test-loader.mjs scripts/write-template-proposals.mjs`.

<!-- generated:template-proposals -->

**Cancellation notices** — `cancellation_en` and `cancellation_ar` · UTILITY

`{{1}}` patient name · `{{2}}` appointment date

```
Hi {{1}}, your appointment on {{2}} has been cancelled. Reply here to book a new time.
أهلاً {{1}}، تم إلغاء ميعادك يوم {{2}}. ابعتلنا هنا لو حابب تحجز ميعاد جديد.
```

**Reschedule notices** — `reschedule_en` and `reschedule_ar` · UTILITY

`{{1}}` patient name · `{{2}}` clinic name · `{{3}}` new date and time

```
Hi {{1}}, your appointment at {{2}} has moved to {{3}}. Reply here if that does not suit you.
أهلاً {{1}}، ميعادك في {{2}} اتغير لـ {{3}}. ابعتلنا لو الميعاد مش مناسب.
```

**Waitlist offers** — `waitlist_offer_en` and `waitlist_offer_ar` · UTILITY

`{{1}}` patient name · `{{2}}` clinic name · `{{3}}` date and time of the free slot

```
Hi {{1}}, a spot opened at {{2}} on {{3}}. Reply yes within 30 minutes to take it.
أهلاً {{1}}، في ميعاد فاضي في {{2}} يوم {{3}}. رد بأيوه خلال ٣٠ دقيقة لو عايزه.
```

**Follow-ups after a visit** — `followup_en` and `followup_ar` · UTILITY

`{{1}}` patient name

```
Hi {{1}}, how are you feeling after your visit? Reply here if anything is bothering you.
أهلاً {{1}}، عامل إيه بعد الزيارة؟ ابعتلنا لو في أي حاجة مضايقاك.
```

**Six-month recalls** — `recall_6m_en` and `recall_6m_ar` · MARKETING

`{{1}}` patient name · `{{2}}` clinic name

```
Hi {{1}}, it has been 6 months since your last visit to {{2}}. Would you like to book a check-up?
أهلاً {{1}}، عدى ٦ شهور على آخر زيارة لـ {{2}}. تحب نحجزلك ميعاد كشف؟
```

**Review requests** — `review_request_en` and `review_request_ar` · MARKETING

`{{1}}` patient name · `{{2}}` review link

```
Thank you, {{1}}! If you have a moment, a review helps other patients find us: {{2}}
شكراً يا {{1}}! لو عندك دقيقة، رأيك بيساعد ناس تانية تلاقينا: {{2}}
```

<!-- /generated -->

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
