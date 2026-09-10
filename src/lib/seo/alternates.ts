import type { Locale } from "@/lib/i18n/localeStorage";
import { localePath } from "@/lib/i18n/localePath";

/**
 * Next's `alternates` metadata field for a given locale + bare canonical
 * path. `canonical` self-references the current locale's own URL (each
 * language version is distinct content, not a duplicate to be merged), and
 * `languages` is the same reciprocal map on every locale's page — Google's
 * hreflang validation expects every language version to declare all of
 * them, including itself.
 */
export function buildAlternates(
  locale: Locale,
  path: string,
  siteUrl: string,
): { canonical: string; languages: Record<string, string> } {
  const absolute = (target: Locale) => `${siteUrl}${localePath(target, path)}`;
  return {
    canonical: absolute(locale),
    languages: {
      en: absolute("en"),
      ar: absolute("ar"),
      "x-default": absolute("en"),
    },
  };
}
