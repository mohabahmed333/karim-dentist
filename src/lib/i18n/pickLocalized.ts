import type { Locale } from "@/lib/i18n/LocaleProvider";

/** Prefer Arabic CMS copy when locale is ar and the Arabic value is non-empty. */
export function pickLocalized(
  locale: Locale,
  en: string | null | undefined,
  ar: string | null | undefined,
): string {
  const english = (en ?? "").trim();
  const arabic = (ar ?? "").trim();
  if (locale === "ar" && arabic) return arabic;
  return english;
}

/**
 * CMS field with a UI-catalog fallback.
 * On Arabic, empty `*_ar` uses the fallback (not English CMS), so the public
 * site still switches language when CMS Arabic has not been filled yet.
 */
export function localizedCms(
  locale: Locale,
  en: string | null | undefined,
  ar: string | null | undefined,
  fallback: string,
): string {
  if (locale === "ar") {
    const arabic = (ar ?? "").trim();
    if (arabic) return arabic;
    return fallback;
  }
  const english = (en ?? "").trim();
  return english || fallback;
}
