/**
 * Arabic-Indic digits, folded to the Western ones the rest of the code counts on.
 *
 * ٠١٢٣٤٥٦٧٨٩ (Arabic-Indic) and ۰۱۲۳۴۵۶۷۸۹ (Eastern Arabic-Indic) both appear
 * on Egyptian banking apps, sometimes in the same screenshot.
 */

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

export function foldArabicDigits(value: string): string {
  return value.replace(ARABIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}
