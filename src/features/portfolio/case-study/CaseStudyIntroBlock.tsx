"use client";

import type {
  IntroContent,
  ParsedCaseStudySection,
} from "@/services/case_study_sections";
import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  section: ParsedCaseStudySection;
  content: IntroContent;
  previewMode?: boolean;
};

export function CaseStudyIntroBlock({ section, content }: Props) {
  const { locale } = useLocale();
  const label =
    pickLocalized(locale, content.label, content.label_ar) || "Introduction";
  const body = pickLocalized(locale, content.body, content.body_ar);

  return (
    <section
      className="cs-block cs-intro"
      data-block-type="intro"
      data-layout={section.layout_variant}
    >
      <div className="cs-block-inner cs-intro-grid">
        <h2
          className="cs-intro-label"
          data-customize-field={`section-${section.id}-label`}
        >
          {label}
        </h2>
        <div
          className="cs-intro-body cs-text-body"
          data-customize-field={`section-${section.id}-body`}
        >
          {body
            ? body.split("\n").map((line, i) => (
                <p key={`${section.id}-intro-${i}`}>{line}</p>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
