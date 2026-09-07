# Front desk: archive conversations (soft-hide)

## Goal

Staff can soft-hide WhatsApp threads from **Open**, browse them under **Archived**, and restore anytime. A new inbound message auto-unarchives the thread back to Open with unread bumped.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Model | Soft-hide via `status = 'archived'` |
| Inbox filters | Three segments: **Open \| Archived \| All** |
| Restore | Manual Unarchive → `active` |
| Inbound | Auto-unarchive → `active` + `unread_count++` |
| Messages | Unchanged; archive does not delete history |

## Schema

Extend `whatsapp_conversations.status` check:

```sql
CHECK (status IN ('active', 'ended', 'archived'))
```

Regenerate / patch `database.types.ts` to include `"archived"`.

No new tables. No `archived_at` column in v1 (YAGNI).

## Status semantics

| Status | Open | Archived | All | Notes |
|--------|------|----------|-----|-------|
| `active` | ✓ | | ✓ | Default open work |
| `archived` | | ✓ | ✓ | Staff soft-hide |
| `ended` | | | ✓ | Kapso conversation ended; not in Open |

- **Open count** = `status === 'active'` only.
- List tag: show **Archived** (muted) when archived; keep existing **Ended** tag for ended.
- Manual archive from `active` or `ended` → `archived`.
- Manual unarchive → always `active` (staff intending to work it again).

## Webhook / upsert rules

Today `upsertConversationFromKapso` forces `active`/`ended` and would wipe archive. Change to:

1. If Kapso event sets `ended` → `ended`.
2. Else if inbound message (`bumpUnread`) and existing is `archived` → `active` (auto-unarchive) + unread bump.
3. Else if existing is `archived` and update is not an explicit ended / not inbound unarchive → **preserve** `archived`.
4. Else → `active` (or keep existing non-archived lifecycle as today).

Outbound agent sends must not unarchive by themselves (only inbound patient messages do).

## API

Add authenticated admin mutation (prefer small route or service used from client):

- `PATCH` / `POST` e.g. `/api/v1/whatsapp/conversations/[id]/status`  
  Body: `{ status: 'archived' | 'active' }`  
  Auth: same as other WhatsApp admin routes.  
  Reject unknown ids; only allow those two targets from the UI (do not set `ended` from archive button).

Optional: toast on success/failure via existing action-toast pattern.

## UI

### Inbox (`SupportInboxColumn`)

- Replace Open/All with **Open | Archived | All**.
- Filter logic:
  - `open` → `status === 'active'`
  - `archived` → `status === 'archived'`
  - `all` → no status filter
- Search + sort apply within the current segment.

### Chat header (`SupportChatColumn`)

- Restore Archive (box) control:
  - When not archived → Archive (sets `archived`, toast, deselect or stay with thread still visible only if filter is All/Archived).
  - When archived → Unarchive (sets `active`).
- After archive while on Open filter: clear selection or select next open thread so the archived row disappears from the list consistently.

### Mapping (`supportWhatsappMap`)

- Pass through `status` for filters/tags.
- `openCount` remains active-only; optionally show archived count in the Archived segment label later (not required for v1 — segment label can be plain “Archived”).

## Out of scope

- Bulk archive
- Auto-archive by idle time
- Syncing archive state to Kapso
- Separate `archived_at` audit trail
- Deleting conversations

## Acceptance

1. Archive moves thread out of Open into Archived; Unarchive reverses.
2. All still lists archived threads.
3. New inbound on archived → appears in Open with unread ≥ 1 and status `active`.
4. Kapso `conversation.ended` still sets `ended`; staff can archive ended threads.
5. Outbound reply alone does not unarchive.
