"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { useInfiniteBatch } from "../hooks/useInfiniteBatch";
import { FeaturedCarouselCard } from "./FeaturedCarouselCard";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { SectionHeading } from "./SectionHeading";

type Props = {
  items: Tables<"featured_projects">[];
  detailPageIds?: readonly string[];
  previewMode?: boolean;
};

export function FeaturedSection({ items, detailPageIds, previewMode }: Props) {
  const { visible, hasMore, loadMore } = useInfiniteBatch(items, {
    enabled: !previewMode,
  });

  if (!items.length) return null;
  return (
    <section
      className="featured"
      id="featured"
      data-customize-section="featured"
    >
      <SectionHeading className="section-header--flush">
        Featured Projects
      </SectionHeading>
      <HorizontalCarousel
        className="featured-carousel"
        label="Featured projects"
        itemCount={visible.length}
        onNearEnd={hasMore ? loadMore : undefined}
      >
        {visible.map((item) => (
          <FeaturedCarouselCard
            key={item.id}
            item={item}
            detailPageIds={detailPageIds}
            previewMode={previewMode}
          />
        ))}
      </HorizontalCarousel>
    </section>
  );
}
