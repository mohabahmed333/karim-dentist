"use client";

import { MediaFigure } from "../components/MediaFigure";
import type {
  MediaContent,
  ParsedCaseStudySection,
} from "@/services/case_study_sections";
import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  section: ParsedCaseStudySection;
  content: MediaContent;
  previewMode?: boolean;
};

const ASPECT_CLASS: Record<MediaContent["aspect_ratio"], string> = {
  "16/9": "cs-aspect-16-9",
  "4/3": "cs-aspect-4-3",
  "1/1": "cs-aspect-1-1",
  "3/4": "cs-aspect-3-4",
  auto: "cs-aspect-auto",
};

export function CaseStudyMediaBlock({
  section,
  content,
  previewMode,
}: Props) {
  const { locale } = useLocale();
  const caption = pickLocalized(locale, content.caption, content.caption_ar);

  return (
    <section
      className="cs-block cs-media cs-media--full"
      data-block-type="media"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner">
        <figure
          className={`cs-media-frame ${ASPECT_CLASS[content.aspect_ratio]}`}
          data-customize-field={`section-${section.id}-media`}
        >
          {content.media_url ? (
            <MediaFigure
              src={content.media_url}
              mediaType={content.media_type}
              alt={content.alt}
              previewMode={previewMode}
              className="cs-media-el"
              style={{ objectPosition: content.object_position }}
              lazy={!previewMode}
            />
          ) : (
            <div className="cs-media-ph" aria-hidden />
          )}
          {caption ? (
            <figcaption className="cs-media-caption">{caption}</figcaption>
          ) : null}
        </figure>
      </div>
    </section>
  );
}
