# Quick replies v2: design

- **Date:** 2026-09-11
- **Status:** approved
- **Area:** WhatsApp inbox (`/admin/support`), quick replies (`whatsapp_canned_replies`)

## Problem
Quick replies are plain text today. Typing `/` opens `SlashCommandMenu`, and `ChatComposer.injectCanned` pastes the body as it is. The gaps:

- The API (`api/v1/whatsapp/canned-replies`) can list, create and delete, but not edit.
- `CannedRepliesPanel.tsx` is never rendered, so staff can't manage replies in the app at all.
- Replies can't include patient or clinic details, carry a file, be grouped, or be ordered by how often they're used.

## Goals
1. **Fill-in fields:** filled from the patient and clinic when a reply is inserted.
2. **Attachments:** an image, a PDF, or the clinic location pin.
3. **Categories:** the `/` menu lists the most-used replies first.
4. **Management page:** full create, edit, turn on or off, and delete at `/admin/quick-replies`.
5. **"Save as quick reply"** from a sent message in the chat.

## Non-goals
- AI-generated replies. That is a separate feature.
- Per-staff reply sets.
- Fields for prices. Service prices aren't filled in anywhere yet.

## Decisions
- **Where fields are filled in:** a server endpoint looks up the values, and the browser fills them in when a reply is chosen. Staff always see the final text before sending.
- **Missing values:** a field with no value stays in the text as `{{field}}`, and sending is blocked until staff replace it. The same applies to a known `{{field}}` that staff type themselves.
- **Where replies are managed:** a full page, plus a small save dialog in the chat.

## Data
**Migration `20260911190000_whatsapp_quick_replies_v2.sql`:**
- **New columns on `whatsapp_canned_replies`:**
  - `category text` (nullable)
  - `use_count int not null default 0`
  - `last_used_at timestamptz`
  - `attachment jsonb`: `null`, or `{kind:'image'|'document', path, mime, name, size}`, or `{kind:'location'}`
- **RPC `record_canned_reply_use(p_id uuid)`:** runs as the calling user, so the existing `is_admin()` policy applies. It adds 1 to `use_count` and sets `last_used_at = now()`.
- **Bucket `whatsapp-quick-replies`:** private, with `storage.objects` policies limited to `is_admin()`.

## Fill-in fields
**Pure module `src/services/whatsapp/quickReplyFields.ts`.**

| Field | Value |
|---|---|
| `name` | First name. Linked patient display name, then reservation `patient_name`, then WhatsApp contact name |
| `next_appointment` | Soonest upcoming non-cancelled reservation. Date and time in the clinic timezone, in Arabic or English |
| `appointment_service` | That reservation's `service_label` |
| `clinic_address`, `clinic_phone`, `maps_link` | `clinicContactFromSettings` |
| `clinic_hours` | `formatClinicHours` |

**Functions:**
- `renderQuickReply(body, values)` returns `{text, missing}`.
- `findUnfilledFields(text)` returns the known markers still present.
- `findUnknownFields(body)` returns fields that aren't recognised, so a save can be rejected.

## Server
- **`cannedReplies.ts`:**
  - `updateCannedReply` edits all fields, plus `active`, `category` and `attachment`.
  - `recordCannedReplyUse` calls the new RPC.
  - `deleteCannedReply` also removes the attachment file.
- **Next appointment:** move the query in `processJob.ts` that finds a patient's upcoming reservations by phone into an exported function, `loadUpcomingReservations(db, phone)`. `processJob` and the new context loader both use it.
- **`quickReplyContext.ts`:** `loadQuickReplyContext(db, conversationId, lang)` returns the field values.
- **Routes** (all use `requireAdmin` and zod):
  - `PATCH canned-replies/[id]`
  - `POST canned-replies/[id]/use`
  - `GET canned-replies/context?conversationId=&lang=`
  - `POST` and `PATCH` reject unknown fields with 400, and a duplicate `slash_key` with 409.

## Management page
- **Page:** `src/app/(internal)/admin/(dashboard)/quick-replies/page.tsx` loads the rows and renders `QuickRepliesEditor` (in `src/features/admin/components/quick-replies/`).
- **List:** a table you can sort and search by category, with use count, attachment icon and an active column. It uses the same `CollectionTable` as the Knowledge editor.
- **Edit card:**
  - Slash key
  - Title in EN and AR
  - Category, suggesting existing ones
  - Body in EN and AR as multi-line boxes, with "Insert field" buttons
  - Attachment: upload an image or PDF, or choose the clinic location pin
  - Live preview with sample values
- **Also:** add a nav entry and i18n text in EN and AR, and delete the unused `CannedRepliesPanel.tsx`.

## Message box
- **Menu:** sorted by `use_count` (highest first), then `sort_order`. Rows show a category badge and an attachment icon. Search also matches the category. A "Manage" link goes to the page.
- **Choosing a reply:** fetch the context values, cached per conversation and the language of the inserted reply text, then call `renderQuickReply`, insert the text, and call `/use` without waiting for it.
- **Unfilled fields:** while any known `{{field}}` remains, show a warning chip, disable Send and ignore Enter.
- **Attachment chip:** removable. On send:
  - The attachment is kept per conversation. Inserting a reply replaces it with that reply's attachment (or none), and clearing the message box removes it.
  - **Image or document:** download from the bucket, wrap in a `File`, and send `{kind, file, text}` so the text becomes the caption. If the text is over 1024 characters, send the text first, then the file.
  - **Location:** send the text, then `clinicLocationPin()`.

## Save from chat
- Add a "Save as quick reply" action to sent text messages (from staff or the AI) in `ChatMessageBubble`.
- It opens `SaveQuickReplyDialog`, which asks for slash key, title and category.
- The text goes into `body` or `body_ar` based on `lastStrongLocale`.

## Error handling
- **Context request fails:** insert the reply with every field left unfilled, so sending stays blocked.
- **Attachment download fails:** show a toast, keep the draft, and send nothing.
- **Duplicate slash key:** the server returns 409 and the form shows the error on the slash key field.

## Delivery
There are 4 PRs, each under ~400 lines:
1. **Database and backend**
2. **Management page**
3. **Message box**
4. **Save from chat**

## Testing
- **Unit tests** use `node:test` with `*.test.ts` files next to the source:
  - `quickReplyFields.test.ts`
  - `quickReplyValues.test.ts`: the pure builder behind `loadQuickReplyContext`, covering a linked patient, an unlinked patient, no upcoming visit, and AR/EN dates in the clinic timezone
  - `upcomingReservations.test.ts`: the query moved to `src/services/reservations/`
  - `cannedReplyInput.test.ts` and `cannedReplies.test.ts`
  - `quickReplyMenu.test.ts`, `quickReplySend.test.ts` and `quickReplyFromMessage.test.ts`
  - The existing `runAutoReply` and golden-case tests must still pass.
- **E2E test `e2e/quick-replies.spec.ts`** (`E2E_FAKE_KAPSO=1`):
  1. The reply shows on the management page.
  2. An unlinked chat keeps the markers and blocks Send.
  3. Once the markers are replaced, Send works.
  4. A PNG attached in the editor (browser upload to the private bucket, then save) goes out with the reply: `/api/v1/whatsapp/send` is intercepted with `page.route`, and a double-click on Send yields exactly one multipart request carrying the file (`filename`, `image/png`) and the text as its caption. Clearing the message box removes the attachment.
- **Attachment sends** are covered end to end up to the send request. The server's media upload to Kapso is not, because `E2E_FAKE_KAPSO` fakes the send but not the upload; that part is covered by `quickReplySend.test.ts` and a manual check.
