"use client";

import { MediaFigure } from "../components/MediaFigure";
import type {
  ParsedCaseStudySection,
  SplitContent,
} from "@/services/case_study_sections";
import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  section: ParsedCaseStudySection;
  content: SplitContent;
  previewMode?: boolean;
};

const ASPECT_CLASS: Record<SplitContent["media_aspect"], string> = {
  "16/9": "cs-aspect-16-9",
  "3/4": "cs-aspect-3-4",
  "1/1": "cs-aspect-1-1",
};

export function CaseStudySplitBlock({
  section,
  content,
  previewMode,
}: Props) {
  const { locale } = useLocale();
  const heading = pickLocalized(locale, content.heading, content.heading_ar);
  const body = pickLocalized(locale, content.body, content.body_ar);
  const ratioClass =
    content.ratio === "50/50" ? "cs-split--50" : "cs-split--40";
  const positionClass =
    content.media_position === "right" ? "cs-split--media-right" : "";
  const aspect = content.media_aspect ?? "16/9";

  return (
    <section
      className={`cs-block cs-split ${ratioClass} ${positionClass}`}
      data-block-type="split"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner cs-split-grid">
        <div className="cs-split-copy">
          {heading ? (
            <h2
              className="cs-text-heading"
              data-customize-field={`section-${section.id}-heading`}
            >
              {heading}
            </h2>
          ) : null}
          {body ? (
            <div
              className="cs-text-body"
              data-customize-field={`section-${section.id}-body`}
            >
              {body.split("\n").map((line, i) => (
                <p key={`${section.id}-split-${i}`}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
        <figure
          className={`cs-split-media cs-media-frame ${ASPECT_CLASS[aspect]}`}
          data-customize-field={`section-${section.id}-media`}
        >
          {content.media_url ? (
            <MediaFigure
              src={content.media_url}
              mediaType={content.media_type}
              alt={content.alt}
              previewMode={previewMode}
              className="cs-media-el"
              lazy={!previewMode}
            />
          ) : (
            <div className="cs-media-ph" aria-hidden />
          )}
        </figure>
      </div>
    </section>
  );
}
