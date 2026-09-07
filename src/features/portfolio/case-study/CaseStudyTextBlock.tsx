"use client";

import type {
  ParsedCaseStudySection,
  TextContent,
} from "@/services/case_study_sections";
import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  section: ParsedCaseStudySection;
  content: TextContent;
  previewMode?: boolean;
};

export function CaseStudyTextBlock({ section, content }: Props) {
  const { locale } = useLocale();
  const heading = pickLocalized(locale, content.heading, content.heading_ar);
  const body = pickLocalized(locale, content.body, content.body_ar);
  const widthClass =
    content.width === "narrow"
      ? "cs-text--narrow"
      : content.width === "wide"
        ? "cs-text--wide"
        : "cs-text--medium";

  return (
    <section
      className={`cs-block cs-text ${widthClass} cs-align-${content.align}`}
      data-block-type="text"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner">
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
              <p key={`${section.id}-line-${i}`}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
