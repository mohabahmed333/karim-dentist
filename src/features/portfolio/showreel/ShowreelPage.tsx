"use client";

import { ShowreelDeck } from "./ShowreelDeck";
import { ShowreelMeMark } from "./ShowreelMeMark";
import type { ShowreelSlide } from "./showreelSlides";
import "./showreel.css";

type Props = {
  videoDesktop?: string | null;
  videoMobile?: string | null;
  /** Defaults to the full deck; pass a curated list (e.g. the highlights
      cut) to play a different sequence through the same components. */
  slides?: ShowreelSlide[];
};

export function ShowreelPage({ videoDesktop, videoMobile, slides }: Props) {
  return (
    <div className="showreel-page">
      <header className="showreel-brand">
        <ShowreelMeMark />
        <span className="showreel-brand-by">Mohab Elbasiry</span>
      </header>
      <ShowreelDeck
        videoDesktop={videoDesktop}
        videoMobile={videoMobile}
        slides={slides}
      />
    </div>
  );
}
