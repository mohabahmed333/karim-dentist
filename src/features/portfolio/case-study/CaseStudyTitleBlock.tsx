"use client";

import type {
  ParsedCaseStudySection,
  TitleContent,
} from "@/services/case_study_sections";
import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  section: ParsedCaseStudySection;
  content: TitleContent;
  previewMode?: boolean;
};

export function CaseStudyTitleBlock({ section, content }: Props) {
  const { locale } = useLocale();
  const eyebrow = pickLocalized(locale, content.eyebrow, content.eyebrow_ar);
  const title =
    pickLocalized(locale, content.title, content.title_ar) || "Untitled";

  return (
    <section
      className="cs-block cs-title"
      data-block-type="title"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner">
        {eyebrow ? (
          <p
            className="cs-title-eyebrow"
            data-customize-field={`section-${section.id}-eyebrow`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="cs-title-heading"
          data-customize-field={`section-${section.id}-title`}
        >
          {title}
        </h1>
      </div>
    </section>
  );
}
