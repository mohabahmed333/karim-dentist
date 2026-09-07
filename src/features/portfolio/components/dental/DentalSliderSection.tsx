"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { DentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";
import { useTranslations } from "@/lib/i18n";
import { SectionBar } from "./SectionBar";
import { ScrollReveal } from "./ScrollReveal";
import { dentalSectionShellCompact } from "@/features/portfolio/lib/dentalLayout";
import { cn } from "@/lib/utils";

type SliderSlide = {
  id: string;
  image_url: string;
};

type DentalSliderSectionProps = {
  slides: SliderSlide[];
  copy: DentalSectionCopy["slider"];
  number: string;
  onImageClick: (src: string, alt: string) => void;
};

export function DentalSliderSection({
  slides,
  copy,
  number,
  onImageClick,
}: DentalSliderSectionProps) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement | undefined;
    if (!slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, [index]);

  const prev = () =>
    setIndex((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setIndex((current) => (current + 1) % slides.length);

  return (
    <section
      className={cn(
        "border-t border-[#e6e8ec] bg-[#f7f8fa]",
        dentalSectionShellCompact,
      )}
      id="more-images"
      data-customize-section="slider"
    >
      <SectionBar label={copy.label} number={number} labelField="featured_title" />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <ScrollReveal className="max-w-md">
          <h2
            className="text-2xl font-semibold tracking-[-0.02em] text-[#0f2744] md:text-[1.75rem]"
            data-customize-field="slider_heading"
          >
            {copy.heading}
          </h2>
          <p
            className="mt-1.5 text-sm text-[#6b7280]"
            data-customize-field="featured_description"
          >
            {copy.intro}
          </p>
        </ScrollReveal>
        <div className="flex gap-1.5" data-customize-ignore="">
          <button
            id="slider-prev"
            type="button"
            className="flex h-9 w-9 items-center justify-center border border-[#d7dbe2] bg-white text-lg text-[#0f2744] transition-colors hover:border-[#0f2744] rtl:rotate-180"
            aria-label={t("sliderPrev")}
            onClick={(event) => {
              event.stopPropagation();
              prev();
            }}
          >
            ‹
          </button>
          <button
            id="slider-next"
            type="button"
            className="flex h-9 w-9 items-center justify-center border border-[#d7dbe2] bg-white text-lg text-[#0f2744] transition-colors hover:border-[#0f2744] rtl:rotate-180"
            aria-label={t("sliderNext")}
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div id="slider-viewport" className="overflow-hidden">
        <div
          id="slider-track"
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, imageIndex) => (
            <button
              key={slide.id}
              type="button"
              className="w-[min(220px,68vw)] shrink-0 snap-start overflow-hidden border border-[#e6e8ec] bg-white text-start"
              data-customize-item={slide.id}
              onClick={() =>
                onImageClick(
                  slide.image_url,
                  t(`sliderImage${imageIndex + 1}Alt` as never) || "",
                )
              }
            >
              <div data-customize-field="image_url">
                <Image
                  src={slide.image_url}
                  alt=""
                  width={280}
                  height={360}
                  className="h-52 w-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
