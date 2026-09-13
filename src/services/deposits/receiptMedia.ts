/**
 * Finding the image URL on a stored WhatsApp message.
 *
 * `media` is what `extractMediaFromKapso` distilled, and is the right answer
 * almost always. The fallbacks exist because `raw` keeps the vendor's whole
 * message object and has carried the link under three different keys — and a
 * receipt we cannot locate is a patient told to pay again, so it is worth
 * looking in all of them before giving up.
 */

const firstString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "";
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export function receiptMediaUrl(media: unknown, raw: unknown): string {
  if (Array.isArray(media)) {
    for (const item of media) {
      const url = firstString(asRecord(item).url);
      if (url) return url;
    }
  }

  const rawRecord = asRecord(raw);
  const image = asRecord(rawRecord.image);
  const kapso = asRecord(rawRecord.kapso);
  return firstString(image.link, image.url, kapso.media_url);
}
