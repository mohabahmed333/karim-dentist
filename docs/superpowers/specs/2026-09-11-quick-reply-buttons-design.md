# Quick reply buttons: design

- **Date:** 2026-09-11
- **Status:** approved
- **Area:** WhatsApp inbox (`/admin/support`), quick replies (`whatsapp_canned_replies`), management page `/admin/quick-replies`
- **Builds on:** [Quick replies v2](2026-09-11-quick-replies-v2-design.md)

## Problem
Staff can already send up to 3 reply buttons from the message box, using the button builder (`InteractiveBuilder`). But every time, they have to type the labels again. A saved quick reply can hold text, fill-in fields and an attachment, but not buttons. Two more gaps:

- **Attachments are dropped.** When a button draft is active, the message box silently skips any quick reply attachment, because the buttons branch in `submitText` returns first.
- **Invalid button messages fail badly.** The send route lets through button messages that WhatsApp will reject: text over 1024 characters, no buttons, or duplicate titles. They fail as a generic 500.

## Goals
1. **Saved buttons.** A quick reply can have up to 3 reply buttons, each with an English label and an optional Arabic label.
2. **Inserting.** Typing `/key` inserts the reply text and its buttons together.
3. **Editing.** Staff add, edit and remove buttons on `/admin/quick-replies`.
4. **Sending with attachments.** A reply with both an attachment and buttons sends the attachment first, then the text with its buttons.
5. **Clear errors.** A button message WhatsApp would reject gets a clear 400 from the send route instead of a 500.

## Non-goals
- Acting on a patient's button tap. The tapped button id is not stored.
- "Save as quick reply" from a sent button message.
- Buttons on WhatsApp templates (outside the 24-hour window).
- The AI bot or the staff assistant sending buttons.
- A header or footer on button messages.
- A link-button (CTA) draft sent together with a quick reply attachment. That existing gap is unchanged: the attachment is still skipped for a CTA send.

## Decisions
- **Where buttons live:** a `buttons` column on the quick reply itself. There is no separate button-set table.
- **Languages:** each button has an English and an optional Arabic label. The labels follow the language of the inserted reply text: if the text is Arabic, a button uses its Arabic label, falling back to English when that is empty.
- **Attachment plus buttons:** two messages. The attachment goes first, then the text with the buttons, so the buttons are the last thing the patient sees.
- **No fill-in fields in labels.** A label containing `{{…}}` is rejected, because WhatsApp caps button titles at 20 characters.
- **Button ids:** saved buttons send with the stable ids `qr_<slash_key>_<n>` (n = 1..3), so tap actions can be added later. Buttons that staff add by hand in the builder keep `btn_<n>`.

## Data
**Migration `20260911210000_whatsapp_quick_reply_buttons.sql`:**
- **New column** `buttons jsonb` (nullable) on `whatsapp_canned_replies`. The value is null, or `[{ "title": string, "title_ar": string | null }]` with 1–3 items.
- **Check constraint:** `buttons IS NULL OR (jsonb_typeof(buttons) = 'array' AND jsonb_array_length(buttons) BETWEEN 1 AND 3)`.
- **Seed data:** none. Existing rows keep `buttons = null`.
- **DB types:** the `Row`, `Insert` and `Update` types in `src/lib/supabase/database.types.ts` get `buttons: Json | null`.

## Validation (`src/services/whatsapp/cannedReplyInput.ts`)
- **Each button:**
  - `title`: trimmed, 1–20 characters.
  - `title_ar`: trimmed, 0–20 characters. Optional, and blank is stored as null.
- **The list:** `buttons` is an array of at most 3, or null. An empty array is stored as null.
- **Unique labels:** English titles must be unique within a reply, ignoring case and outer spaces. Non-empty Arabic titles must be unique among themselves, on the same terms.
- **No fields:** any label containing a `{{…}}` token is rejected.
- **Where it applies:** create (POST) and update (PATCH) both use these rules, and a violation returns the existing 400 `{error, path}`.

