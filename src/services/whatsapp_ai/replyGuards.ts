import { normalizeArabic } from "./normalizeArabic";

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

/**
 * Sentences that assert a booking change already happened, in Arabic and
 * English. Deliberately narrow: each requires a completed-action verb, not the
 * mere presence of "book" or "confirm".
 *
 * Every Arabic pattern is written against normalizeArabic()'s output, not the
 * "correctly spelled" form — this guard reads the *model's* generated text,
 * and a model is exactly as prone to writing "تم التاكيد" as a patient is to
 * typing it. A pattern tuned to only the hamza-carrying spelling would let a
 * false confirmation straight through the one guard built to stop it.
 *
 * No \b in the Arabic patterns: JS word boundaries are ASCII-only, so they
 * never match beside an Arabic letter and silently disable the rule. The same
 * mistake already cost us a working injection heuristic once.
 */
const COMPLETION_CLAIMS: RegExp[] = [
  // Arabic — booked
  /حجزت\s+لك/,
  /حجزنا\s+لك/,
  /تم\s+(ال)?حجز/,
  // Arabic — cancelled
  /تم\s+(ال)?الغاء/,
  /الغينا/,
  // Arabic — rescheduled / changed
  /تم\s+(ال)?تغيير/,
  /تم\s+(ال)?نقل/,
  /غيرنا\s+لك/,
  // Arabic — confirmed state
  /موعدك\s+(موكد|تم\s+تاكيده)/,
  /تم\s+(ال)?تاكيد/,
  // English — booked
  /\b(i('ve| have)?\s+)?booked\s+(you|your)\b/i,
  /\byou('re| are)\s+booked\b/i,
  /\bhas\s+been\s+booked\b/i,
  // English — confirmed
  /\b(your\s+)?appointment\s+is\s+confirmed\b/i,
  /\bhas\s+been\s+confirmed\b/i,
  // English — cancelled / rescheduled
  /\bhas\s+been\s+(cancelled|canceled|rescheduled|moved)\b/i,
  /\bi('ve| have)?\s+(cancelled|canceled|rescheduled|moved)\s+(you|your)\b/i,
];

/** Phrasing that turns a claim into an offer, which is legitimate. */
const OFFER_MARKERS: RegExp[] = [
  /\?\s*$/,
  /[؟]/,
  /\bwould\s+you\s+like\b/i,
  /\bshall\s+i\b/i,
  /\bdo\s+you\s+want\b/i,
  /\bi\s+can\s+book\b/i,
  /\bplease\s+confirm\b/i,
  /هل\s+تريد/,
  /تحب/,
  /تريد\s+ان\s+احجز/,
  /(من\s+فضلك\s+)?اكد/,
];

/**
 * Does this reply assert that a booking change already happened?
 *
 * Used to stop the assistant telling a patient they are booked when nothing was
 * written. The prompt already forbids it and the model did it anyway, in
 * production, to a real patient — so this is the enforcement rather than the
 * request.
 *
 * Offers and questions ("shall I book that?") are explicitly not claims: the
 * assistant has to be able to hold a booking conversation.
 */
export function claimsCompletedBooking(reply: string): boolean {
  const probe = normalizeArabic(reply);
  if (OFFER_MARKERS.some((re) => re.test(probe))) return false;
  return COMPLETION_CLAIMS.some((re) => re.test(probe));
}
