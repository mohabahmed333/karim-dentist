import Image from "next/image";
import { ScrollReveal } from "./ScrollReveal";

type Props = {
  image: string;
  contactLabel: string;
  imageAlt: string;
};

export function DentalHeroMedia({
  image,
  contactLabel,
  imageAlt,
}: Props) {
  return (
    <ScrollReveal
      direction="right"
      className="relative isolate min-h-[360px] w-full lg:min-h-[860px]"
    >
      <a
        href="#contact"
        className="absolute end-5 top-5 z-20 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a1d37] shadow-[0_8px_24px_rgba(10,29,55,0.08)]"
      >
        {contactLabel}
      </a>
      <div className="absolute inset-0 overflow-hidden rounded-[40px] sm:rounded-[48px] lg:rounded-[56px]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
          data-customize-field="media_url"
        />
      </div>
    </ScrollReveal>
  );
}
