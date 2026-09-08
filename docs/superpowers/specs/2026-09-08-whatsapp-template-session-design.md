# Front desk: WhatsApp template send outside 24h window

## Goal

After Meta’s **24-hour customer care window** closes, staff cannot send free-form WhatsApp messages until the patient messages first. Staff must be able to **pick an already-approved Kapso/Meta template**, fill variables when needed, and send it so the conversation can reopen once the patient replies.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Template source | Approved templates already in WhatsApp Business Manager / Kapso (list live via Kapso API) |
| Outside window UX | Lock free-form composer; show “session expired — send a template” flow |
| Variables | Support templates with and without variables |
| Languages | Show all approved languages returned by Kapso (e.g. `en`, `ar`) |
| Template CRUD in admin | Out of scope — create/edit stays in WhatsApp Manager / Kapso |
| Header media templates | Out of scope for v1 — text variables only; unsupported templates are not sendable in-app |

## Session window

### Schema

Add nullable column on `whatsapp_conversations`:

```sql
last_inbound_at timestamptz null
```

- Set/update on every **inbound** message (webhook upsert path).
- Backfill from latest inbound `whatsapp_messages.wa_timestamp` / `created_at` where possible.
- Patch `database.types.ts`.

Outbound agent sends must **not** change `last_inbound_at`.

### Rule

- **Session open** iff `last_inbound_at` is within the last **24 hours** (server clock / UTC).
- **Session closed** if `last_inbound_at` is null or older than 24 hours.
- Expose to the front-desk UI as `sessionOpen: boolean` (and optionally `lastInboundAt`) via the existing conversation map (`supportWhatsappMap` / live inbox).

Helper (pure, unit-tested): `isWhatsappSessionOpen(lastInboundAt, now)`.

## Env / Kapso

- Existing: `KAPSO_API_KEY`, `KAPSO_PHONE_NUMBER_ID`, `KAPSO_WEBHOOK_SECRET`.
- New: `KAPSO_BUSINESS_ACCOUNT_ID` (WABA id) — required to **list** templates.
- Document in `.env.example` and `docs/LOCAL_SETUP.md`.
- Send uses existing phone number id + Kapso client (`client.messages.sendTemplate` + `buildTemplateSendPayload`).

## APIs

Auth: same as other WhatsApp admin routes (logged-in admin).

### `GET /api/v1/whatsapp/templates`

- Calls Kapso `client.templates.list` with `businessAccountId` and status filter **APPROVED**.
- Returns all languages (no client-side language filter).
- Response shape (conceptual): `{ templates: [{ id, name, language, status, category, parameterFormat?, components }] }`.
- Components are passed through so the UI can derive required body/header **text** parameters.
- Missing WABA env or Kapso failure → clear HTTP error; UI shows empty/error state (no silent fail).

### Send path

Extend existing `POST /api/v1/whatsapp/send` (preferred over a second route) with:

- `kind: "template"`
- `template: { name, language, bodyParams?, headerParams? }` (positional or named values as required by the template’s `parameterFormat`)

Flow:

1. Load conversation; resolve `to` phone digits.
2. Build payload via Kapso `buildTemplateSendPayload`.
3. `client.messages.sendTemplate`.
4. Persist outbound row via `insertOutboundMessage` (`message_type: "template"`, body/preview from template name + filled text).

**Templates may be sent whether the session is open or closed.**

### Free-form guard

For non-template kinds (text, media, location, contacts, interactive, …):

- If session is closed → reject with **`409`** (or `403`) and code **`SESSION_EXPIRED`**.
- UI should already be locked; this is a safety net.

### Webhook

On inbound message upsert:

1. Update conversation `last_inbound_at` to the inbound message timestamp.
2. Existing live subscription refreshes UI → `sessionOpen` becomes true → normal composer returns.

## UI

### When `sessionOpen === false`

- Hide/disable free-form `ChatComposer` (text, attachments, location, etc.).
- Show panel copy: **Session expired — send a template to re-open chat** (i18n en/ar).
- Flow: list approved templates (name + language) → select → if variables required, show inputs → **Send template**.
- Sent template appears in the thread like other outbound messages.

### When `sessionOpen === true`

- Existing free-form composer unchanged.
- No requirement to offer template send inside an open session in v1 (YAGNI); staff can still use templates via API if we leave send unrestricted, but UI focus is the locked state.

### Out of scope UI

- Creating, editing, or deleting WhatsApp templates in admin.
- Media/header-image template composition.
- Template analytics / delivery campaigns.

## Errors & edge cases

| Case | Behavior |
|------|----------|
| Missing `KAPSO_BUSINESS_ACCOUNT_ID` | List endpoint errors; panel shows setup/error empty state |
| Kapso list/send failure | Toast / inline error; keep panel open for retry |
| Invalid/missing template params | Client validation before send; server returns clear error |
| Template requires non-text header media | Mark unsupported in picker; do not send in v1 |
| Free-form outside window | `SESSION_EXPIRED`; UI locked |
| Patient replies after template | `last_inbound_at` updates; composer unlocks live |

## Testing

- Unit: `isWhatsappSessionOpen` at 23h59 / 24h01 / null.
- Unit: send-route (or helper) rejects free-form when closed; allows template.
- Unit: template param mapping for no-params vs body text params (positional and/or named as implemented).
- No live Kapso E2E required for Done.

## Non-goals (v1)

- Admin template CRUD.
- Auto-sending templates on timers.
- Starting brand-new chats to numbers with no conversation row (may follow later).
- Full media-header template support.

## Success criteria

1. Outside 24h, staff cannot send free-form WhatsApp from the front desk UI.
2. Staff can list approved Kapso templates (all languages) and send one (with or without variables).
3. After the patient replies, the free-form composer unlocks without a page reload (live inbox).
4. Server rejects free-form sends when the window is closed even if the client is bypassed.
