# 03 · Waitlist, follow-ups, recalls, review requests and STOP

## Waitlist — `/admin/waitlist`

When a booked slot is freed (a cancellation, or a patient moved away from it), the
trigger `appointment_slots_offer_waitlist` queues a WhatsApp offer for the **three
patients who have waited longest** whose preferred time window contains that slot.

- A patient with no window accepts "any time"
- Their status becomes `offered`
- Two cancellations at once cannot offer one patient two slots (`FOR UPDATE SKIP LOCKED`)

At send time:
1. The dispatcher checks the slot is **still open**, otherwise skips `slot_taken`
2. After sending, the slot is registered as offered in that WhatsApp conversation
   for 30 minutes, so the assistant accepts "take it"
3. The first patient to accept books it through the atomic booking function;
   the others are told it was just taken

Removing a patient from the waitlist withdraws any offer not yet sent.

**Tested** with a real booking and cancellation and four waiting patients: the
three oldest were offered, one whose window excluded the slot was skipped, the
newest stayed waiting.

## Follow-ups

A `followup` is queued **18 hours to 3 days** after a visit marked `completed`.
Staff mark visits completed with the existing button.

## Six-month check-up recalls

A `recall_6m` is queued for a patient whose **latest** completed visit is over 180
days old and who has **nothing booked**.

- The same patient is recognised across phone formats (`0100…` and `+20 100…`)
- One lapse is recalled once; if they return and lapse again, they are recalled again

## Review requests

A `review_request` is queued only when a patient **replies to their follow-up** and
the assistant labels the reply `feedback_positive`. Any `feedback_negative` reply
in the same 3 days cancels it — "the filling is fine but I waited an hour" is not
someone to send to Google.

**Tested:** a happy patient was queued; a patient who praised and then complained
was not.

## The marketing switch

Recalls and review requests are **marketing** (in Meta's rules and in patients'
eyes). They have their own switch, **Recalls and review requests**, off by
default and independent of Send mode.

Follow-ups, recalls and review requests are found by a scan that runs on every
dispatch tick. It is safe to repeat (unique dedupe keys), and it **does not run
while mode is Off** — otherwise those patients would be marked done and never
contacted when you switch on.

## STOP and opt-outs — `/admin/outbox`

| Patient sends (whole message) | Result |
|---|---|
| `STOP` · `stop.` · `🛑 STOP` · `unsubscribe` · `opt out` | opted out |
| `إيقاف` · `ايقاف` · `إلغاء الاشتراك` · `إيقاف الرسائل` | opted out |
| `الغاء` | **not** opted out — means "cancel my appointment" |
| "can you stop the drilling noise" | **not** opted out — only whole messages count |

When a patient opts out:
- It is recorded before the assistant sees the message
- Anything already queued for them is withdrawn
- They get **no more clinic-initiated messages** — but if they write to the clinic,
  the assistant still answers

`/admin/outbox` shows the last 100 queued messages with their outcome and reason,
and lets staff add or remove an opt-out by hand.

**Tested through the real job runner:** STOP opted the patient out and withdrew
their pending confirmation; `الغاء` from another patient did not opt them out.

## All message kinds

| Kind | Queued by | Approved template? |
|---|---|---|
| `confirmation` | booking trigger | submitted, pending |
| `reminder_24h` | booking trigger | submitted, pending |
| `reschedule` | booking trigger | **no** |
| `cancellation` | booking trigger | **no** |
| `waitlist_offer` | slot trigger | **no** |
| `followup` | scan | **no** |
| `recall_6m` | scan (marketing switch) | **no** — MARKETING |
| `review_request` | scan (marketing switch) | **no** — MARKETING |

A kind with no approved template is queued correctly and recorded as
`no_approved_template`. Nothing is sent. See file 06 for suggested texts.
