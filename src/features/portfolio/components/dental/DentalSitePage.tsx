"use client";

import type { ReactNode } from "react";
import type { PortfolioData } from "@/services/portfolio";
import { cn } from "@/lib/utils";
import { DentalSiteFooter } from "./DentalSiteFooter";
import { SiteHeader } from "./SiteHeader";

type Props = {
  data: PortfolioData;
  children: ReactNode;
  className?: string;
  /** Customize live preview — keep chrome inside the device frame. */
  previewMode?: boolean;
};

export function DentalSitePage({
  data,
  children,
  className,
  previewMode = false,
}: Props) {
  const brand = data.settings?.brand_name ?? "The Dental Lounge";
  const brandLogo = data.settings?.brand_logo_url ?? null;
  const hidden = data.settings?.homepage_hidden_sections ?? [];

  return (
    <div
      className={cn(
        "min-h-screen bg-white text-[#0f2744]",
        previewMode && "relative",
      )}
    >
      <SiteHeader
        brand={brand}
        brandLogo={brandLogo}
        hiddenSections={hidden}
        pinned
        location="inner"
        contained={previewMode}
      />
      <div
        className={cn("site-content", !previewMode && "pt-[4.25rem]")}
      >
        <main className={className}>{children}</main>
        <DentalSiteFooter
          brand={brand}
          brandLogo={brandLogo}
          footerLinks={data.footerLinks}
          settings={data.settings}
          hiddenSections={hidden}
        />
      </div>
    </div>
  );
}
