"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import { MediaFigure } from "@/features/portfolio/components/MediaFigure";
import { CaseStudyPageHeading } from "@/features/portfolio/case-study/CaseStudyPageHeading";
import { DentalButton } from "./DentalButton";

type Props = {
  service: Tables<"services">;
};

/**
 * Individual service page. Deliberately reuses CaseStudyPageHeading (the
 * same h1 + intro block case studies and featured projects use) rather
 * than a bespoke heading, and the cs-media classes for the image, so this
 * matches the site's existing visual language instead of introducing a
 * new one for a single page type.
 */
export function ServiceDetailView({ service }: Props) {
  const { locale } = useLocale();
  const t = useTranslations();
  const title = pickLocalized(locale, service.title, service.title_ar);
  const description = pickLocalized(
    locale,
    service.description,
    service.description_ar,
  );

  return (
    <div className="cs-page dental-article">
      <CaseStudyPageHeading
        title={title || service.title}
        description={description || service.description}
      />
      {service.image_url ? (
        <section className="cs-block cs-media cs-media--full">
          <div className="cs-block-inner">
            <figure className="cs-media-frame cs-aspect-16-9">
              <MediaFigure
                src={service.image_url}
                mediaType={service.media_type}
                alt={title || service.title}
                className="cs-media-el"
              />
            </figure>
          </div>
        </section>
      ) : null}
      {service.tags.length > 0 ? (
        <section className="cs-block cs-title">
          <div className="cs-block-inner flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#e6e8ec] px-3 py-1 text-xs font-medium text-[#6b7280]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}
      <section className="cs-block cs-title">
        <div className="cs-block-inner">
          <DentalButton href="#contact-popup">
            {t("solutionsBook")}
          </DentalButton>
        </div>
      </section>
    </div>
  );
}
