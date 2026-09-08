"use client";

import { memo } from "react";
import { DentalHomePage } from "@/features/portfolio/components/dental/DentalHomePage";
import type { PortfolioData } from "@/services/portfolio";
import type { PreviewDeviceId } from "../lib/previewDevices";

type Props = {
  data: PortfolioData;
  device: PreviewDeviceId;
  rootRef: React.Ref<HTMLDivElement | null>;
};

export const PreviewCanvas = memo(function PreviewCanvas({
  data,
  device: _device,
  rootRef,
}: Props) {
  const brand = data.settings?.brand_name ?? "The Dental Lounge";
  const brandLogo = data.settings?.brand_logo_url ?? null;

  return (
    <div
      ref={rootRef}
      className="customize-preview-canvas"
      data-customize-mode=""
    >
      <DentalHomePage
        data={data}
        brand={brand}
        brandLogo={brandLogo}
        previewMode
      />
    </div>
  );
});
