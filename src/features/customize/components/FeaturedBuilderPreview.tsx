"use client";

import { memo } from "react";
import type { PortfolioData } from "@/services/portfolio";
import { CaseStudyPageView } from "@/features/portfolio";
import { DentalBackLink } from "@/features/portfolio/components/dental/DentalBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import type { PreviewDeviceId } from "../lib/previewDevices";

type Props = {
  data: PortfolioData;
  featuredProjectId: string;
  device: PreviewDeviceId;
  rootRef: React.Ref<HTMLDivElement | null>;
};

export const FeaturedBuilderPreview = memo(function FeaturedBuilderPreview({
  data,
  featuredProjectId,
  rootRef,
}: Props) {
  const { setIndexPreview } = useCustomizeRoute();
  const sections = data.featuredProjectSections[featuredProjectId] ?? [];
  const project = data.featured.find((item) => item.id === featuredProjectId);

  return (
    <div
      ref={rootRef}
      className="customize-preview-canvas"
      data-customize-mode=""
      data-featured-builder=""
    >
      <DentalSitePage data={data} previewMode>
        <div className="mx-auto max-w-[1180px] px-[clamp(1rem,3vw,2.5rem)] pt-8">
          <DentalBackLink
            href="/featured"
            label="Projects"
            onBackClick={() => setIndexPreview(true)}
          />
        </div>
        <CaseStudyPageView
          sections={sections}
          previewMode
          customizeItemId={featuredProjectId}
          customizeSection="featured"
          fallbackTitle={project?.title}
          fallbackDescription={project?.eyebrow}
        />
      </DentalSitePage>
    </div>
  );
});
