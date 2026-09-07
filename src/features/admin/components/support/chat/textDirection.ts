/** Detect message writing direction from content (Arabic → rtl). */
export function textDirection(text: string): "rtl" | "ltr" {
  const sample = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!sample) return "ltr";
  let arabic = 0;
  let latin = 0;
  for (const ch of sample) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x0600 && code <= 0x06ff) arabic += 1;
    else if (code >= 0x0750 && code <= 0x077f) arabic += 1;
    else if (code >= 0x08a0 && code <= 0x08ff) arabic += 1;
    else if (code >= 0xfb50 && code <= 0xfdff) arabic += 1;
    else if (code >= 0xfe70 && code <= 0xfeff) arabic += 1;
    else if (
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a)
    ) {
      latin += 1;
    }
  }
  if (arabic === 0 && latin === 0) return "ltr";
  return arabic >= latin ? "rtl" : "ltr";
}
