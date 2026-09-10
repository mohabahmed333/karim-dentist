"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShowreelSlideCopy } from "./ShowreelSlideShell";
import { ShowreelSlideFeature } from "./ShowreelSlideFeature";
import { ShowreelPrefetch } from "./ShowreelPrefetch";
import { useShowreelDeck } from "./useShowreelDeck";
import { useShowreelSlideTransition } from "./useShowreelSlideTransition";
import {
  areShowreelDevicesReady,
  getShowreelDeviceIds,
  SHOWREEL_SLIDES,
  type ShowreelDeviceVariant,
  type ShowreelSlide,
} from "./showreelSlides";

type Props = {
  videoDesktop?: string | null;
  videoMobile?: string | null;
  /** Defaults to the full deck; pass a curated list (e.g. the highlights
      cut) to play a different sequence through the same components. */
  slides?: ShowreelSlide[];
};

export function ShowreelDeck({
  videoDesktop,
  videoMobile,
  slides = SHOWREEL_SLIDES,
}: Props) {
  const { slide, total, playing, setPlaying } = useShowreelDeck(false, slides);
  const sceneRef = useRef<HTMLDivElement>(null);
  const renderSlide = useShowreelSlideTransition(slide, { sceneRef });
  // Every slide mounts (and starts loading) up front, but only the FIRST
  // slide's device needs to be ready before playback starts — the rest get
  // that slide's full durationMs as a head start to finish loading in the
  // background. Gating on every slide in the deck made the opening wait as
  // long as the slowest of them combined.
  const firstSlideDeviceIds = useMemo(
    () => getShowreelDeviceIds(slides.slice(0, 1)),
    [slides],
  );
  const [readyDeviceIds, setReadyDeviceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const firstSlideReady = areShowreelDevicesReady(
    firstSlideDeviceIds,
    readyDeviceIds,
  );

  const markDeviceReady = useCallback(
    (slideId: string, variant: ShowreelDeviceVariant) => {
      const id = `${slideId}:${variant}`;
      setReadyDeviceIds((current) => {
        if (current.has(id)) return current;
        return new Set(current).add(id);
      });
    },
    [],
  );

  useEffect(() => {
    if (!firstSlideReady) return;
    const timer = window.setTimeout(() => setPlaying(true), 800);
    return () => window.clearTimeout(timer);
  }, [firstSlideReady, setPlaying]);

  return (
    <div className="showreel-deck">
      <ShowreelPrefetch
        prefetchVideo
        prefetchCustomize={false}
        videoDesktop={videoDesktop}
        videoMobile={videoMobile}
      />
      <div className="showreel-stage">
        <div className="showreel-slide" ref={sceneRef}>
          {slides.map((item, itemIndex) => {
            const active = item.id === renderSlide.id;

            return (
              <div
                key={item.id}
                className={`showreel-slide-layer${active ? " is-active" : ""}`}
                aria-hidden={!active}
                inert={!active}
              >
                {item.kind === "feature" ? (
                  <ShowreelSlideFeature
                    slide={item}
                    playing={playing}
                    active={active}
                    onDeviceReady={(variant) =>
                      markDeviceReady(item.id, variant)
                    }
                  />
                ) : (
                  <ShowreelSlideCopy
                    slide={item}
                    index={itemIndex}
                    total={total}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
