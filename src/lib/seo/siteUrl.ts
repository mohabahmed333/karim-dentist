/**
 * Canonical origin for metadataBase, canonical tags, sitemap, robots, and the
 * public JSON API. Never hardcode a domain — everything resolves from here.
 */

type SiteUrlEnv = {
  /** NEXT_PUBLIC_SITE_URL — the real domain, set in Vercel + .env.local. */
  siteUrl?: string | null;
  /** VERCEL_PROJECT_PRODUCTION_URL — stable production host. */
  productionUrl?: string | null;
  /** VERCEL_URL — per-deployment host; only useful for previews. */
  vercelUrl?: string | null;
};

const LOCAL_ORIGIN = "http://localhost:3000";

function normalize(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Bare hosts are https everywhere except local dev, where there is no cert.
  const scheme = /^localhost(:\d+)?$/i.test(trimmed) ? "http" : "https";
  return `${scheme}://${trimmed}`;
}

function firstNonBlank(...values: (string | null | undefined)[]): string | null {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return null;
}

/** Pure resolver — exported for tests. */
export function resolveSiteUrl(env: SiteUrlEnv): string {
  const configured = firstNonBlank(
    env.siteUrl,
    // Prefer the stable production host over the per-deployment one, so a
    // throwaway preview hostname can never be baked into production canonicals.
    env.productionUrl,
    env.vercelUrl,
  );
  return configured ? normalize(configured) : LOCAL_ORIGIN;
}

/** Canonical origin, no trailing slash. */
export function getSiteUrl(): string {
  return resolveSiteUrl({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl: process.env.VERCEL_URL,
  });
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Previews and local builds must never be indexed — they would compete with
 * the real domain for the same content.
 */
export function isProductionDeploy(): boolean {
  return process.env.VERCEL_ENV === "production";
}
