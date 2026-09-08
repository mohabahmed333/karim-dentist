/** Detect message writing direction from content (Arabic → rtl). */
export function textDirection(text: string): "rtl" | "ltr" {
  const sample = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!sample) return "ltr";
  let arabic = 0;
  let latin = 0;
  for (const ch of sample) {
    const code = ch.codePointAt(0) ?? 0;
    if (isArabicCode(code)) arabic += 1;
    else if (isLatinCode(code)) latin += 1;
  }
  if (arabic === 0 && latin === 0) return "ltr";
  return arabic >= latin ? "rtl" : "ltr";
}

function isArabicCode(code: number): boolean {
  return (
    (code >= 0x0600 && code <= 0x06ff) ||
    (code >= 0x0750 && code <= 0x077f) ||
    (code >= 0x08a0 && code <= 0x08ff) ||
    (code >= 0xfb50 && code <= 0xfdff) ||
    (code >= 0xfe70 && code <= 0xfeff)
  );
}

function isLatinCode(code: number): boolean {
  return (
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a) ||
    (code >= 0xc0 && code <= 0x24f)
  );
}

/**
 * Locale implied by the most recently typed letter (keyboard language proxy).
 * Returns null when the text has no letters yet.
 */
export function lastStrongLocale(text: string): "ar" | "en" | null {
  for (let i = text.length - 1; i >= 0; i -= 1) {
    const code = text.codePointAt(i);
    if (code === undefined) continue;
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    if (isArabicCode(code)) return "ar";
    if (isLatinCode(code)) return "en";
  }
  return null;
}
