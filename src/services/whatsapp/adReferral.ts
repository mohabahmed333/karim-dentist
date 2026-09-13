/**
 * Where a conversation came from, when WhatsApp says.
 *
 * Meta attaches a `referral` object to the *first* inbound message after
 * someone taps a Click-to-WhatsApp ad: which ad, which headline, and a
 * `ctwa_clid` that ties the conversation back to the campaign that paid for it.
 *
 * Two things are worth knowing before relying on this. No production message
 * here has ever carried one, and the Kapso SDK does not model the field at all
 * — so it may never arrive through this integration. It is parsed anyway
 * because `whatsapp_messages.raw` already keeps the vendor's whole payload, so
 * reading it costs nothing and the alternative is discovering months later that
 * the data was there all along. If it never arrives, this stays silent and the
 * ad-attribution feature is simply not possible as designed.
 *
 * Pure, so the shape can be pinned down from a fixture the day a real one
 * lands.
 */

export type AdReferral = {
  /** Meta's click id: the join key back to the ad account. */
  ctwaClid: string | null;
  /** The ad or post id. */
  sourceId: string | null;
  /** "ad" or "post". */
  sourceType: string | null;
  sourceUrl: string | null;
  headline: string | null;
  body: string | null;
  mediaUrl: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const str = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * The referral on a raw inbound message, or null when there is none.
 *
 * Looks in both the places it could plausibly sit: on the message itself, as
 * Meta sends it, and nested under a vendor envelope. Anything with no usable
 * identifier at all is treated as absent — a referral that cannot be joined to
 * an ad is not attribution, it is noise.
 */
export function extractAdReferral(raw: unknown): AdReferral | null {
  const message = asRecord(raw);
  const candidates = [
    message.referral,
    asRecord(message.kapso).referral,
    asRecord(asRecord(message.kapso).message_type_data).referral,
  ];

  for (const candidate of candidates) {
    const referral = asRecord(candidate);
    if (Object.keys(referral).length === 0) continue;

    const parsed: AdReferral = {
      ctwaClid: str(referral.ctwa_clid) ?? str(referral.ctwaClid),
      sourceId: str(referral.source_id) ?? str(referral.sourceId),
      sourceType: str(referral.source_type) ?? str(referral.sourceType),
      sourceUrl: str(referral.source_url) ?? str(referral.sourceUrl),
      headline: str(referral.headline),
      body: str(referral.body),
      mediaUrl: str(referral.media_url) ?? str(referral.image_url) ?? str(referral.video_url),
    };

    // Without one of these there is nothing to attribute a booking to.
    if (parsed.ctwaClid || parsed.sourceId) return parsed;
  }
  return null;
}