## Send route hardening (`src/app/api/v1/whatsapp/send/route.ts`)
For `kind: "interactive_buttons"`, the route returns 400 with a specific error before calling Kapso when:
- there are no buttons;
- the text is over 1024 characters (WhatsApp's interactive body limit);
- two button titles are the same, ignoring case and outer spaces.

The existing zod limits (at most 3 buttons, titles of 20 characters or fewer) stay as they are.

## Management page
**Edit card (`QuickReplyForm`), new "Buttons" section:**
- Up to 3 rows. Each row has an English label and an Arabic label (`dir="rtl"`), both with `maxLength={20}`, plus a remove button.
- An "Add button" control shows while there are fewer than 3.
- Validation errors appear inline before saving: duplicates, and fields in a label.
- The preview shows the buttons as pills under the preview text.

**List (`QuickRepliesEditor`):**
- A row whose reply has buttons shows a buttons icon next to the title, like the attachment icon.

**Text:** new English and Arabic i18n keys cover the section title, the add and remove actions, the label placeholders and the errors.

## `/` menu (`SlashCommandMenu`, `quickReplyMenu.ts`)
- **Language helper:** `localizeQuickReply` also returns `buttons: string[]`. Each label is the Arabic one when the returned `locale` is `"ar"` and `title_ar` is non-empty; otherwise it is `title`.
- **Types:** `CannedReply` gains `buttons: { id: string; title: string }[]`, with ids `qr_<slash_key>_<n>`.
- **Row:** a reply with buttons shows a buttons icon.

## Message box
**Button draft per conversation.** The button builder draft (`InteractiveDraft`) moves up into `SupportInboxView`, stored per conversation (`interactiveById`). This matches `draftsById` and `attachmentsById`. It is passed down through `SupportChatColumn` to `ChatComposer`, so switching chats and back keeps text, attachment and buttons together.

**Draft shape.** The buttons mode carries optional ids and where it came from: `{ mode: "buttons"; labels: string[]; ids?: string[]; fromQuickReply?: boolean }`.

**Choosing a reply (`injectCanned`):**
- **Reply has buttons:** set the draft to `{ mode: "buttons", labels, ids, fromQuickReply: true }`. This replaces any existing buttons draft, whether it came from a reply or was built by hand.
- **Reply has no buttons:** remove the draft only if it came from a quick reply. A draft staff built by hand (buttons or CTA) is kept.

**Clearing the message box** (inside `updateDraft`, not in an effect) removes a draft that came from a quick reply. Drafts built by hand are unchanged.

**Editing labels.** Staff can still edit labels in the builder after inserting a reply. Ids stay tied to position. A button added by hand beyond the saved ones is sent with `btn_<n>`.

**Unchanged:**
- A message with a known unfilled `{{field}}` is still blocked from sending.
- The double-send guard still applies.

## Send order (`quickReplySend.ts`)
`planQuickReplySend(text, attachment, buttons)` gains a `buttons` step `{ kind: "buttons"; text; buttons }`. The text is trimmed. "Prompt" means the existing "Please choose an option:" text (`admin.frontDesk.pleaseChoose`).

| Attachment | Buttons | Text | Steps |
|---|---|---|---|
| none | none | any | as today: text |
| file | none | any | as today: file with caption, or text then file if over 1024 |
| pin | none | any | as today: text, then pin |
| none | yes | 1–1024 chars | buttons with the text |
| none | yes | empty | buttons with the prompt |
| none | yes | over 1024 | text, then buttons with the prompt |
| file | yes | ≤ 1024 | file without caption, then buttons with the text |
| file | yes | over 1024 | file without caption, then text, then buttons with the prompt |
| pin | yes | ≤ 1024 | pin, then buttons with the text |
| pin | yes | over 1024 | pin, then text, then buttons with the prompt |

- **Which path runs.** The composer uses this plan whenever a buttons draft and an attachment are both present, and also for buttons alone. This fixes the dropped attachment.
- **Link buttons.** CTA (link button) drafts keep today's path.
- **Awaiting.** Every step is awaited in order, using the same guard as attachment sends.

## Error handling
- **Save errors.** Validation errors on save show inline, and a 400 from the server is surfaced by the existing error path.
- **Send route 400.** A 400 from the send route marks that message as failed in the thread, which is the existing behaviour for a failed send. Later steps are not blocked; that is follow-up "Important 6" from Quick replies v2 and stays out of scope.

## Testing
- **Unit tests** (`node:test`, next to the source):
  - `cannedReplyInput.test.ts`: button limits (count, length), Arabic optional, uniqueness per language, fields in labels rejected, empty array stored as null.
  - `quickReplyMenu.test.ts`: button labels follow the text's language, with English fallback; ids are `qr_<slash_key>_<n>`.
  - `quickReplySend.test.ts`: every row of the send-order table.
  - A pure helper for the send route's button checks, with its own tests.
- **E2E test** (`e2e/quick-replies.spec.ts`, local Supabase, `.env.e2e`):
  1. Add two buttons to a seeded reply in the editor and save. The database row has the buttons.
  2. Insert the reply in a chat and intercept `/api/v1/whatsapp/send`. Exactly one `interactive_buttons` request goes out, with the reply text and titles and ids `qr_<key>_1..2`. Clearing the message box removes the buttons.
  3. For a reply with the clinic location pin plus buttons, requests go out in order: `location`, then `interactive_buttons`.
- **Existing checks:** typecheck, the full unit suite, no new lint problems compared with `main`, a local-env build, and the existing e2e specs still passing.

## Delivery
- **Where:** commits go directly on `main`, as the user asked, with no feature branch and no Jira key. Stage explicit paths only, because other sessions also commit to `main`.
- **Environments:** during work, use local Supabase only. The app and e2e runs use `.env.e2e`, never `.env.local`, which points at production.
- **Applying it:** after verification, `supabase db push --linked --dry-run` must list only `20260911210000_whatsapp_quick_reply_buttons.sql`. Then push it and confirm it is applied remotely.
- **Not pushed:** nothing goes to GitHub.
