import { DentalButton } from "./DentalButton";
import { ScrollReveal } from "./ScrollReveal";
import {
  dentalHeroBodyClass,
  dentalHeroCopyShellClass,
  dentalHeroHeadlineClass,
} from "@/features/portfolio/lib/dentalHeroLayout";

type Props = {
  kicker: string;
  headline: string;
  accent: string;
  after: string;
  body: string;
  cta: string;
  ctaHref: string;
};

export function DentalHeroCopy({
  kicker,
  headline,
  accent,
  after,
  body,
  cta,
  ctaHref,
}: Props) {
  return (
    <div className={dentalHeroCopyShellClass}>
      <ScrollReveal>
        {kicker ? (
          <p
            className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#6b7280]"
            data-customize-field="kicker"
          >
            {kicker}
          </p>
        ) : null}
        <h1 className={dentalHeroHeadlineClass} data-customize-field="headline">
          {headline}
          {accent ? (
            <em
              className="font-serif text-[1.05em] font-normal italic text-[#0f2744]"
              data-customize-field="accent"
            >
              {accent}
            </em>
          ) : null}
          {after}
        </h1>
      </ScrollReveal>
      <ScrollReveal className="mt-3 sm:mt-[1.35rem]">
        <p className={dentalHeroBodyClass} data-customize-field="body">
          {body}
        </p>
      </ScrollReveal>
      <ScrollReveal>
        <DentalButton href={ctaHref}>
          {cta}
          <span aria-hidden="true">↗</span>
        </DentalButton>
      </ScrollReveal>
    </div>
  );
}
