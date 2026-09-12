# WhatsApp AI auto-responder

Answers patient messages on WhatsApp: safe questions automatically, anything
clinical as a draft for staff to approve.

**It ships disabled.** `whatsapp_ai_settings.mode` defaults to `off` and
`allow_booking_writes` to `false`. Enabling replies and enabling database
writes are two separate decisions.

Full write-up, including what to build next:
<https://claude.ai/code/artifact/3de2a84b-5773-42b3-b04e-1152102cb8e2>

## How a reply happens

```
inbound webhook
  -> processKapsoWebhook stores the message
  -> enqueueAutoReplyJob            (one job per message, unique index)
  -> after() -> processAutoReplyJob (webhook has already returned 200)
       -> evaluateAutoReplyPolicy   gate 1: context. runs before any model call
       -> aiChat                    patient text is JSON-wrapped as data
                                    (walks the model chain until one answers)
       -> extractAutoReplyEnvelope  any failure becomes a handoff
       -> decideAutoReply           gate 2: content. the autonomy matrix
       -> send | draft
```

Autonomy is never the model's decision. It reports intent and confidence;
`decideAutoReply` decides what may follow. `clinical_question`, `complaint`,
`emergency` and `other` are absent from the threshold map, so they draft at any
confidence.

The bot's action vocabulary is three booking kinds — not the admin AI's 31.
That narrowness is the containment: a fully successful prompt injection can at
worst change an appointment for the number that sent the message.

## Key files

| Path | Role |
|---|---|
| `prompts/whatsapp-autoresponder.md` | The versioned system prompt |
| `src/services/whatsapp_ai/policy.ts` | Gate 1 — context (kill switches, 24h window, rate caps) |
| `src/services/whatsapp_ai/decideAutoReply.ts` | Gate 2 — content (the autonomy matrix) |
| `src/services/whatsapp_ai/buildAutoReplyPrompt.ts` | Prompt assembly. Patient text never enters the system message |
| `src/services/whatsapp_ai/processJob.ts` | Wires real dependencies and runs one job |
| `src/app/api/v1/whatsapp/webhook/route.ts` | Enqueues, then generates in `after()` |
| `src/app/api/v1/whatsapp/ai/sweep/route.ts` | Cron backstop for interrupted jobs |

## Grounding and learning

**Clinic knowledge — `/admin/knowledge`.** Retrieved per message by
`search_clinic_knowledge` and injected as a trusted prompt block. Full-text, not
embeddings: the patient's message is tokenised and its lexemes OR-ed, then kept
relative to the best match (`selectRelevant`). An AND query — the obvious first
version — matched nothing, because the `simple` config keeps stopwords. New
entries start unpublished; unpublished entries are invisible to the assistant.

**Assistant review — `/admin/assistant-review`.** Every draft staff edit before
sending is stored in `whatsapp_ai_corrections`, with the model's original read
from `whatsapp_ai_events.envelope` (the draft row may already hold staff's
wording). From the queue: mark reviewed, or add the staff answer to knowledge as
an unpublished entry. "Promote to golden case" does not write a test file —
Vercel's filesystem is read-only — so reviewed examples are exported as JSON for
a developer to commit.

**Voice notes.** Kapso transcribes them (`kapso.transcript`); a transcribed note
is readable like text. Pending transcripts and non-speech markers such as
`[outro jingle]` stay unreadable.

**Replying to a reminder.** "cancel"/"الغاء" with one upcoming appointment
cancels it; with more than one the assistant must ask. `booking_cancel` needs 0.9
confidence, and a cancel emitted while `needs` still contains `reservation_id` is
drafted as `ambiguous_reservation`.

**Replying to a follow-up.** `feedback_positive` auto-sends a thank-you at 0.8
confidence; `feedback_negative` always drafts, like `complaint`. The label is
load-bearing: `feedback_positive` is what permits a review request, so pain
reported alongside thanks must still be `clinical_question`.

**STOP.** A whole-message opt-out keyword is recorded and the job ends as
`opted_out_keyword` before any model call.

