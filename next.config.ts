import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js “N” badge in local development (errors still surface).
  devIndicators: false,
  // Tesseract ships a large WASM core and loads it by path at runtime. Bundling
  // it into the serverless function breaks that resolution, so it is kept as a
  // plain node_modules dependency. Used only by the optional deposit
  // cross-check, which degrades to "no second opinion" if it cannot load.
  serverExternalPackages: ["tesseract.js"],
  async redirects() {
    // Legacy agency-era pages. They were unlinked from the dental nav but
    // still indexable, still branded "Imagineer", and would otherwise
    // cannibalise the homepage #services anchor for the same queries.
    return [
      { source: "/services", destination: "/#services", permanent: true },
      { source: "/experience", destination: "/", permanent: true },
      // "/en" is the proxy's internal rewrite target for the default
      // locale (see src/lib/i18n/publicRewrite.ts) — it must never be
      // reachable as a second public URL for the same content as "/".
      //
      // Excludes opengraph-image/icon/apple-icon/twitter-image: those are
      // Next's own generated-image file conventions, which only resolve
      // under the [locale] segment they're defined in (there is no bare
      // "/opengraph-image" to redirect to) — Next's auto-injected og:image
      // meta tag pointed straight at "/en/opengraph-image-...", and this
      // redirect was 308'ing that URL away before any crawler could fetch
      // it. Caught live: the meta tag resolved correctly, but the image
      // itself 308'd instead of serving, and not every social scraper
      // follows a redirect on an og:image URL.
      { source: "/en", destination: "/", permanent: true },
      {
        source:
          "/en/:path((?!opengraph-image|icon|apple-icon|twitter-image).*)",
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
