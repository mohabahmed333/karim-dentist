"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShowreelFeatureDeviceStage } from "./ShowreelFeatureDeviceStage";
import { ShowreelFeatureTitleCard } from "./ShowreelFeatureTitleCard";
import { useShowreelIframeRef } from "./ShowreelDeviceMockup";
import type { ShowreelFeatureSlide } from "./ShowreelSlideShell";
import { CUSTOMIZE_DEMO_SRC } from "./showreelEmbedMessage";
import { postShowreelProductActivate } from "./showreelProductActivate";
import type { ShowreelDeviceVariant } from "./showreelSlides";
import { useShowreelCustomizeRoute } from "./useShowreelCustomizeRoute";
import { useShowreelCustomizeScript } from "./useShowreelCustomizeScript";
import { useShowreelFeatureTitleCard } from "./useShowreelFeatureTitleCard";
import { useShowreelScrollOnce } from "./useShowreelScrollOnce";

type Props = {
  slide: ShowreelFeatureSlide;
  playing: boolean;
  active: boolean;
  onDeviceReady: (variant: ShowreelDeviceVariant) => void;
};

export function ShowreelSlideFeature({
  slide,
  playing,
  active,
  onDeviceReady,
}: Props) {
  const desktopRef = useShowreelIframeRef();
  const mobileRef = useShowreelIframeRef();
  const desktopOnly = Boolean(slide.desktopOnly);
  // desktopOnly alone isn't "this is the customize slide" — the "site" scene
  // is also desktopOnly. Only a slide with an actual customizeScript should
  // route to the customize demo route.
  const desktopSrc = slide.productScene
    ? slide.desktopSrc
    : slide.customizeScript
      ? CUSTOMIZE_DEMO_SRC
      : slide.desktopSrc;
  const desktopScrollRef = useMemo(() => [desktopRef], [desktopRef]);
  // showTitleCard used to gate a separate "title only" beat before the demo
  // frame appeared; now the title header and the device card render
  // together for the whole slide, so only the script-gating half (demoLive)
  // is still needed.
  const { demoLive } = useShowreelFeatureTitleCard(active, playing);
  const [desktopReady, setDesktopReady] = useState(false);
  const prevDesktopSrc = useRef(desktopSrc);

  useShowreelCustomizeRoute(
    desktopRef,
    slide.desktopSrc,
    active && Boolean(slide.customizeScript) && desktopReady,
  );
  useShowreelCustomizeScript(
    desktopRef,
    slide,
    demoLive &&
      desktopReady &&
      desktopOnly &&
      Boolean(slide.customizeScript) &&
      !slide.productScene,
  );
  useEffect(() => {
    // "customize" is a fixed scene id (not a real productScene) so its
    // in-iframe cursor gets the same activate signal every product scene
    // already uses.
    const scene = slide.productScene ?? (slide.customizeScript ? "customize" : null);
    if (!scene) return;
    postShowreelProductActivate(
      desktopRef.current,
      scene,
      demoLive && desktopReady,
    );
  }, [demoLive, desktopReady, desktopRef, slide.productScene, slide.customizeScript]);
  useShowreelScrollOnce(
    desktopScrollRef,
    // !desktopOnly used to be redundant (only "site" ever set scroll:true,
    // and it was the only non-desktopOnly slide) until site became
    // desktopOnly too — which silently killed its own auto-scroll. No other
    // slide sets scroll:true, so dropping this clause can't re-enable
    // scrolling anywhere it shouldn't.
    demoLive && Boolean(slide.scroll) && desktopReady,
    {
      scrollMs: slide.scrollMs ?? 2800,
      maxProgress: slide.scrollDepth ?? 0.18,
      delayMs: slide.scrollDelayMs ?? 280,
      targetId: slide.scrollTarget,
      heroFirst: slide.scrollHeroFirst,
      heroPhaseRatio: slide.scrollHeroPhaseRatio ?? 0.42,
    },
  );
  useEffect(() => {
    if (prevDesktopSrc.current === desktopSrc) return;
    prevDesktopSrc.current = desktopSrc;
    setDesktopReady(false);
  }, [desktopSrc]);

  const isProductFull = Boolean(slide.productScene) || desktopOnly;
  const sceneClass = [
    "showreel-scene",
    "showreel-scene--feature",
    desktopOnly ? "showreel-scene--desktop-only" : "",
    isProductFull ? "showreel-scene--dashboard" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={sceneClass} data-slide-id={slide.id}>
      <ShowreelFeatureTitleCard title={slide.title} />
      <ShowreelFeatureDeviceStage
        desktopOnly={desktopOnly}
        desktopSrc={desktopSrc}
        mobileSrc={slide.mobileSrc}
        desktopRef={desktopRef}
        mobileRef={mobileRef}
        hidden={false}
        onDesktopReady={() => {
          setDesktopReady(true);
          onDeviceReady("desktop");
        }}
        onMobileReady={() => onDeviceReady("mobile")}
      />
    </div>
  );
}
