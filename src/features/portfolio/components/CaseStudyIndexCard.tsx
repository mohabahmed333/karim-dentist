import Link from "next/link";
import type { Tables } from "@/lib/supabase/database.types";
import {
  caseStudyDetailHref,
  toDetailPageIdSet,
} from "../lib/detailPageLink";
import { MediaFigure } from "./MediaFigure";

type Props = {
  item: Tables<"case_studies">;
  detailPageIds?: readonly string[];
  previewMode?: boolean;
};

export function CaseStudyIndexCard({ item, detailPageIds, previewMode }: Props) {
  const href = caseStudyDetailHref(
    item,
    toDetailPageIdSet(detailPageIds),
    previewMode,
  );

  const media = (
    <div className="cs-index-card-media" data-customize-field="media_url">
      {item.media_url ? (
        <MediaFigure
          src={item.media_url}
          mediaType={item.media_type}
          alt={item.title}
          previewMode={previewMode}
        />
      ) : (
        <div className="cs-index-card-ph" />
      )}
    </div>
  );

  const meta = (
    <div className="cs-index-card-meta">
      <h2 className="cs-index-card-title" data-customize-field="title">
        {item.title}
      </h2>
      <p className="cs-index-card-desc" data-customize-field="description">
        {item.description}
      </p>
    </div>
  );

  const shared = {
    id: `customize-item-${item.id}`,
    className: href ? "cs-index-card" : "cs-index-card cs-index-card--static",
    "data-customize-item": item.id,
    ...(href ? {} : { "aria-disabled": true as const }),
  };

  if (href) {
    return (
      <Link href={href} {...shared}>
        {media}
        {meta}
      </Link>
    );
  }

  return (
    <article {...shared}>
      {media}
      {meta}
    </article>
  );
}
