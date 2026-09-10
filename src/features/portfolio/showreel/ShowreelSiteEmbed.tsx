"use client";

import { useEffect } from "react";
import { DentalHomePage } from "@/features/portfolio/components/dental/DentalHomePage";
import { postShowreelEmbedReady } from "./showreelEmbedMessage";
import type { PortfolioData } from "@/services/portfolio";

type Props = {
  data: PortfolioData;
  viewport?: "desktop" | "mobile";
};

export function ShowreelSiteEmbed({ data, viewport = "desktop" }: Props) {
  const brand = data.settings?.brand_name ?? "The Dental Lounge";
  const brandLogo =
    data.settings?.brand_logo_url ??
    "/dental/766800441_18084577118253727_1449914596899119909_n.jpg";

  useEffect(() => {
    const raf = requestAnimationFrame(() => postShowreelEmbedReady("site"));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={
        viewport === "mobile"
          ? "showreel-demo-site is-mobile"
          : "showreel-demo-site"
      }
    >
      <DentalHomePage data={data} brand={brand} brandLogo={brandLogo} />
    </div>
  );
}
