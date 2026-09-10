import type { Locale } from "./localeStorage";

const LOCALES: readonly Locale[] = ["en", "ar"];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * English is the unprefixed canonical (matches the "/" -> "/en" proxy
 * rewrite); Arabic is a real "/ar" prefix. Always applied at the href
 * boundary — internal helpers keep returning bare canonical paths, and this
 * is the one place a locale gets stitched on.
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === "en") return path;

  const hashIndex = path.indexOf("#");
  const base = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);
  const prefixed = base === "/" ? "/ar" : `/ar${base}`;
  return `${prefixed}${hash}`;
}

/** Reads a "/ar" prefix back off a pathname; anything else is English. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === "/ar") return { locale: "ar", path: "/" };
  if (pathname.startsWith("/ar/")) {
    return { locale: "ar", path: pathname.slice(3) };
  }
  return { locale: "en", path: pathname };
}

/** Swap a pathname's locale while keeping the same page. */
export function mirrorPath(pathname: string, target: Locale): string {
  const { path } = stripLocale(pathname);
  return localePath(target, path);
}

/**
 * For CMS-authored / mixed hrefs (footer links, solution-panel CTAs): only
 * an internal path ("/x") gets the locale prefix. A hash ("#x") stays
 * same-page, and an absolute URL (https://..., mailto:, tel:) is never
 * touched.
 */
export function localizeMixedHref(locale: Locale, href: string): string {
  if (!href.startsWith("/")) return href;
  return localePath(locale, href);
}
