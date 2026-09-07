import Link from "next/link";
import type { Tables } from "@/lib/supabase/database.types";
import {
  caseStudyDetailHref,
  toDetailPageIdSet,
} from "../lib/detailPageLink";
import { CaseStudyCredits } from "./CaseStudyCredits";
import { MediaFigure } from "./MediaFigure";

type Props = {
  item: Tables<"case_studies">;
  detailPageIds?: readonly string[];
  previewMode?: boolean;
};

export function CaseStudyCard({ item, detailPageIds, previewMode }: Props) {
  const tags =
    item.tags?.length > 0
      ? item.tags
      : [item.category].filter(Boolean).map(String);
  const href = caseStudyDetailHref(
    item,
    toDetailPageIdSet(detailPageIds),
    previewMode,
  );

  const inner = (
    <>
      <h3 data-customize-field="title">{item.title}</h3>
      <div className="case-media" data-customize-field="media_url">
        {item.media_url ? (
          <MediaFigure
            src={item.media_url}
            mediaType={item.media_type}
            previewMode={previewMode}
          />
        ) : (
          <div className="case-ph" />
        )}
      </div>
      <div className="case-body">
        <div className="case-meta-row">
          <span data-customize-field="client">{item.client ?? "Client"}</span>
          <span data-customize-field="tags">
            {tags.join(" · ") || "Production"}
          </span>
          <span>
            <span data-customize-field="year">{item.year ?? ""}</span>
            {item.year && item.category ? " " : null}
            <span data-customize-field="category">{item.category ?? ""}</span>
            {!item.year && !item.category ? "Project" : null}
          </span>
        </div>
        <p className="case-desc" data-customize-field="description">
          {item.description}
        </p>
        <CaseStudyCredits item={item} showDetailLink={Boolean(href)} />
        {previewMode ? (
          <p className="case-page-hint" data-customize-ignore="">
            Open card settings to edit the full case-study page.
          </p>
        ) : null}
      </div>
    </>
  );

  const shared = {
    id: `customize-item-${item.id}`,
    className: href ? "case-card" : "case-card case-card--static",
    "data-carousel-card": true as const,
    "data-customize-item": item.id,
    ...(href ? {} : { "aria-disabled": true as const }),
  };

  if (href) {
    return (
      <Link href={href} {...shared}>
        {inner}
      </Link>
    );
  }

  return <article {...shared}>{inner}</article>;
}
