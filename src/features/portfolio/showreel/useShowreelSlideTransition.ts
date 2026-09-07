"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { gsap, prefersReducedMotion } from "@/features/portfolio/motion/gsapClient";
import type { ShowreelSlide } from "./showreelSlides";

type TweenPosition = string | number;

function targets(root: ParentNode, selector: string): HTMLElement[] {
  return gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector));
}

function fromToIf(
  tl: gsap.core.Timeline,
  elements: HTMLElement[],
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  position?: TweenPosition,
) {
  if (elements.length === 0) return;
  tl.fromTo(elements, from, to, position);
}

function toIf(
  tl: gsap.core.Timeline,
  elements: HTMLElement[],
  vars: gsap.TweenVars,
  position?: TweenPosition,
) {
  if (elements.length === 0) return;
  tl.to(elements, vars, position);
}

function resetScene(scene: HTMLElement) {
  gsap.set(scene, { opacity: 1, scale: 1, filter: "none", clearProps: "transform" });
}

function activeLayer(root: HTMLElement) {
  return root.querySelector<HTMLElement>(".showreel-slide-layer.is-active");
}

function prepEnter(root: HTMLElement) {
  const all = targets(
    root,
    ".showreel-anim-kicker, .showreel-intro-meta, .showreel-anim-word, .showreel-anim-title, .showreel-anim-body, .showreel-anim-keyword, .showreel-intro-line, .showreel-outro-line, .showreel-anim-device",
  );
  gsap.set(all, { clearProps: "all" });
}

/** Content rises in — used once after slide swap. */
function staggerEnter(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  const isIntro = Boolean(root.querySelector(".showreel-scene--intro"));
  const isOutro = Boolean(root.querySelector(".showreel-scene--outro"));
  const kickers = targets(root, ".showreel-anim-kicker, .showreel-intro-meta");
  const bodies = isOutro ? [] : targets(root, ".showreel-anim-body");
  const devices = targets(
    root,
    ".showreel-anim-device:not(.is-device-pending)",
  );
  const introLines = targets(root, ".showreel-intro-lines .showreel-intro-line");
  const outroLines = targets(root, ".showreel-outro-lines .showreel-outro-line");
  const featureKeywords = targets(root, ".showreel-keywords .showreel-anim-keyword");
  const titles = targets(root, ".showreel-anim-word, .showreel-anim-title");

  fromToIf(
    tl,
    kickers,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.55 },
    0,
  );

  fromToIf(
    tl,
    titles,
    { opacity: 0, y: 48, filter: "blur(10px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.75, stagger: 0.07 },
    0.06,
  );

  fromToIf(
    tl,
    bodies,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6 },
    isIntro ? 0.55 : 0.18,
  );

  if (isIntro && introLines.length > 0) {
    introLines.forEach((el, i) => {
      tl.fromTo(
        el,
        { opacity: 0, y: 72, filter: "blur(12px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, ease: "power3.out" },
        0.12 + i * 0.14,
      );
    });
  } else if (isOutro && outroLines.length > 0) {
    outroLines.forEach((el, i) => {
      tl.fromTo(
        el,
        { opacity: 0, y: 64, filter: "blur(12px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.82, ease: "power3.out" },
        0.14 + i * 0.2,
      );
    });
  } else {
    fromToIf(
      tl,
      featureKeywords,
      { opacity: 0, y: 52, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.11 },
      0.1,
    );
  }

  fromToIf(
    tl,
    devices,
    { opacity: 0, scale: 0.94, y: 48, filter: "blur(8px)" },
    { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.85, stagger: 0.07 },
    0.08,
  );

  return tl;
}

/** Content lifts out — runs on outgoing slide before swap. */
function staggerExit(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: "power3.in" } });
  const isIntro = Boolean(root.querySelector(".showreel-scene--intro"));
  const isOutro = Boolean(root.querySelector(".showreel-scene--outro"));
  const introLines = targets(root, ".showreel-intro-lines .showreel-intro-line");
  const outroLines = targets(root, ".showreel-outro-lines .showreel-outro-line");
  const featureKeywords = targets(root, ".showreel-keywords .showreel-anim-keyword");
  const devices = targets(root, ".showreel-anim-device");
  const copy =
    isIntro || isOutro
      ? []
      : targets(root, ".showreel-anim-kicker, .showreel-intro-meta, .showreel-anim-body");
  const titles = targets(root, ".showreel-anim-word, .showreel-anim-title");

  toIf(
    tl,
    devices,
    {
      opacity: 0,
      scale: 0.9,
      y: -36,
      filter: "blur(14px)",
      duration: 0.65,
      stagger: 0.06,
    },
    0,
  );

  if (isIntro && introLines.length > 0) {
    introLines.forEach((el, i) => {
      tl.to(
        el,
        { opacity: 0, y: -64, filter: "blur(14px)", duration: 0.62 },
        0.04 + i * 0.09,
      );
    });
  } else if (isOutro && outroLines.length > 0) {
    outroLines.forEach((el, i) => {
      tl.to(
        el,
        { opacity: 0, y: -56, filter: "blur(14px)", duration: 0.6 },
        0.04 + i * 0.1,
      );
    });
  } else if (featureKeywords.length > 0) {
    featureKeywords.forEach((el, i) => {
      tl.to(
        el,
        { opacity: 0, y: -56, filter: "blur(12px)", duration: 0.58 },
        0.06 + i * 0.08,
      );
    });
  }

  toIf(
    tl,
    titles,
    {
      opacity: 0,
      y: -32,
      filter: "blur(10px)",
      duration: 0.55,
      stagger: 0.05,
    },
    0.08,
  );

  toIf(
    tl,
    copy,
    {
      opacity: 0,
      y: -20,
      filter: "blur(8px)",
      duration: 0.5,
      stagger: 0.05,
    },
    0.1,
  );

  return tl;
}

type TransitionRefs = {
  sceneRef: RefObject<HTMLDivElement | null>;
};

export function useShowreelSlideTransition(
  slide: ShowreelSlide,
  refs: TransitionRefs,
) {
  const [renderSlide, setRenderSlide] = useState(slide);
  const enterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const exitTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const renderIdRef = useRef(slide.id);

  useLayoutEffect(() => {
    renderIdRef.current = renderSlide.id;
    const root = refs.sceneRef.current;
    const scene = root ? activeLayer(root) : null;
    if (!scene) return;

    if (prefersReducedMotion()) {
      enterTimelineRef.current?.kill();
      resetScene(scene);
      return;
    }

    enterTimelineRef.current?.kill();
    resetScene(scene);
    prepEnter(scene);

    const tl = staggerEnter(scene);
    enterTimelineRef.current = tl;

    return () => {
      tl.kill();
      if (enterTimelineRef.current === tl) enterTimelineRef.current = null;
    };
  }, [renderSlide.id, refs.sceneRef]);

  useEffect(() => {
    const root = refs.sceneRef.current;
    const scene = root ? activeLayer(root) : null;
    if (!scene || slide.id === renderIdRef.current) return;

    if (prefersReducedMotion()) {
      exitTimelineRef.current?.kill();
      setRenderSlide(slide);
      return;
    }

    exitTimelineRef.current?.kill();
    enterTimelineRef.current?.kill();
    resetScene(scene);

    const tl = staggerExit(scene);
    exitTimelineRef.current = tl;
    tl.eventCallback("onComplete", () => {
      renderIdRef.current = slide.id;
      setRenderSlide(slide);
    });

    return () => {
      tl.kill();
      if (exitTimelineRef.current === tl) exitTimelineRef.current = null;
    };
  }, [slide.id, refs.sceneRef]);

  return renderSlide;
}
