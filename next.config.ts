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
