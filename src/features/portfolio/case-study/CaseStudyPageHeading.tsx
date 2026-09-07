"use client";

import { pickLocalized, useLocale } from "@/lib/i18n";

type Props = {
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
};

export function CaseStudyPageHeading({
  title,
  titleAr,
  description,
  descriptionAr,
}: Props) {
  const { locale } = useLocale();
  const heading = pickLocalized(locale, title, titleAr) || title;
  const body = pickLocalized(locale, description, descriptionAr);

  return (
    <section className="cs-block cs-title">
      <div className="cs-block-inner">
        <h1 className="cs-title-heading">{heading}</h1>
        {body ? <p className="cs-intro-body">{body}</p> : null}
      </div>
    </section>
  );
}
