export type Locale = "en" | "ar";

export const LOCALE_STORAGE_KEY = "dental-lounge-locale";
export const LOCALE_COOKIE_KEY = "dental-lounge-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseLocale(value: string | null | undefined): Locale | null {
  if (value === "en" || value === "ar") return value;
  return null;
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Client-only: persist locale to cookie + localStorage. */
export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/**
 * Inline script for <head>: apply stored locale to <html> before paint,
 * and migrate localStorage → cookie so the next SSR request is correct.
 */
export const LOCALE_BOOTSTRAP_SCRIPT = [
  "(function(){try{",
  'var k="dental-lounge-locale";',
  "var m=document.cookie.match(/(?:^|; )dental-lounge-locale=([^;]*)/);",
  "var v=m?decodeURIComponent(m[1]):null;",
  'if(v!=="en"&&v!=="ar"){v=localStorage.getItem(k);}',
  'if(v==="en"||v==="ar"){',
  "document.documentElement.lang=v;",
  'document.documentElement.dir=v==="ar"?"rtl":"ltr";',
  `if(!m){document.cookie=k+"="+v+"; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax";}`,
  "}else{",
  'document.documentElement.lang="en";',
  'document.documentElement.dir="ltr";',
  "}",
  "}catch(e){}})();",
].join("");
