"use client";

import type { Tables } from "@/lib/supabase/database.types";
import type { DentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";
import {
  caseStudyDetailHref,
  toDetailPageIdSet,
} from "@/features/portfolio/lib/detailPageLink";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import { localePath } from "@/lib/i18n/localePath";
import { DentalWorkCard } from "./DentalWorkCard";
import { DentalWorkSection } from "./DentalWorkSection";

type Props = {
  items: Tables<"case_studies">[];
  detailPageIds?: readonly string[];
  copy: DentalSectionCopy["caseStudies"];
  number: string;
};

export function DentalCaseStudiesSection({
  items,
  detailPageIds,
  copy,
  number,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const ids = toDetailPageIdSet(detailPageIds);

  return (
    <DentalWorkSection
      id="case-studies"
      section="case-studies"
      label={copy.label}
      heading={copy.heading}
      intro={copy.intro}
      number={number}
      labelField="case_studies_title"
      introField="case_studies_description"
      empty={items.length === 0 ? t("caseStudiesEmpty") : null}
    >
      {items.map((item) => (
        <DentalWorkCard
          key={item.id}
          itemId={item.id}
          href={localePath(locale, caseStudyDetailHref(item, ids) ?? "") || null}
          imageUrl={item.media_url}
          title={pickLocalized(locale, item.title, item.title_ar)}
          description={pickLocalized(
            locale,
            item.description,
            item.description_ar,
          )}
        />
      ))}
    </DentalWorkSection>
  );
}
