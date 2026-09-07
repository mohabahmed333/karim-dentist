"use client";

import { MediaFigure } from "../components/MediaFigure";
import type { ColumnSlot } from "@/services/case_study_sections";
import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  slot: ColumnSlot;
  index: number;
  sectionId: string;
  previewMode?: boolean;
};

const ASPECT_CLASS: Record<ColumnSlot["aspect_ratio"], string> = {
  "16/9": "cs-aspect-16-9",
  "4/3": "cs-aspect-4-3",
  "1/1": "cs-aspect-1-1",
  "3/4": "cs-aspect-3-4",
  auto: "cs-aspect-auto",
};

export function CaseStudyColumnSlot({
  slot,
  index,
  sectionId,
  previewMode,
}: Props) {
  const { locale } = useLocale();

  if (slot.kind === "empty") {
    return <div className="cs-col cs-col--empty" aria-hidden />;
  }

  if (slot.kind === "text") {
    const heading = pickLocalized(locale, slot.heading, slot.heading_ar);
    const body = pickLocalized(locale, slot.body, slot.body_ar);
    return (
      <div
        className="cs-col cs-col--text"
        data-customize-field={`section-${sectionId}-col-${index}-text`}
      >
        {heading ? <h3 className="cs-text-heading">{heading}</h3> : null}
        {body ? (
          <div className="cs-text-body">
            {body.split("\n").map((line, i) => (
              <p key={`${sectionId}-col-${index}-${i}`}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <figure
      className={`cs-col cs-col--media cs-media-frame ${ASPECT_CLASS[slot.aspect_ratio]}`}
      data-customize-field={`section-${sectionId}-col-${index}-media`}
    >
      {slot.media_url ? (
        <MediaFigure
          src={slot.media_url}
          mediaType={slot.media_type}
          alt={slot.alt}
          previewMode={previewMode}
          className="cs-media-el"
          lazy={!previewMode}
        />
      ) : (
        <div className="cs-media-ph" aria-hidden />
      )}
    </figure>
  );
}
