"use client";

import type { PortfolioData } from "@/services/portfolio";
import type { DentalSectionCopy } from "../lib/homepageSectionCopy";
import type { HomepageSectionKey } from "../lib/homepageSectionOrder";
import { mediaSrc } from "../lib/mediaSrc";
import { DentalAboutSection } from "./dental/DentalAboutSection";
import { DentalCaseStudiesSection } from "./dental/DentalCaseStudiesSection";
import { DentalContactSection } from "./dental/DentalContactSection";
import { DentalGallerySection } from "./dental/DentalGallerySection";
import { DentalProjectsSection } from "./dental/DentalProjectsSection";
import { DentalSliderSection } from "./dental/DentalSliderSection";
import { DentalSolutionsSection } from "./dental/DentalSolutionsSection";

type Props = {
  sectionKey: HomepageSectionKey;
  data: PortfolioData;
  copy: DentalSectionCopy;
  number: string;
  onImageClick: (src: string, alt: string) => void;
};

export function HomepageSectionBlock({
  sectionKey,
  data,
  copy,
  number,
  onImageClick,
}: Props) {
  const panels = data.solutionPanels ?? [];
  const trustItems = data.trustItems ?? [];
  const comparisons = data.galleryComparisons ?? [];
  const sliderSlides = data.featured
    .map((item) => {
      const image_url = mediaSrc(item.image_url);
      return image_url ? { id: item.id, image_url } : null;
    })
    .filter((item): item is { id: string; image_url: string } => item !== null);

  switch (sectionKey) {
    case "about":
      return data.about ? (
        <DentalAboutSection
          about={data.about}
          trustItems={trustItems}
          label={copy.about.label}
          number={number}
        />
      ) : null;
    case "services":
      return (
        <DentalSolutionsSection
          panels={panels}
          services={data.services}
          copy={copy.services}
          number={number}
        />
      );
    case "gallery":
      return (
        <DentalGallerySection
          comparisons={comparisons}
          copy={copy.gallery}
          number={number}
        />
      );
    case "slider":
      return (
        <DentalSliderSection
          slides={sliderSlides}
          copy={copy.slider}
          number={number}
          onImageClick={onImageClick}
        />
      );
    case "case-studies":
      return (
        <DentalCaseStudiesSection
          items={data.caseStudies}
          detailPageIds={data.caseStudyDetailPageIds}
          copy={copy.caseStudies}
          number={number}
        />
      );
    case "featured":
      return (
        <DentalProjectsSection
          items={data.featured}
          detailPageIds={data.featuredDetailPageIds}
          copy={copy.featured}
          number={number}
        />
      );
    case "contact":
      return (
        <DentalContactSection
          settings={data.settings}
          services={data.services}
          copy={copy.contact}
          number={number}
        />
      );
    default:
      return null;
  }
}
