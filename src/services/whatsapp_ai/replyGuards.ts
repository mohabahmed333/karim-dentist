const UUID =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** `slotId=<uuid>`, `(slotId: <uuid>)`, `reservationId=<uuid>` and friends. */
const LABELLED_ID =
  /[(\[]?\s*\b(?:slot|reservation|conversation|message)\s*_?id\s*[:=]\s*[0-9a-f-]{8,}\s*[)\]]?/gi;

export type ReplyGuardResult = {
  reply: string;
  /** What was removed, for the decision log. Empty when the reply was clean. */
  violations: string[];
};

/**
 * Strip internal identifiers from a patient-facing reply.
 *
 * The model is shown slots as `slotId=<uuid> starts_at=<iso>` and told to copy
 * the id exactly — meaning into the structured `offeredSlotIds` field. It also
 * copied them into the prose, so patients received raw UUIDs beside each time.
 *
 * The prompt now says so explicitly, but a prompt is a request, not a
 * guarantee. This is the guarantee: no identifier we generate reaches a
 * patient, whatever the model writes.
 */
export function stripInternalIds(input: string): ReplyGuardResult {
  const violations: string[] = [];
  let reply = input;

  const labelled = reply.match(LABELLED_ID);
  if (labelled) violations.push(...labelled.map((m) => m.trim()));
  reply = reply.replace(LABELLED_ID, "");

  const bare = reply.match(UUID);
  if (bare) violations.push(...bare);
  reply = reply.replace(UUID, "");

  if (violations.length > 0) {
    reply = reply
      // Empty brackets left where an id used to be.
      .replace(/[(\[]\s*[)\]]/g, "")
      // Punctuation stranded by the removal: " ، ," -> ", "
      .replace(/\s*([،,])\s*(?=[،,])/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.،,؟?!])/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return { reply, violations };
}

/**
 * Whether a reply is still worth sending after stripping.
 *
 * A reply that was mostly identifiers can end up as punctuation, which is
 * worse than saying nothing — those become drafts instead.
 */
export function isSendableReply(reply: string): boolean {
  return /[\p{L}\p{N}]{3,}/u.test(reply);
}
