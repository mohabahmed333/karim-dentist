"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShowreelDeviceMockup,
  useShowreelIframeRef,
} from "./ShowreelDeviceMockup";
import { ShowreelSlideShell, type ShowreelFeatureSlide } from "./ShowreelSlideShell";
import { CUSTOMIZE_DEMO_SRC } from "./showreelEmbedMessage";
import type { ShowreelDeviceVariant } from "./showreelSlides";
import { useShowreelCustomizeRoute } from "./useShowreelCustomizeRoute";
import { useShowreelCustomizeScript } from "./useShowreelCustomizeScript";
import { useShowreelScrollOnce } from "./useShowreelScrollOnce";

type Props = {
  slide: ShowreelFeatureSlide;
  index: number;
  total: number;
  playing: boolean;
  active: boolean;
  onDeviceReady: (variant: ShowreelDeviceVariant) => void;
};

export function ShowreelSlideFeature({
  slide,
  index,
  total,
  playing,
  active,
  onDeviceReady,
}: Props) {
  const desktopRef = useShowreelIframeRef();
  const mobileRef = useShowreelIframeRef();
  const desktopOnly = Boolean(slide.desktopOnly);
  const desktopSrc = desktopOnly ? CUSTOMIZE_DEMO_SRC : slide.desktopSrc;
  const desktopScrollRef = useMemo(() => [desktopRef], [desktopRef]);

  const [desktopReady, setDesktopReady] = useState(false);
  const prevDesktopSrc = useRef(desktopSrc);

  const scrollOn =
    active && Boolean(slide.scroll) && playing && desktopReady && !desktopOnly;

  useShowreelCustomizeRoute(
    desktopRef,
    slide.desktopSrc,
    active && desktopOnly && desktopReady,
  );

  useShowreelCustomizeScript(
    desktopRef,
    slide,
    active &&
      playing &&
      desktopReady &&
      desktopOnly &&
      Boolean(slide.customizeScript),
  );

  useShowreelScrollOnce(desktopScrollRef, scrollOn, {
    scrollMs: slide.scrollMs ?? 2800,
    maxProgress: slide.scrollDepth ?? 0.18,
    delayMs: slide.scrollDelayMs ?? 280,
    targetId: slide.scrollTarget,
    heroFirst: slide.scrollHeroFirst,
    heroPhaseRatio: slide.scrollHeroPhaseRatio ?? 0.42,
  });

  useEffect(() => {
    if (prevDesktopSrc.current === desktopSrc) return;
    prevDesktopSrc.current = desktopSrc;
    setDesktopReady(false);
  }, [desktopSrc]);

  return (
    <div
      className={
        desktopOnly
          ? "showreel-scene showreel-scene--feature showreel-scene--desktop-only"
          : "showreel-scene showreel-scene--feature"
      }
    >
      <ShowreelSlideShell
        index={index}
        total={total}
        kicker={slide.kicker}
        title={slide.title}
        body={slide.body}
        tags={slide.tags}
        compact
      />
      <div
        className={
          desktopOnly
            ? "showreel-device-stage"
            : "showreel-device-stage showreel-device-stage--row"
        }
      >
        <div className="showreel-device-halo" aria-hidden />
        <ShowreelDeviceMockup
          variant="desktop"
          src={desktopSrc}
          iframeRef={desktopRef}
          onReady={() => {
            setDesktopReady(true);
            onDeviceReady("desktop");
          }}
          className="showreel-anim-device"
        />
        {!desktopOnly ? (
          <ShowreelDeviceMockup
            variant="mobile"
            src={slide.mobileSrc}
            iframeRef={mobileRef}
            onReady={() => onDeviceReady("mobile")}
            className="showreel-anim-device"
          />
        ) : null}
      </div>
    </div>
  );
}
