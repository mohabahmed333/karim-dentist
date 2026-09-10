import Image from "next/image";
import { ScrollReveal } from "./ScrollReveal";
import {
  dentalHeroContactChipClass,
  dentalHeroMediaFrameClass,
  dentalHeroMediaShellClass,
} from "@/features/portfolio/lib/dentalHeroLayout";

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
    <ScrollReveal direction="right" className={dentalHeroMediaShellClass}>
      <a href="#contact" className={dentalHeroContactChipClass}>
        {contactLabel}
      </a>
      <div className={dentalHeroMediaFrameClass}>
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-[center_20%]"
          priority
          data-customize-field="media_url"
        />
      </div>
    </ScrollReveal>
  );
}
