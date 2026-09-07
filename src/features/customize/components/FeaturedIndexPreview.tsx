"use client";

import { memo } from "react";
import type { PortfolioData } from "@/services/portfolio";
import { FeaturedIndexView } from "@/features/portfolio";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import type { PreviewDeviceId } from "../lib/previewDevices";

type Props = {
  data: PortfolioData;
  device: PreviewDeviceId;
  rootRef: React.RefObject<HTMLDivElement | null>;
};

export const FeaturedIndexPreview = memo(function FeaturedIndexPreview({
  data,
  rootRef,
}: Props) {
  return (
    <div
      ref={rootRef}
      className="customize-preview-canvas"
      data-customize-mode=""
      data-featured-index=""
    >
      <DentalSitePage data={data} previewMode>
        <FeaturedIndexView
          items={data.featured}
          title={data.settings?.featured_title || "Selected clinic work"}
          titleAr={data.settings?.featured_title_ar || ""}
          description={
            data.settings?.featured_description ||
            "Highlights from treatments, spaces, and studio work."
          }
          descriptionAr={data.settings?.featured_description_ar || ""}
          detailPageIds={data.featuredDetailPageIds}
          previewMode
        />
      </DentalSitePage>
    </div>
  );
});
