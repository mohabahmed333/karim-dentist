"use client";

import type { Tables } from "@/lib/supabase/database.types";
import type { DentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";
import {
  featuredDetailHref,
  toDetailPageIdSet,
} from "@/features/portfolio/lib/detailPageLink";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import { localePath } from "@/lib/i18n/localePath";
import { DentalWorkCard } from "./DentalWorkCard";
import { DentalWorkSection } from "./DentalWorkSection";

type Props = {
  items: Tables<"featured_projects">[];
  detailPageIds?: readonly string[];
  copy: DentalSectionCopy["featured"];
  number: string;
};

export function DentalProjectsSection({
  items,
  detailPageIds,
  copy,
  number,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const ids = toDetailPageIdSet(detailPageIds);
  const published = items.filter((item) => item.image_url || item.title);

  return (
    <DentalWorkSection
      id="featured"
      section=""
      label={copy.label}
      heading={copy.heading}
      intro={copy.intro}
      number={number}
      empty={published.length === 0 ? t("projectsEmpty") : null}
    >
      {published.map((item) => (
        <DentalWorkCard
          key={item.id}
          itemId={item.id}
          href={localePath(locale, featuredDetailHref(item, ids) ?? "") || null}
          imageUrl={item.image_url}
          title={pickLocalized(locale, item.title, item.title_ar)}
          description={
            pickLocalized(locale, item.eyebrow, item.eyebrow_ar) || undefined
          }
        />
      ))}
    </DentalWorkSection>
  );
}
