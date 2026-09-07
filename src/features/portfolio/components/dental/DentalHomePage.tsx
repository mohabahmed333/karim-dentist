"use client";

import { useState } from "react";
import type { PortfolioData } from "@/services/portfolio";
import { cn } from "@/lib/utils";
import { HomeMainSections } from "@/features/portfolio/components/HomeMainSections";
import { DentalHeroSection } from "./DentalHeroSection";
import { DentalSiteFooter } from "./DentalSiteFooter";
import { GalleryLightbox } from "./GalleryLightbox";
import { SiteHeader } from "./SiteHeader";

type DentalHomePageProps = {
  data: PortfolioData;
  brand: string;
  brandLogo?: string | null;
  previewMode?: boolean;
};

export function DentalHomePage({
  data,
  brand,
  brandLogo,
  previewMode = false,
}: DentalHomePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );
  const hero = data.hero!;

  return (
    <div className={cn(previewMode && "relative")}>
      <SiteHeader
        brand={brand}
        brandLogo={brandLogo}
        hiddenSections={data.settings?.homepage_hidden_sections ?? []}
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
        contained={previewMode}
      />
      <div className="site-content min-w-0 overflow-x-clip bg-white text-[#0f2744]">
        <main className="min-w-0 overflow-x-clip">
          <DentalHeroSection
            hero={hero}
            brand={brand}
            brandLogo={brandLogo}
            clients={data.clients}
            menuOpen={menuOpen}
            onMenuToggle={() => setMenuOpen((open) => !open)}
          />
          <HomeMainSections
            data={data}
            onImageClick={(src, alt) => setLightbox({ src, alt })}
          />
        </main>
        <DentalSiteFooter
          brand={brand}
          brandLogo={brandLogo}
          footerLinks={data.footerLinks}
          settings={data.settings}
          hiddenSections={data.settings?.homepage_hidden_sections ?? []}
        />
      </div>
      <GalleryLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? ""}
        alt={lightbox?.alt ?? ""}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
