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
  caseStudyId: string;
  device: PreviewDeviceId;
  rootRef: React.RefObject<HTMLDivElement | null>;
};

export const CaseStudyBuilderPreview = memo(function CaseStudyBuilderPreview({
  data,
  caseStudyId,
  rootRef,
}: Props) {
  const { setIndexPreview } = useCustomizeRoute();
  const study = data.caseStudies.find((item) => item.id === caseStudyId);
  const sections = data.caseStudySections[caseStudyId] ?? [];
  const backLabel = data.settings?.case_studies_title || "Case studies";

  if (!study) {
    return (
      <div ref={rootRef} className="customize-preview-canvas p-6 text-[#0f2744]">
        Case study not found.
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="customize-preview-canvas"
      data-customize-mode=""
      data-case-study-builder=""
    >
      <DentalSitePage data={data} previewMode>
        <div className="mx-auto max-w-[1180px] px-[clamp(1rem,3vw,2.5rem)] pt-8">
          <DentalBackLink
            href="/case-studies"
            label={backLabel}
            onBackClick={() => setIndexPreview(true)}
          />
        </div>
        <CaseStudyPageView
          sections={sections}
          previewMode
          customizeItemId={caseStudyId}
          customizeSection="case-studies"
          fallbackTitle={study.title}
          fallbackDescription={study.description}
        />
      </DentalSitePage>
    </div>
  );
});
