"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShowreelSlideCopy } from "./ShowreelSlideShell";
import { ShowreelSlideFeature } from "./ShowreelSlideFeature";
import { ShowreelPrefetch } from "./ShowreelPrefetch";
import { ShowreelProgressRail } from "./ShowreelProgressRail";
import { useShowreelDeck } from "./useShowreelDeck";
import { useShowreelSlideTransition } from "./useShowreelSlideTransition";
import {
  areShowreelDevicesReady,
  getShowreelDeviceIds,
  SHOWREEL_SLIDES,
  type ShowreelDeviceVariant,
} from "./showreelSlides";

type Props = {
  videoDesktop?: string | null;
  videoMobile?: string | null;
};

export function ShowreelDeck({ videoDesktop, videoMobile }: Props) {
  const { slide, total, playing, setPlaying } = useShowreelDeck();
  const sceneRef = useRef<HTMLDivElement>(null);
  const renderSlide = useShowreelSlideTransition(slide, { sceneRef });
  // The stage lags `slide` by the exit timeline, so pace the rail off what is
  // actually on screen.
  const renderIndex = Math.max(
    SHOWREEL_SLIDES.findIndex((item) => item.id === renderSlide.id),
    0,
  );
  const deviceIds = useMemo(
    () => getShowreelDeviceIds(SHOWREEL_SLIDES),
    [],
  );
  const [readyDeviceIds, setReadyDeviceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const allDevicesReady = areShowreelDevicesReady(deviceIds, readyDeviceIds);

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
    if (!allDevicesReady) return;
    const timer = window.setTimeout(() => setPlaying(true), 800);
    return () => window.clearTimeout(timer);
  }, [allDevicesReady, setPlaying]);

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
          {SHOWREEL_SLIDES.map((item, itemIndex) => {
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
      <ShowreelProgressRail
        slides={SHOWREEL_SLIDES}
        index={renderIndex}
        playing={playing}
      />
    </div>
  );
}
