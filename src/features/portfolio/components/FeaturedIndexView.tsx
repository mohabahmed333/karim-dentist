"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { useInfiniteBatch } from "../hooks/useInfiniteBatch";
import {
  featuredDetailHref,
  toDetailPageIdSet,
} from "../lib/detailPageLink";
import { DentalWorkCard } from "./dental/DentalWorkCard";
import { DentalWorkSection } from "./dental/DentalWorkSection";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";

type Props = {
  items: Tables<"featured_projects">[];
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  detailPageIds?: readonly string[];
  previewMode?: boolean;
};

export function FeaturedIndexView({
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
  const published = visible.filter((item) => item.image_url || item.title);
  const heading = pickLocalized(locale, title, titleAr) || title;
  const intro = pickLocalized(locale, description, descriptionAr) || description;

  return (
    <DentalWorkSection
      id="featured"
      section=""
      label={t("projectsLabel")}
      heading={heading}
      intro={intro}
      number=""
      empty={items.length === 0 ? t("projectsEmpty") : null}
    >
      {published.map((item) => (
        <DentalWorkCard
          key={item.id}
          itemId={item.id}
          href={featuredDetailHref(item, ids, previewMode)}
          imageUrl={item.image_url}
          title={pickLocalized(locale, item.title, item.title_ar)}
          description={
            pickLocalized(locale, item.eyebrow, item.eyebrow_ar) || undefined
          }
        />
      ))}
      {hasMore ? (
        <div ref={sentinelRef} className="col-span-full h-4" aria-hidden />
      ) : null}
    </DentalWorkSection>
  );
}
