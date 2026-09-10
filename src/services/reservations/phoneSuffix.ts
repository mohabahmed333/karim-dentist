/** Digits used to narrow a phone lookup in SQL before matching exactly in JS. */
const SUFFIX_LENGTH = 8;

/**
 * The trailing digits of a phone number, for use as a SQL prefilter.
 *
 * `phonesMatch` compares canonical digits with suffix semantics, which SQL
 * cannot reproduce cheaply. But canonicalization only rewrites the *prefix*
 * (stripping `00`, expanding local `01…` to `201…`), so the last 8 digits are
 * invariant. Filtering on them is therefore a safe superset: it never excludes
 * a number that `phonesMatch` would accept, and it lets Postgres do the work
 * instead of pulling hundreds of rows into memory on every inbound message.
 *
 * Returns null when the input has no digits at all.
 */
export function phoneSuffixForLookup(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length <= SUFFIX_LENGTH ? digits : digits.slice(-SUFFIX_LENGTH);
}
