"use client";

import type { Tables } from "@/lib/supabase/database.types";
import type { DentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";
import { pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import { SectionBar } from "./SectionBar";
import { ScrollReveal } from "./ScrollReveal";
import { dentalSectionShellCompact } from "@/features/portfolio/lib/dentalLayout";
import { cn } from "@/lib/utils";

type Faq = Tables<"faqs">;

type Props = {
  items: Faq[];
  copy: DentalSectionCopy["faq"];
  number: string;
};

/**
 * Native <details>/<summary> accordion: no JS state, no opacity-0-until-
 * IntersectionObserver dance — every question and answer is in the SSR
 * HTML and already visible to a crawler that never runs JS, exactly the
 * class of bug ScrollReveal had before it was fixed.
 */
export function DentalFaqSection({ items, copy, number }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const visible = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section
      className={cn("border-t border-[#e6e8ec] bg-white", dentalSectionShellCompact)}
      id="faq"
      data-customize-section="faq"
    >
      <SectionBar label={copy.label} number={number} labelField="faq_title" />
      <ScrollReveal>
        <h2
          className="max-w-xl text-3xl font-semibold text-[#0f2744]"
          data-customize-field="faq_heading"
        >
          {copy.heading}
        </h2>
        {copy.intro ? (
          <p
            className="mt-4 max-w-2xl text-[#6b7280]"
            data-customize-field="faq_description"
          >
            {copy.intro}
          </p>
        ) : null}
      </ScrollReveal>
      {visible.length === 0 ? (
        <p className="mt-10 text-sm text-[#6b7280]">{t("faqEmpty")}</p>
      ) : (
        <div className="mt-10 divide-y divide-[#e6e8ec] border-t border-[#e6e8ec]">
          {visible.map((item) => {
            const question = pickLocalized(locale, item.question, item.question_ar);
            const answer = pickLocalized(locale, item.answer, item.answer_ar);
            return (
              <details key={item.id} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-[#0f2744] marker:content-none">
                  {question}
                  <span
                    aria-hidden
                    className="shrink-0 text-2xl leading-none text-[#6b7280] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                {answer ? (
                  <p className="mt-3 max-w-2xl text-[#6b7280]">{answer}</p>
                ) : null}
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
