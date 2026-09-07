"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { useInfiniteBatch } from "../hooks/useInfiniteBatch";
import {
  caseStudyDetailHref,
  toDetailPageIdSet,
} from "../lib/detailPageLink";
import { DentalWorkCard } from "../components/dental/DentalWorkCard";
import { DentalWorkSection } from "../components/dental/DentalWorkSection";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";

type Props = {
  items: Tables<"case_studies">[];
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  detailPageIds?: readonly string[];
  previewMode?: boolean;
};

export function CaseStudiesIndexView({
  items,
  title,
  titleAr,
  description,
  descriptionAr,
  detailPageIds,
  previewMode,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const { visible, hasMore, sentinelRef } = useInfiniteBatch(items, {
    enabled: !previewMode,
  });
  const ids = toDetailPageIdSet(detailPageIds);
  const heading = pickLocalized(locale, title, titleAr) || title;
  const intro = pickLocalized(locale, description, descriptionAr) || description;

  return (
    <DentalWorkSection
      id="case-studies"
      section="case-studies"
      label={t("caseStudiesLabel")}
      heading={heading}
      intro={intro}
      number=""
      labelField="case_studies_title"
      introField="case_studies_description"
      empty={items.length === 0 ? t("caseStudiesEmpty") : null}
    >
      {visible.map((item) => (
        <DentalWorkCard
          key={item.id}
          itemId={item.id}
          href={caseStudyDetailHref(item, ids, previewMode)}
          imageUrl={item.media_url}
          title={pickLocalized(locale, item.title, item.title_ar)}
          description={pickLocalized(
            locale,
            item.description,
            item.description_ar,
          )}
        />
      ))}
      {hasMore ? (
        <div ref={sentinelRef} className="col-span-full h-4" aria-hidden />
      ) : null}
    </DentalWorkSection>
  );
}
