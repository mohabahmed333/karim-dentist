"use client";

import Image from "next/image";
import type { Tables } from "@/lib/supabase/database.types";
import type { SolutionPanel } from "@/services/dental/types";
import type { DentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";
import { dentalSectionY } from "@/features/portfolio/lib/dentalLayout";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import { localizedCms, useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DentalButton } from "./DentalButton";
import { ScrollReveal } from "./ScrollReveal";
import { ServicesAutoplayCarousel } from "./ServicesAutoplayCarousel";

type DentalSolutionsSectionProps = {
  panels: SolutionPanel[];
  services: Tables<"services">[];
  copy: DentalSectionCopy["services"];
  number: string;
};

export function DentalSolutionsSection({
  panels,
  services,
  copy,
  number,
}: DentalSolutionsSectionProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <section
      className={cn("border-t border-[#e6e8ec] bg-white", dentalSectionY)}
      id="services"
      data-customize-section="services"
    >
      <ScrollReveal>
        <div className="mb-6 grid gap-6 px-[var(--page-gutter)] pb-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2
            className="max-w-[18ch] text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0f2744]"
            data-customize-field="solutions_title"
          >
            {copy.solutionsTitle}
          </h2>
          <p
            className="max-w-[42rem] text-base text-[#6b7280]"
            data-customize-field="solutions_description"
          >
            {copy.solutionsIntro}
          </p>
        </div>
      </ScrollReveal>

      <div className="mb-8 grid auto-rows-fr gap-0 lg:grid-cols-3 lg:items-stretch">
        {panels.map((panel, index) => {
          const panelDefaults = [
            {
              title: t("solutionsLaserTitle"),
              body: t("solutionsLaserText"),
            },
            { title: t("solutionsDoctorTitle"), body: "" },
            {
              title: t("solutionsSmileTitle"),
              body: t("solutionsSmileText"),
            },
          ][index];
          const title = localizedCms(
            locale,
            panel.title,
            panel.title_ar,
            panelDefaults?.title ?? panel.title,
          );
          const body = localizedCms(
            locale,
            panel.body,
            panel.body_ar,
            panelDefaults?.body ?? panel.body,
          );
          const panelImage = mediaSrc(panel.image_url);
          return (
            <ScrollReveal
              key={panel.id}
              className="h-full min-h-[640px]"
              direction={index === 0 ? "left" : index === 2 ? "right" : "up"}
            >
              <article
                className={
                  panel.variant === "photo"
                    ? "relative h-full min-h-[640px] overflow-hidden bg-[#0a1e2a]"
                    : "flex h-full min-h-[640px] flex-col overflow-hidden bg-[linear-gradient(165deg,#12384a_0%,#0a1e2a_55%,#07151c_100%)] p-[clamp(1.25rem,2.5vw,2rem)] text-white"
                }
                data-customize-item={panel.id}
              >
                {panel.variant === "photo" ? (
                  <>
                    {panelImage ? (
                      <div data-customize-field="image_url" className="absolute inset-0">
                        <Image
                          src={panelImage}
                          alt={t("solutionsDoctorAlt")}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover object-top"
                        />
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-[1.05rem] bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 pb-6 pt-7 text-center text-white">
                      <h3
                        className="max-w-[11ch] text-[clamp(1.2rem,1.7vw,1.45rem)] font-extrabold uppercase leading-[1.12] tracking-[-0.02em]"
                        data-customize-field="title"
                      >
                        {title}
                      </h3>
                      <DentalButton
                        href={panel.link_href || "#contact"}
                        className="min-h-12 rounded-[4px] bg-white px-[1.45rem] py-[0.85rem] font-bold text-[#111] hover:bg-[#f3f4f6]"
                      >
                        {t("solutionsBook")}
                      </DentalButton>
                    </div>
                  </>
                ) : (
                  <>
                    <a
                      href={panel.link_href || "#gallery"}
                      className="absolute end-[1.15rem] top-[1.15rem] z-[2] grid size-10 place-items-center rounded-[6px] border border-white/12 bg-black/40 text-[1.05rem]"
                      aria-label={
                        index === 0
                          ? t("solutionsLaserAria")
                          : t("solutionsSmileAria")
                      }
                    >
                      ↗
                    </a>
                    <div className="relative z-[1] mb-4 max-w-[17rem] shrink-0 pe-11">
                      <h3
                        className="mb-[0.65rem] text-[clamp(1.15rem,1.6vw,1.4rem)] font-extrabold uppercase leading-[1.12] tracking-[-0.02em]"
                        data-customize-field="title"
                      >
                        {title}
                      </h3>
                      <p
                        className="text-[0.92rem] leading-normal text-white/75"
                        data-customize-field="body"
                      >
                        {body}
                      </p>
                    </div>
                    {panelImage ? (
                      <div
                        data-customize-field="image_url"
                        className="relative mt-auto min-h-0 w-full flex-1 overflow-hidden rounded-[2px]"
                      >
                        <Image
                          src={panelImage}
                          alt={title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover object-center"
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </article>
            </ScrollReveal>
          );
        })}
      </div>

      <div className="px-[var(--page-gutter)]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <span
            className="inline-flex min-h-9 items-center rounded-full border border-[#e6e8ec] px-[0.95rem] py-[0.45rem] text-[0.92rem] font-medium text-[#6b7280]"
            data-customize-field="services_title"
          >
            {copy.label}
          </span>
          <span className="text-[0.95rem] text-[#6b7280]">{number}</span>
        </div>
        <ScrollReveal>
          <h2
            className="mb-[0.9rem] max-w-[18ch] text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#0f2744]"
            data-customize-field="services_heading"
          >
            {copy.heading}
          </h2>
          <p
            className="mb-8 max-w-[42rem] text-[#6b7280]"
            data-customize-field="services_description"
          >
            {copy.intro}
          </p>
        </ScrollReveal>

        <ServicesAutoplayCarousel services={services} />
      </div>
    </section>
  );
}
