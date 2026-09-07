"use client";

import { ShowreelDeck } from "./ShowreelDeck";
import { ShowreelMeMark } from "./ShowreelMeMark";
import "./showreel.css";

type Props = {
  videoDesktop?: string | null;
  videoMobile?: string | null;
};

export function ShowreelPage({ videoDesktop, videoMobile }: Props) {
  return (
    <div className="showreel-page">
      <div className="showreel-letterbox showreel-letterbox--top" aria-hidden />
      <div className="showreel-grain" aria-hidden />
      <div className="showreel-ambient" aria-hidden />
      <header className="showreel-brand">
        <ShowreelMeMark />
        <span className="showreel-brand-by">Mohab Elbasiry</span>
      </header>
      <ShowreelDeck videoDesktop={videoDesktop} videoMobile={videoMobile} />
      <div className="showreel-letterbox showreel-letterbox--bottom" aria-hidden />
    </div>
  );
}
