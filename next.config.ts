import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js “N” badge in local development (errors still surface).
  devIndicators: false,
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
