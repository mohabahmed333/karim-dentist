import { ImageResponse } from "next/og";
import { getPortfolioData } from "@/services/portfolio";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Dental Lounge — laser and cosmetic dentistry in New Cairo";

// Same brand navy used across the site's metadata (theme-color, JSON-LD
// image fallbacks). English-only: Satori (the renderer behind
// ImageResponse) needs an explicit embedded font file for Arabic glyph
// shaping, which isn't worth the complexity for a share-preview image.
const NAVY = "#0f2744";

export default async function OpengraphImage() {
  const portfolio = await getPortfolioData();
  const brand = portfolio.settings?.brand_name || "The Dental Lounge";
  const tagline =
    portfolio.settings?.footer_tagline ||
    "Modern laser and cosmetic dentistry with comfort-first care in New Cairo.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: NAVY,
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#9db4cf",
            marginBottom: 28,
          }}
        >
          Laser &amp; Cosmetic Dentistry — New Cairo
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 920,
          }}
        >
          {brand}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#c7d3e0",
            marginTop: 32,
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
