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

/** Showreel iframes stay English and must not rewrite the visitor locale cookie. */
export function isShowreelDemoLocaleLock(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.dataset.showreelDemo === "1") return true;
  return location.pathname.startsWith("/showreel/demo");
}

/** Client-only: persist locale to cookie + localStorage. */
export function persistLocale(locale: Locale): void {
  if (isShowreelDemoLocaleLock()) return;
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
 * Inline script: apply stored locale to <html> before paint,
 * and migrate localStorage → cookie so the next SSR request is correct.
 *
 * React 19 never executes <script> created during a client render, so this
 * HTML must only be emitted during SSR / hydration.
 */
export const LOCALE_BOOTSTRAP_SCRIPT = [
  "(function(){try{",
  'if(location.pathname.indexOf("/showreel/demo")===0){',
  'document.documentElement.lang="en";',
  'document.documentElement.dir="ltr";',
  "return;",
  "}",
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

export function localeBootstrapScriptHtml(
  render: "server" | "client",
): string | null {
  return render === "server" ? LOCALE_BOOTSTRAP_SCRIPT : null;
}
