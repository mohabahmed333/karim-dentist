import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js “N” badge in local development (errors still surface).
  devIndicators: false,
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
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
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
