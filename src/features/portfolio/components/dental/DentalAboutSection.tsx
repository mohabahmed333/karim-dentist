"use client";

import Image from "next/image";
import type { Tables } from "@/lib/supabase/database.types";
import { localizedCms, useLocale, useTranslations } from "@/lib/i18n";
import { dentalSectionShell } from "@/features/portfolio/lib/dentalLayout";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import type { TrustItem } from "@/services/dental/types";
import { SectionBar } from "./SectionBar";
import { ScrollReveal } from "./ScrollReveal";
import { TrustRow } from "./TrustRow";
import { cn } from "@/lib/utils";

type DentalAboutSectionProps = {
  about: Tables<"about">;
  trustItems?: TrustItem[];
  label: string;
  number: string;
};

export function DentalAboutSection({
  about,
  trustItems = [],
  label,
  number,
}: DentalAboutSectionProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const mainImage = mediaSrc(about.image_url);
  const smallImage = mediaSrc(about.copy_image_url);
  const body = localizedCms(locale, about.body, about.body_ar, t("aboutBody"));
  const hasImages = Boolean(mainImage || smallImage);
  const bothImages = Boolean(mainImage && smallImage);

  return (
    <section
      className={cn("border-t border-[#e6e8ec] bg-white", dentalSectionShell)}
      id="about"
      data-customize-section="about"
    >
      <SectionBar label={label} number={number} labelField="about_title" />

      <div
        className={cn(
          "grid items-center gap-6 lg:gap-8",
          hasImages && "lg:grid-cols-2",
        )}
      >
        {hasImages ? (
          <div className="relative min-w-0 grid gap-4">
            {smallImage ? (
              <ScrollReveal direction="left">
                <div
                  data-customize-field="copy_image_url"
                  className={cn(
                    "relative overflow-hidden border border-[#e6e8ec]",
                    bothImages ? "aspect-[2/3] w-[58%]" : "aspect-[4/3] w-full",
                  )}
                >
                  <Image
                    src={smallImage}
                    alt={t("aboutImgOneAlt")}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                </div>
              </ScrollReveal>
            ) : null}
            {mainImage ? (
              <ScrollReveal
                direction="left"
                className={cn(
                  "relative w-full",
                  bothImages && "ms-auto mt-[-2.5rem] max-w-[85%]",
                )}
              >
                <div
                  data-customize-field="image_url"
                  className="relative aspect-[3/2] w-full overflow-hidden border border-[#e6e8ec]"
                >
                  <Image
                    src={mainImage}
                    alt={t("aboutDoctorAlt")}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                    priority
                  />
                </div>
                <a
                  href="#services"
                  className="absolute bottom-4 end-4 z-10 flex size-12 items-center justify-center rounded-full bg-white text-xl shadow-[0_18px_40px_rgba(15,39,68,0.08)]"
                  aria-label={t("aboutJumpAria")}
                >
                  ↗
                </a>
              </ScrollReveal>
            ) : null}
          </div>
        ) : null}

        <div className="min-w-0">
          <ScrollReveal>
            <p className="text-2xl leading-relaxed text-[#0f2744] sm:text-3xl">
              {t("aboutLeadBefore")}
              <em className="font-serif italic">{t("aboutLeadEmOne")}</em>
              {t("aboutLeadMid")}
              <em className="font-serif italic">{t("aboutLeadEmTwo")}</em>
              {t("aboutLeadAfter")}
            </p>
          </ScrollReveal>
          <ScrollReveal className="mt-6">
            <p
              className="text-base leading-relaxed text-[#6b7280]"
              data-customize-field="body"
            >
              {body}
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="mt-12">
        <TrustRow items={trustItems} />
      </div>
    </section>
  );
}
