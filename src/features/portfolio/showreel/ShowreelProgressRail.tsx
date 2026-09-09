"use client";

import type { CSSProperties } from "react";
import type { ShowreelSlide } from "./showreelSlides";

type Props = {
  slides: ShowreelSlide[];
  index: number;
  playing: boolean;
};

/** Segmented pacing rail — tick width tracks each slide's real duration. */
export function ShowreelProgressRail({ slides, index, playing }: Props) {
  return (
    <div className="showreel-rail" aria-hidden>
      {slides.map((slide, i) => {
        const state = i < index ? "is-done" : i === index ? "is-live" : "";
        return (
          <span
            key={slide.id}
            className={`showreel-rail-tick ${state}`.trim()}
            style={
              {
                flexGrow: slide.durationMs,
                "--sr-tick-ms": `${slide.durationMs}ms`,
              } as CSSProperties
            }
          >
            <span
              // Keyed on slide id so the fill restarts for each slide.
              key={`${slide.id}:${index}`}
              className="showreel-rail-fill"
              data-paused={i === index && !playing ? "1" : undefined}
            />
          </span>
        );
      })}
    </div>
  );
}
