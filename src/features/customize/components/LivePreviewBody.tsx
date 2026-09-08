"use client";

import type { PortfolioData } from "@/services/portfolio";
import type { PreviewDeviceId } from "../lib/previewDevices";
import type { CustomizeSection } from "../types";
import { CaseStudiesIndexPreview } from "./CaseStudiesIndexPreview";
import { CaseStudyBuilderPreview } from "./CaseStudyBuilderPreview";
import { FeaturedBuilderPreview } from "./FeaturedBuilderPreview";
import { FeaturedIndexPreview } from "./FeaturedIndexPreview";
import { PreviewCanvas } from "./PreviewCanvas";
import { ServicesIndexPreview } from "./ServicesIndexPreview";

type Props = {
  section: CustomizeSection;
  itemId: string | null;
  device: PreviewDeviceId;
  builderMode?: boolean;
  indexPreview: boolean;
  data: PortfolioData;
  rootRef: React.Ref<HTMLDivElement | null>;
};

export function LivePreviewBody({
  section,
  itemId,
  device,
  builderMode,
  indexPreview,
  data,
  rootRef,
}: Props) {
  if (builderMode && section === "case-studies" && itemId) {
    return (
      <CaseStudyBuilderPreview
        data={data}
        caseStudyId={itemId}
        device={device}
        rootRef={rootRef}
      />
    );
  }
  if (builderMode && section === "slider" && itemId) {
    return (
      <FeaturedBuilderPreview
        data={data}
        featuredProjectId={itemId}
        device={device}
        rootRef={rootRef}
      />
    );
  }
  if (section === "case-studies" && !builderMode && indexPreview) {
    return (
      <CaseStudiesIndexPreview data={data} device={device} rootRef={rootRef} />
    );
  }
  if (section === "slider" && !builderMode && indexPreview) {
    return (
      <FeaturedIndexPreview data={data} device={device} rootRef={rootRef} />
    );
  }
  if (section === "services" && indexPreview) {
    return (
      <ServicesIndexPreview data={data} device={device} rootRef={rootRef} />
    );
  }
  return <PreviewCanvas data={data} device={device} rootRef={rootRef} />;
}
