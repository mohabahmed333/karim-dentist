"use client";

import Link from "next/link";
import type { Tables } from "@/lib/supabase/database.types";
import {
  featuredDetailHref,
  toDetailPageIdSet,
} from "../lib/detailPageLink";
import { MediaFigure } from "./MediaFigure";

type Props = {
  item: Tables<"featured_projects">;
  detailPageIds?: readonly string[];
  previewMode?: boolean;
};

export function FeaturedCarouselCard({
  item,
  detailPageIds,
  previewMode,
}: Props) {
  const href = featuredDetailHref(
    item,
    toDetailPageIdSet(detailPageIds),
    previewMode,
  );

  const card = item.image_url ? (
    <MediaFigure
      src={item.image_url}
      mediaType={item.media_type}
      alt={item.title}
      previewMode={previewMode}
    />
  ) : (
    <div className="featured-ph" data-tone={item.sort_order % 5} />
  );

  const shared = {
    id: `customize-item-${item.id}`,
    className: href ? "featured-card" : "featured-card featured-card--static",
    "data-carousel-card": true as const,
    "data-customize-item": item.id,
    "aria-label": item.title,
    ...(href ? {} : { "aria-disabled": true as const }),
  };

  if (href) {
    return (
      <Link href={href} {...shared}>
        {card}
      </Link>
    );
  }

  return <article {...shared}>{card}</article>;
}
