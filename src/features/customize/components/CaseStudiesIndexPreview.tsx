"use client";

import { memo } from "react";
import type { PortfolioData } from "@/services/portfolio";
import { CaseStudiesIndexView } from "@/features/portfolio";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import type { PreviewDeviceId } from "../lib/previewDevices";

type Props = {
  data: PortfolioData;
  device: PreviewDeviceId;
  rootRef: React.RefObject<HTMLDivElement | null>;
};

export const CaseStudiesIndexPreview = memo(function CaseStudiesIndexPreview({
  data,
  rootRef,
}: Props) {
  const title = data.settings?.case_studies_title || "Case studies";
  const titleAr = data.settings?.case_studies_title_ar || "";
  const description =
    data.settings?.case_studies_description ||
    "Selected treatments and outcomes from The Dental Lounge.";
  const descriptionAr = data.settings?.case_studies_description_ar || "";

  return (
    <div
      ref={rootRef}
      className="customize-preview-canvas"
      data-customize-mode=""
      data-case-studies-index=""
    >
      <DentalSitePage data={data} previewMode>
        <CaseStudiesIndexView
          items={data.caseStudies}
          title={title}
          titleAr={titleAr}
          description={description}
          descriptionAr={descriptionAr}
          detailPageIds={data.caseStudyDetailPageIds}
          previewMode
        />
      </DentalSitePage>
    </div>
  );
});
