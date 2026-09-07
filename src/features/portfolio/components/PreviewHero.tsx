"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import { HeroCopy } from "./HeroCopy";

type Props = {
  hero: Tables<"hero">;
  forceMobileMedia?: boolean;
};

/** Non-scrub hero for the theme customizer device frame. */
export function PreviewHero({ hero, forceMobileMedia }: Props) {
  const desktop = mediaSrc(hero.media_url_desktop ?? hero.media_url);
  const mobile = mediaSrc(hero.media_url_mobile) ?? desktop;
  const src = forceMobileMedia ? mobile : desktop;
  const isVideo = hero.media_type === "video";

  return (
    <section
      className="hero preview-hero"
      id="top"
      data-customize-section="hero"
      aria-label="Hero"
    >
      <div className="hero-media" aria-hidden>
        {src && isVideo ? (
          <video
            className="hero-image"
            src={src}
            muted
            playsInline
            preload="metadata"
          />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="hero-image"
            src={src}
            alt=""
            loading="eager"
            decoding="async"
          />
        ) : null}
        <div className="hero-veil" />
      </div>
      <HeroCopy hero={hero} />
    </section>
  );
}
