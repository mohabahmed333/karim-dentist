"use client";

import { MediaFigure } from "../components/MediaFigure";
import type {
  ParsedCaseStudySection,
  TextGridContent,
} from "@/services/case_study_sections";
import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  section: ParsedCaseStudySection;
  content: TextGridContent;
  previewMode?: boolean;
};

export function CaseStudyTextGridBlock({
  section,
  content,
  previewMode,
}: Props) {
  const { locale } = useLocale();
  const heading = pickLocalized(locale, content.heading, content.heading_ar);
  const body = pickLocalized(locale, content.body, content.body_ar);
  const positionClass =
    content.text_position === "right" ? "cs-text-grid--text-right" : "";

  return (
    <section
      className={`cs-block cs-text-grid ${positionClass}`}
      data-block-type="text_grid"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner cs-text-grid-layout">
        <div className="cs-text-grid-copy">
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
                <p key={`${section.id}-tg-${i}`}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
        <div className="cs-text-grid-media">
          {content.items.map((item, index) => (
            <figure
              key={`${section.id}-tg-item-${index}`}
              className="cs-text-grid-item cs-media-frame cs-aspect-1-1"
              data-customize-field={`section-${section.id}-grid-${index}`}
            >
              {item.media_url ? (
                <MediaFigure
                  src={item.media_url}
                  mediaType={item.media_type}
                  alt={item.alt}
                  previewMode={previewMode}
                  className="cs-media-el"
                  lazy={!previewMode}
                />
              ) : (
                <div className="cs-media-ph" aria-hidden />
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