## Operating it

```sql
-- stop everything, effective on the next message, no deploy needed
update whatsapp_ai_settings set mode = 'off';

-- drafts only: the bot writes suggestions, sends nothing
update whatsapp_ai_settings set mode = 'draft_only';

-- what the responder has actually been deciding
select decision, intent, count(*), round(avg(confidence)::numeric, 2) as avg_conf
from whatsapp_ai_events
where created_at > now() - interval '7 days'
group by 1, 2 order by 3 desc;

-- silence one conversation only
update whatsapp_ai_state set autoreply_enabled = false
where conversation_id = '<id>';
```

Rollout order: `draft_only` for a week → read the events table and compare the
drafts staff sent against what the model wrote → `auto` → and only then
`allow_booking_writes = true`.

## Environment

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY`, `MISTRAL_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY` | At least one required. With none of them the policy gate skips before any I/O. Models are tried in that order and the first with quota left answers |
| `AI_MODEL_CHAIN` | Optional override of the whole order, `provider:model` comma-separated |
| `GROQ_MODEL` | Optional override of the preferred Groq model, defaults to `openai/gpt-oss-120b` |
| `KAPSO_*` | WhatsApp transport, unchanged |
| `CRON_SECRET` | Shared secret for the sweep endpoint |

## Validation

```bash
yarn typecheck      # expect: silent
yarn test           # expect: 796 passing
supabase start && supabase db reset --local
yarn e2e            # expect: 13 passing — needs .env.e2e, see playwright.config.ts
```

The end-to-end suite runs against a real local Supabase, because RLS, the
atomic booking RPCs and the realtime inbox only exist in the database. Only
Groq and Kapso are faked, via `E2E_FAKE_GROQ` / `E2E_FAKE_KAPSO`.

## Things that will bite you

- **Business-initiated messages need approved Meta templates.** Free text only
  works within 24 hours of the patient's last message. Confirmations and
  reminders fall outside that window, so they must be templates — this is
  enforced by Meta, not by us.
- **A draft is a real row in `whatsapp_messages`** with `status = 'draft'`, so
  it reaches the realtime inbox with no extra subscription. Three places guard
  against it being treated as delivered; `useWhatsappInboxLive` is the one that
  would fail silently, showing staff a preview the patient never received.
- **A job that reached the send call is never retried.** A provider timeout is
  ambiguous, and a duplicate WhatsApp message to a patient is worse than a
  missed one. Those are abandoned for staff instead.

## If the responder is silent

Work down the chain — each step tells you which link is broken.

1. **Is the code deployed?**
   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' \
     https://<your-domain>/api/v1/whatsapp/ai/settings
   ```
   `401` means the route exists and is deployed. `404` means production is
   running an older build — check Vercel's **Production Branch** setting, which
   must be `main`, and that the latest commit actually built.

2. **Are jobs being created?**
   ```sql
   select count(*) from whatsapp_ai_jobs;
   ```
   Every inbound message enqueues one, before any policy check. Messages
   arriving with zero jobs means the deployed webhook is the old handler.

3. **What did the responder decide?**
   ```sql
   select decision, reason, intent, confidence, latency_ms, created_at
   from whatsapp_ai_events order by created_at desc limit 10;
   ```
   `reason` names the exact gate that stopped it — `mode_off`, `no_ai_key`,
   `session_closed`, `human_active`, `rate_limited_*`.

Having no provider key at all is the quietest failure: the policy gate skips
before any network call, so there is no error anywhere — only a `skip` row with
reason `no_ai_key`. Any one of `GEMINI_API_KEY`, `MISTRAL_API_KEY`,
`CEREBRAS_API_KEY` or `GROQ_API_KEY` clears it. On Vercel, add it to the
Production environment and redeploy; new environment variables do not apply to
an existing build.

The `model` column on `whatsapp_ai_events` records which model actually
replied, as `provider:model`. Expect it to vary through the day — that is the
chain working, not a misconfiguration.

