import { DentalButton } from "./DentalButton";
import { ScrollReveal } from "./ScrollReveal";

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
    <div className="flex max-w-[34rem] flex-1 flex-col justify-center">
      <ScrollReveal>
        {kicker ? (
          <p
            className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#6b7280]"
            data-customize-field="kicker"
          >
            {kicker}
          </p>
        ) : null}
        <h1
          className="max-w-[11ch] text-[clamp(2.6rem,5.4vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.045em] text-[#0f2744]"
          data-customize-field="headline"
        >
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
      <ScrollReveal className="mt-[1.35rem]">
        <p
          className="mb-[1.7rem] max-w-[30rem] text-base leading-relaxed text-[#6b7280]"
          data-customize-field="body"
        >
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
