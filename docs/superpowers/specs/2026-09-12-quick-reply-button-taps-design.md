# Quick reply button taps: design

- **Date:** 2026-09-12
- **Status:** approved
- **Area:** WhatsApp inbox (`/admin/support`), inbound message handling (`whatsapp_messages.flow`)
- **Builds on:** [Quick reply buttons](2026-09-11-quick-reply-buttons-design.md)

## Problem
When a patient taps a reply button (from a quick reply or a hand-built button message), the tap arrives as an ordinary inbound message. Today:

- `kapsoMessageBody` keeps only the tapped button's title, as if the patient had typed it.
- `extractFlowFromKapso` deliberately returns `null` for button and list taps, so nothing marks the row as a tap.
- The button's id — `interactive.button_reply.id` or `interactive.list_reply.id` — is dropped. It survives only inside the message's raw jsonb payload, which nothing reads.
- In the chat, a tap renders as a plain text bubble, indistinguishable from something the patient typed.

## Goals
1. **Save which button was tapped:** its id and title, and whether it was a reply-button or list-item tap.
2. **Show it clearly:** a tap renders as a distinct chip in the chat, not a plain text bubble.

## Non-goals
- **Acting on a tap.** Nothing happens automatically because a particular button was tapped. That is a separate, larger feature.
- **Template quick-reply button taps** (`type: "button"`, with `button.payload`/`button.text`, no `interactive` wrapper). Unreachable today: no approved WhatsApp template has buttons, for the same reason reminder buttons were out of scope for [Quick reply buttons](2026-09-11-quick-reply-buttons-design.md).
- **Backfilling old tap messages.** Rows already stored before this change have `flow: null` and keep rendering as plain text. Not a regression — that is what they show today.

## Decision
Store the tap in the `flow` jsonb column that already exists on `whatsapp_messages`, under a new `kind: "button_reply"`. No migration, no new column.

The existing "replied to" quote (`reply_to`, resolved from `context.id`) already links a tap back to the button message it answered — that mechanism is generic across message types and needs no change.

## Data shape
On `MessageFlowPayload` (`src/services/whatsapp/messageMedia.ts`):
- `kind` gains `"button_reply"`.
- New fields: `buttonId?: string`, `replyKind?: "button" | "list"`.
- `title` holds the tapped label (reusing the field the type already has).

Produced by `extractFlowFromKapso`, replacing its current button/list branch (which returns `null`):
- `interactive.button_reply`: `{ kind: "button_reply", title: button_reply.title, buttonId: button_reply.id, replyKind: "button" }`
- `interactive.list_reply`: `{ kind: "button_reply", title: list_reply.title, buttonId: list_reply.id, replyKind: "list" }`
- Missing or blank `title`/`id`: falls back to `null`, as today (no chip without a real label).

`kapsoMessageBody` is unchanged — `body` still holds the plain title, so the AI bot and anything else reading `.body` sees exactly what it sees today.

## Client
- `SupportMessage["flow"]` (`supportDummyData.ts`) and `parseFlow` (`supportWhatsappMap.ts`) gain `buttonId?: string` and `replyKind?: "button" | "list"`, passed through the same way the existing fields are.
- New component `TapReplyChip.tsx`: a small pill with a tap icon and the button's title, styled distinctly from a normal message bubble (not a duplicate of the plain-text look).
- `ChatMessageBubble.tsx`:
  - `hideBody` includes `m.flow?.kind === "button_reply"`, so the plain paragraph (which would just repeat the title) doesn't also render.
  - Renders `<TapReplyChip flow={m.flow} />` when `m.flow?.kind === "button_reply"`, alongside the existing interactive/flow card checks (mutually exclusive with them, since a stored row has exactly one `flow.kind`).
  - The existing legacy guard `isButtonOrListReplyFlow` (for a fake flow shape from an even older version) is untouched — it covers rows this change does not touch.
  - "Save as quick reply" stays excluded for taps: they are inbound (`isAgent` is false), already outside that action's condition.

## Error handling
- A tap with no title (unusual, but WhatsApp payloads are not fully trusted) produces `flow: null`, and the row falls back to the plain body paragraph — the current behaviour, never a blank bubble.

## Testing
- **Unit tests** (`node:test`, next to the source; neither file has a test file yet):
  - `src/services/whatsapp/messageMedia.test.ts` (new): a `button_reply` payload produces `{kind:"button_reply", title, buttonId, replyKind:"button"}`; a `list_reply` payload produces the same with `replyKind:"list"`; a missing title or id produces `null`. Also covers the existing `extractMediaFromKapso`/other branches only incidentally, if at all — this task's tests focus on `extractFlowFromKapso`.
  - `src/features/admin/components/support/supportWhatsappMap.test.ts` (new): `parseFlow` passes `buttonId` and `replyKind` through unchanged, and drops them when absent or the wrong type.
- **E2E test** (`e2e/inbox.spec.ts` or a new spec, local Supabase, `.env.e2e`): a new webhook helper `inboundButtonReplyEvent` (alongside the existing `inboundTextEvent`) delivers a signed inbound `interactive`/`button_reply` payload. The test opens the conversation and asserts the tap renders as the chip (not a plain bubble) and that its title matches.
- **Existing checks:** typecheck, the full unit suite, no new lint problems compared with `main`, a local-env build, and the existing e2e specs still passing.

## Delivery
- Commits go directly on `main`, same as [Quick reply buttons](2026-09-11-quick-reply-buttons-design.md): no feature branch, no Jira key, explicit staging only (other sessions commit to the same `main`).
- **No production step.** `flow` is already a jsonb column; this ships as code only. `.env.local` (production) is never used for building or running; `.env.e2e` (local Supabase) is used throughout, same as before.
- Nothing is pushed to GitHub.
