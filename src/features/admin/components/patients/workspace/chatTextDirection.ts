/** True when Arabic/Hebrew letters outnumber Latin letters. */
export function isPrimarilyRtl(text: string): boolean {
  const rtl =
    text.match(/[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/g)?.length ?? 0;
  const ltr = text.match(/[A-Za-z]/g)?.length ?? 0;
  if (rtl === 0 && ltr === 0) return false;
  return rtl >= ltr;
}

export function chatTextDir(text: string): "rtl" | "ltr" {
  return isPrimarilyRtl(text) ? "rtl" : "ltr";
}
