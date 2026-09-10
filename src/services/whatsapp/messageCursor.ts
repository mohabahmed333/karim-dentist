import type { MessageCursor } from "./queries";

/** Characters that would break out of a PostgREST `or=(…)` expression. */
const UNSAFE = /[(),.]/;

/**
 * Build the PostgREST `or(...)` filter for keyset-paginating messages.
 *
 * Messages are ordered `(wa_timestamp desc, id desc)`, so a timestamp-only
 * cursor drops every row that shares the boundary instant — WhatsApp delivers
 * bursts with identical timestamps, so this loses real messages. The cursor
 * must be composite: strictly older, or the same instant with a smaller id.
 *
 * Returns null when the cursor is absent or contains characters that would
 * escape the filter expression; callers then fetch the first page instead.
 */
export function buildMessageCursorFilter(
  cursor: MessageCursor | null | undefined,
): string | null {
  if (!cursor) return null;
  const { waTimestamp, id } = cursor;
  if (!waTimestamp || !id) return null;
  if (UNSAFE.test(id) || UNSAFE.test(waTimestamp.replace(/\./g, ""))) return null;
  return `wa_timestamp.lt.${waTimestamp},and(wa_timestamp.eq.${waTimestamp},id.lt.${id})`;
}
