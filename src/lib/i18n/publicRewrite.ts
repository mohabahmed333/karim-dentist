/**
 * Decides whether a request path needs the default-locale prefix added
 * internally so it resolves under app/(site)/[locale]/. The browser URL
 * never changes — this is a rewrite, not a redirect — so "/" keeps
 * displaying as "/" while Next resolves it as [locale]="en".
 *
 * "/ar" and its subpaths already match [locale] directly and pass through
 * untouched. "/en" is deliberately left alone here too: it must never
 * silently resolve as a second URL for the same content, so making it
 * canonical is next.config.ts's `redirects()` job, not this rewrite's.
 */

const SKIP_PREFIXES = [
  "/api",
  "/admin",
  "/showreel",
  "/showreel2",
  "/en",
  "/ar",
  "/_next",
  "/_vercel",
];

const SKIP_EXACT = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/llms.txt",
  "/llms-full.txt",
  "/favicon.ico",
  "/icon.png",
]);

const HAS_FILE_EXTENSION = /\.[a-zA-Z0-9]+$/;

const DEFAULT_LOCALE_PREFIX = "/en";

export function resolvePublicRewrite(pathname: string): string | null {
  if (SKIP_EXACT.has(pathname)) return null;
  if (
    SKIP_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }
  if (HAS_FILE_EXTENSION.test(pathname)) return null;

  return pathname === "/"
    ? DEFAULT_LOCALE_PREFIX
    : `${DEFAULT_LOCALE_PREFIX}${pathname}`;
}
