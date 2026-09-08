"use client";

import { memo } from "react";
import type { PortfolioData } from "@/services/portfolio";
import { ServicesSection, SiteFooter, SiteNav } from "@/features/portfolio";
import { TALES_TAGLINE } from "@/features/portfolio/lib/footerTaglineLines";
import { contactFromSettings } from "@/features/portfolio/lib/contactInfo";
import type { PreviewDeviceId } from "../lib/previewDevices";

type Props = {
  data: PortfolioData;
  device: PreviewDeviceId;
  rootRef: React.Ref<HTMLDivElement | null>;
};

export const ServicesIndexPreview = memo(function ServicesIndexPreview({
  data,
  rootRef,
}: Props) {
  const brand = data.settings?.brand_name ?? "Imagineer";
  const brandLogo = data.settings?.brand_logo_url ?? null;
  const contact = contactFromSettings(data.settings);
  const title = data.settings?.services_title ?? "Services";

  return (
    <div
      ref={rootRef}
      className="customize-preview-canvas"
      data-customize-mode=""
      data-services-index=""
    >
      <SiteNav brand={brand} brandLogo={brandLogo} contact={contact} />
      <main>
        <ServicesSection
          items={data.services}
          title={title}
          previewMode
        />
      </main>
      <SiteFooter
        brand={brand}
        tagline={data.settings?.footer_tagline ?? TALES_TAGLINE}
        taglineImageUrl={data.settings?.footer_tagline_image_url}
        email={data.settings?.contact_email ?? "hello@imagineer.studio"}
        footerLinks={data.footerLinks}
        socialLinks={data.socialLinks}
      />
    </div>
  );
});
