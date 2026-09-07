"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import { useHeroScrub } from "../hooks/useHeroScrub";
import { HeroCopy } from "./HeroCopy";

type Props = {
  hero: Tables<"hero">;
  forceMobileMedia?: boolean;
};

export function ScrubHero({ hero, forceMobileMedia }: Props) {
  const desktop = mediaSrc(hero.media_url_desktop ?? hero.media_url);
  const mobile = mediaSrc(hero.media_url_mobile) ?? desktop;
  const { trackRef, videoRef, copyRef, hintRef, loadingRef } = useHeroScrub({
    desktopSrc: desktop ?? "",
    mobileSrc: mobile ?? "",
    forceMobile: forceMobileMedia,
  });

  return (
    <section
      className="scroll-track"
      id="top"
      data-customize-section="hero"
      ref={trackRef}
      aria-label="Featured film"
    >
      <div className="video-sticky">
        {desktop || mobile ? (
          <>
            <div className="video-loading" ref={loadingRef} aria-hidden>
              <div className="video-loading-bar">
                <span />
              </div>
            </div>
            <video
              ref={videoRef}
              className="scrub-video"
              muted
              playsInline
              preload="none"
              disablePictureInPicture
            />
          </>
        ) : null}
        <HeroCopy hero={hero} ref={copyRef} />
        {desktop || mobile ? (
          <p className="scroll-hint" ref={hintRef}>
            Scroll to scrub
          </p>
        ) : null}
      </div>
    </section>
  );
}
