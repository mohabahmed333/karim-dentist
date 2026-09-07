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

export function FeaturedIndexCard({ item, detailPageIds, previewMode }: Props) {
  const href = featuredDetailHref(
    item,
    toDetailPageIdSet(detailPageIds),
    previewMode,
  );

  const card = (
    <>
      <div className="fp-index-card-media" data-customize-field="image_url">
        {item.image_url ? (
          <MediaFigure
            src={item.image_url}
            mediaType={item.media_type}
            alt={item.title}
            previewMode={previewMode}
          />
        ) : (
          <div className="fp-index-card-ph" data-tone={item.sort_order % 5} />
        )}
      </div>
      <h2 className="fp-index-card-title" data-customize-field="title">
        {item.title}
      </h2>
    </>
  );

  const shared = {
    id: `customize-item-${item.id}`,
    className: href ? "fp-index-card" : "fp-index-card fp-index-card--static",
    "data-customize-item": item.id,
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
