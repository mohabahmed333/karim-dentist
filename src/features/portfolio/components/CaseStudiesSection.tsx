"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { useInfiniteBatch } from "../hooks/useInfiniteBatch";
import { CaseStudyCard } from "./CaseStudyCard";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { SectionHeading } from "./SectionHeading";

type Props = {
  items: Tables<"case_studies">[];
  detailPageIds?: readonly string[];
  previewMode?: boolean;
};

export function CaseStudiesSection({ items, detailPageIds, previewMode }: Props) {
  const { visible, hasMore, loadMore } = useInfiniteBatch(items, {
    enabled: !previewMode,
  });

  if (!items.length) return null;
  return (
    <section
      className="section section-flush"
      id="case-studies"
      data-customize-section="case-studies"
    >
      <SectionHeading className="section-header--flush">
        Case Studies
      </SectionHeading>
      <HorizontalCarousel
        label="Case studies"
        itemCount={visible.length}
        onNearEnd={hasMore ? loadMore : undefined}
      >
        {visible.map((item) => (
          <CaseStudyCard
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
