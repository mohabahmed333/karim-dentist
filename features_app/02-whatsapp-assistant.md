# 02 · WhatsApp assistant improvements

All of these change how the assistant answers patients. The assistant itself
(`processJob` → `runAutoReply`) still ships with `whatsapp_ai_settings.mode = 'off'`.

## Voice notes are answered

**Before:** every voice note was dropped before the model was called. The patient
got silence.

Kapso already transcribes audio (`kapso.transcript.text`), so a transcribed voice
note is now read exactly like text. Two cases still stay unread:

- **Transcript not ready yet** — `processing_status` is `pending` when the message
  arrives.
- **Not speech** — Whisper writes markers like `[outro jingle]` for music or
  silence. Production contains exactly this one. A transcript made only of such
  markers is ignored, so the assistant never answers something nobody said.

Files: `src/services/whatsapp/transcript.ts`, `src/services/whatsapp_ai/policy.ts`,
`src/services/whatsapp/messageMedia.ts`.

## Cancelling by replying to a reminder

The reminder template has no buttons, so patients reply in words. Their reply
opens WhatsApp's 24-hour window, and the assistant already knows their bookings.

| Patient writes | Assistant does |
|---|---|
| "الغاء" / "cancel", **one** upcoming appointment | cancels that appointment |
| same, **two or more** appointments | asks which — never guesses |
| "تمام" / "confirm" | says thank you, no action |
| cancel with under ~2 hours to go | hands off to staff (it is really a no-show) |

Safety changes: cancelling now needs **0.9** confidence (was 0.85 — a wrong cancel
silently frees a slot), and a cancel sent while the model still says it needs to
know *which* appointment is held as a draft (`ambiguous_reservation`).

Files: `prompts/whatsapp-autoresponder.md`, `src/services/whatsapp_ai/decideAutoReply.ts`.

## The assistant can book a slot it was offered

**A bug that existed before this session.** Offered slots were saved to
`whatsapp_ai_state.offered_slot_ids` but **never read back**. The assistant only
ever saw the next 5 open slots, so a patient accepting an offer further out was
refused. `processJob` now puts held, unexpired, still-open slots first in its list.

## Replies in the same conversation thread

A conversation created for a website patient could be stored as `+2010…` while
WhatsApp reports `2010…`, which would split the reminder and the reply into two
threads. Conversations are now matched on the last 8 digits plus `phonesMatch`.

## Clinic knowledge base — `/admin/knowledge`

The assistant used to know hours, service **titles**, 5 slots and an address —
no prices, FAQs or aftercare, so it handed off constantly. Now each patient
message searches `clinic_knowledge` and the matches go into the prompt as trusted
clinic facts. If nothing matches, it is still told to hand off, not improvise.

How search works:
- Postgres full-text, not AI embeddings: free, instant, and you can see why it matched
- The patient's words are **OR-ed** together. The first version used AND and
  matched nothing, because "how much is teeth whitening?" required the words
  "how", "much" and "is" to appear in an entry
- Results are kept relative to the best match, not a fixed score
- Works in Arabic: `بكام تبييض الاسنان؟` finds the whitening entry
- Seeded from existing FAQs and the 21 services
- **New entries start unpublished** — unpublished entries are invisible to the assistant

Files: `supabase/migrations/20260911140000_clinic_knowledge.sql`,
`src/services/clinic_knowledge/`, `src/services/whatsapp_ai/buildAutoReplyPrompt.ts`.

## Learning from staff — `/admin/assistant-review`

Every time staff send an AI draft, what the assistant proposed and what staff
actually sent are saved in `whatsapp_ai_corrections`. The assistant's original is
read from `whatsapp_ai_events.envelope`, because the draft itself may already have
been edited.

From the review page staff can:
- **Mark reviewed**
- **Add staff answer to knowledge** — creates an *unpublished* knowledge entry
- **Export reviewed (JSON)** — for a developer to turn into golden tests

Why not "save as a test" directly: Vercel cannot write files at runtime.

Files: `src/services/whatsapp_ai/recordCorrection.ts`, `src/services/whatsapp_ai/corrections.ts`,
`src/app/api/v1/whatsapp/ai/drafts/[id]/route.ts`.

## New intents for replies to a follow-up

- `feedback_positive` — sends a short thank-you at 0.8 confidence
- `feedback_negative` — **always** goes to a person

This label decides whether a review request is sent (file 03), so pain mentioned
alongside thanks must still be `clinical_question`.

## STOP

A whole message such as `STOP`, `unsubscribe`, `إيقاف` or `إلغاء الاشتراك` opts the
patient out **before the model sees it**. `الغاء` alone does **not** — it means
"cancel appointment". See file 03.
