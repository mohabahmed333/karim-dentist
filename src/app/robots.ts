import type { MetadataRoute } from "next";
import {
  AI_CRAWLER_USER_AGENTS,
  THROTTLED_CRAWLER_USER_AGENTS,
} from "@/lib/seo/aiCrawlers";
import { absoluteUrl, getSiteUrl, isProductionDeploy } from "@/lib/seo/siteUrl";

/**
 * Paths that must never be indexed.
 *
 * `/api/` is blanket-disallowed, then the public read-only endpoints are
 * re-allowed. Google and Bing apply longest-match precedence, so the more
 * specific Allow wins over the broader Disallow.
 */
const DISALLOW = [
  "/admin",
  "/api/",
  "/showreel",
  "/showreel2",
  // Internal rewrite target for the English tree; `/` is the canonical
  // form and next.config.ts 308-redirects both of these to it, but a
  // crawler that somehow reaches them first should still be told not to.
  "/en",
  "/en/",
];

const ALLOW = ["/", "/api/v1/public/", "/api/v1/booking/slots"];

export default function robots(): MetadataRoute.Robots {
  // Previews and local builds must never be indexed — they would compete with
  // the production domain for identical content.
  if (!isProductionDeploy()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: ALLOW,
        disallow: DISALLOW,
      })),
      ...THROTTLED_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: ALLOW,
        disallow: DISALLOW,
        crawlDelay: 1,
      })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
