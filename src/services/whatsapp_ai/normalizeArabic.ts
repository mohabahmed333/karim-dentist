/**
 * Fold Arabic spelling variants that mean the same word to a patient but are
 * different Unicode text: a keyword regex written for one spelling silently
 * misses the others, and Egyptian typing habitually drops the hamza — "اسنان"
 * for "أسنان" is the ordinary way most people type it, not a typo.
 *
 * Applied to the *input* being tested, never to what is shown to a patient:
 * this is for matching, and folding a reply would be a real (if harmless)
 * spelling change nobody asked for.
 *
 * Every keyword pattern in this module is written against the *normalized*
 * form — an alef-with-hamza in a pattern would never match normalized input,
 * which already collapsed it to a bare alef.
 */
export function normalizeArabic(text: string): string {
  return text
    // Diacritics (tashkeel, U+064B-0652), the dagger alif (U+0670), and
    // Qur'anic annotation marks (U+06D6-06ED): present in formal or
    // religious-register text, absent from how anyone actually messages a
    // clinic, but harmless either way to strip before matching. Written as
    // explicit code points, not the combining marks themselves — those are
    // unverifiable at a glance in a regex literal.
    .replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, "")
    // Tatweel/kashida — a stretch mark with no meaning of its own, sometimes
    // used for emphasis: "لاااا" stays readable, "احجزـلي" should still match
    // "احجزلي".
    .replace(/ـ/g, "")
    // أ / إ / آ / ٱ all read as the same letter to a patient typing casually.
    .replace(/[آأإٱ]/g, "ا")
    // ؤ (hamza on waw) and ئ (hamza on yeh) get the same treatment — "مؤكد"
    // written "موكد" is exactly this module's reason to exist, and it is not
    // only patients who drop a hamza: this same fold is what makes the
    // false-confirmation guard in replyGuards.ts catch a model that wrote
    // "تم التاكيد" instead of the "correctly" spelled "تم التأكيد".
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    // ى (alef maqsura) and ي are interchanged constantly in casual typing —
    // "علي" / "على" is the same confusion the other way round.
    .replace(/ى/g, "ي")
    // ة and ه are the single most common substitution in Arabic typed on a
    // phone keyboard, in both directions.
    .replace(/ة/g, "ه");
}
