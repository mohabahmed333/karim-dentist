"use client";

import { useCallback, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import type { GalleryComparison } from "@/services/dental/types";
import type { DentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";
import { useTranslations } from "@/lib/i18n";
import { SectionBar } from "./SectionBar";
import { ScrollReveal } from "./ScrollReveal";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { CarouselNavButtons } from "../CarouselNavButtons";
import { HorizontalCarousel } from "../HorizontalCarousel";
import { dentalSectionShellCompact } from "@/features/portfolio/lib/dentalLayout";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import { cn } from "@/lib/utils";

type DentalGallerySectionProps = {
  comparisons: GalleryComparison[];
  copy: DentalSectionCopy["gallery"];
  number: string;
};

export function DentalGallerySection({
  comparisons,
  copy,
  number,
}: DentalGallerySectionProps) {
  const t = useTranslations();
  const [carouselApi, setCarouselApi] = useState<EmblaCarouselType>();
  const onApi = useCallback((api: EmblaCarouselType | undefined) => {
    setCarouselApi(api);
  }, []);
  const visible = [...comparisons]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter(
      (item) =>
        mediaSrc(item.before_image_url) && mediaSrc(item.after_image_url),
    );

  return (
    <section
      className={cn("border-t border-[#e6e8ec] bg-white", dentalSectionShellCompact)}
      id="gallery"
      data-customize-section="gallery"
    >
      <SectionBar label={copy.label} number={number} labelField="gallery_title" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <ScrollReveal className="max-w-md">
          <h2
            className="text-2xl font-semibold tracking-[-0.02em] text-[#0f2744] md:text-[1.75rem]"
            data-customize-field="gallery_heading"
          >
            {copy.heading}
          </h2>
          <p
            className="mt-1.5 text-sm text-[#6b7280]"
            data-customize-field="gallery_description"
          >
            {copy.intro}
          </p>
        </ScrollReveal>
        <div className="flex flex-wrap items-center gap-3">
          {visible.length > 1 ? (
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#9aa3af]">
              {t("galleryResultsCount").replace(
                "{count}",
                String(visible.length),
              )}
            </p>
          ) : null}
          {visible.length > 1 ? (
            <CarouselNavButtons api={carouselApi} />
          ) : null}
        </div>
      </div>

      {visible.length ? (
        <div id="ba-showcase">
          <HorizontalCarousel
            className="gallery-comparisons-carousel"
            label={copy.heading}
            itemCount={visible.length}
            snap
            loop={visible.length > 1}
            onApi={onApi}
          >
            {visible.map((item) => (
              <div
                key={item.id}
                className="gallery-comparison-slide"
                data-carousel-card
                data-customize-item={item.id}
              >
                <BeforeAfterSlider
                  beforeSrc={item.before_image_url}
                  afterSrc={item.after_image_url}
                  alt={item.alt_text || t("galleryFeatureAlt")}
                  beforeLabel={t("baBefore")}
                  afterLabel={t("baAfter")}
                  customizeField="before_image_url"
                />
              </div>
            ))}
          </HorizontalCarousel>
        </div>
      ) : null}
    </section>
  );
}
