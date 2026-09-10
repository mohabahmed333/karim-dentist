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
       -> groqChat                  patient text is JSON-wrapped as data
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
| `GROQ_API_KEY` | Required. Without it the policy gate skips before any I/O |
| `GROQ_MODEL` | Optional override, defaults to `openai/gpt-oss-120b` |
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
