# 05 · Admin pages and API routes

## Pages

| URL | Component | What staff do there |
|---|---|---|
| `/admin/settings` → Patient notifications | `NotificationSettingsForm`, `NotificationReadinessPanel` | Off / Dry run / Send, quiet hours, cap, lead, marketing switch; see what is missing |
| `/admin/outbox` | `NotificationsOutboxTable`, `OptOutManager` | See queued messages and why each was skipped; manage opt-outs |
| `/admin/waitlist` | `WaitlistManager` | Add patients with an optional time window; remove them |
| `/admin/knowledge` | `KnowledgeEditor` (+ `KnowledgeEditCard`, `KnowledgeForm`) | Write bilingual facts; publish them |
| `/admin/assistant-review` | `AssistantReviewQueue` | Compare drafts with what staff sent; add to knowledge; export |

All components are in `src/features/admin/components/`. Labels are in
`src/lib/i18n/messages/admin/en.ts` and `ar.ts`, page titles in
`src/features/admin/lib/adminNav.ts`.

## API routes

Every route except `dispatch` requires an admin login.

| Method + route | Purpose |
|---|---|
| `GET` / `POST /api/v1/notifications/dispatch` | Drain the outbox. `Authorization: Bearer <CRON_SECRET>`. **503** if the secret is unset, **401** if wrong |
| `GET /api/v1/notifications/settings` | Read settings |
| `PATCH /api/v1/notifications/settings` | Change settings. Switching to `send` returns **409 `NOT_READY`** with the blocking list if anything is missing |
| `GET /api/v1/notifications/readiness` | The "what's missing" checks + queue counts |
| `GET /api/v1/notifications/outbox?status=&kind=` | Last 100 queued messages |
| `GET` / `POST /api/v1/notifications/optouts` | List / add an opt-out `{ phone, reason? }` |
| `DELETE /api/v1/notifications/optouts/[suffix]` | Remove an opt-out (8-digit suffix) |
| `GET` / `POST /api/v1/waitlist` | List waiting and offered / add `{ patient_name, phone, service_label?, preferred_from?, preferred_to? }` |
| `DELETE /api/v1/waitlist/[id]` | Remove (status `removed`, withdraws unsent offers) |
| `GET /api/v1/whatsapp/ai/corrections` | Review queue. `?all=1` includes reviewed, `?export=1` returns JSON |
| `PATCH /api/v1/whatsapp/ai/corrections/[id]` | `{ action: "reviewed" }` or `{ action: "promote" }` |

### Existing route changed

`PATCH /api/v1/whatsapp/ai/drafts/[id]` now saves a correction row when staff send a
draft. Saving never blocks the send.

## Services (business logic)

| Folder | Contains |
|---|---|
| `src/services/patient_notifications/` | templates, formatting, language, policy, quiet hours, dispatcher, store, readiness, follow-ups/recalls/review requests, opt-outs, conversation lookup |
| `src/services/clinic_knowledge/` | knowledge CRUD + search |
| `src/services/waitlist/` | input validation |
| `src/services/whatsapp/transcript.ts` | voice-note transcripts |
| `src/services/whatsapp_ai/recordCorrection.ts`, `corrections.ts` | learning from staff |
