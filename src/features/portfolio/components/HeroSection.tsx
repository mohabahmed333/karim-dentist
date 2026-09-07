import type { Tables } from "@/lib/supabase/database.types";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import { HeroCopy } from "./HeroCopy";
import { PreviewHero } from "./PreviewHero";
import { ScrubHero } from "./ScrubHero";

type HeroProps = {
  hero: Tables<"hero">;
  forceMobileMedia?: boolean;
  /** Theme customizer: static fill hero, no scroll scrub. */
  previewMode?: boolean;
};

export function HeroSection({
  hero,
  forceMobileMedia,
  previewMode,
}: HeroProps) {
  if (previewMode) {
    return <PreviewHero hero={hero} forceMobileMedia={forceMobileMedia} />;
  }

  if (hero.media_type !== "video") {
    const desktop = mediaSrc(hero.media_url_desktop ?? hero.media_url);
    const mobile = mediaSrc(hero.media_url_mobile) ?? desktop;
    const src = forceMobileMedia ? mobile : desktop;
    return (
      <section
        className="hero"
        id="top"
        data-customize-section="hero"
        aria-label="Hero"
      >
        <div className="hero-media" aria-hidden>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hero-image" src={src} alt="" />
          ) : null}
          <div className="hero-veil" />
        </div>
        <HeroCopy hero={hero} />
      </section>
    );
  }

  return <ScrubHero hero={hero} forceMobileMedia={forceMobileMedia} />;
}
