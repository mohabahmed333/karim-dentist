type HeroFields = {
  headline: string;
  headline_ar?: string;
  accent: string;
  accent_ar?: string;
  body: string;
  body_ar?: string;
  cta_primary_label: string;
  cta_primary_label_ar?: string;
  kicker?: string;
  kicker_ar?: string;
};

type HeroDefaults = {
  headline: string;
  accent: string;
  body: string;
  cta: string;
};

type Locale = "en" | "ar";

/** On AR, empty Arabic uses fallback — do not keep English CMS copy. */
function pickOrFallback(
  locale: Locale,
  en: string,
  ar: string | undefined,
  fallback: string,
) {
  if (locale === "ar") {
    const arabic = (ar ?? "").trim();
    if (arabic) return arabic;
    return fallback;
  }
  return en.trim() || fallback;
}

export function resolveDentalHeroCopy(
  hero: HeroFields,
  defaults: HeroDefaults,
  locale: Locale = "en",
) {
  return {
    kicker:
      locale === "ar"
        ? (hero.kicker_ar ?? "").trim() || ""
        : (hero.kicker ?? "").trim(),
    headline: pickOrFallback(
      locale,
      hero.headline,
      hero.headline_ar,
      defaults.headline,
    ),
    accent: pickOrFallback(
      locale,
      hero.accent,
      hero.accent_ar,
      defaults.accent,
    ),
    body: pickOrFallback(locale, hero.body, hero.body_ar, defaults.body),
    cta: pickOrFallback(
      locale,
      hero.cta_primary_label,
      hero.cta_primary_label_ar,
      defaults.cta,
    ),
  };
}
