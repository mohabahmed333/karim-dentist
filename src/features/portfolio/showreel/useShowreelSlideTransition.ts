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

function targets(root: ParentNode, selector: string): HTMLElement[] {
  return gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector));
}

function fromToIf(
  tl: gsap.core.Timeline,
  elements: HTMLElement[],
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  position?: string | number,
) {
  if (elements.length === 0) return;
  tl.fromTo(elements, from, to, position);
}

function toIf(
  tl: gsap.core.Timeline,
  elements: HTMLElement[],
  vars: gsap.TweenVars,
  position?: string | number,
) {
  if (elements.length === 0) return;
  tl.to(elements, vars, position);
}

function resetScene(scene: HTMLElement) {
  gsap.set(scene, { opacity: 1, clearProps: "transform" });
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

function staggerEnter(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  // Depth push: the scene arrives from slightly forward rather than fading in,
  // so consecutive screens read as one flow instead of separate cards.
  tl.fromTo(
    root,
    { opacity: 0, scale: 1.04, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out" },
    0,
  );
  const kickers = targets(root, ".showreel-anim-kicker, .showreel-intro-meta");
  const bodies = targets(root, ".showreel-anim-body");
  const devices = targets(
    root,
    ".showreel-anim-device:not(.is-device-pending)",
  );
  // Hero text (title, intro lines, outro name) now reveals word-by-word via
  // child .showreel-anim-word spans instead of animating the whole line as
  // one block — the parent (h2/li/span) is intentionally not targeted here.
  const words = targets(root, ".showreel-anim-word");
  // Feature-slide tag chips are already one word per element, so they keep
  // the coarser per-chip stagger.
  const chips = targets(root, ".showreel-keywords .showreel-anim-keyword");

  fromToIf(tl, kickers, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35 }, 0);
  fromToIf(
    tl,
    words,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.32, stagger: 0.03 },
    0.05,
  );
  fromToIf(
    tl,
    chips,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 },
    0.05,
  );
  fromToIf(tl, bodies, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, 0.12);
  fromToIf(
    tl,
    devices,
    { opacity: 0, y: 16, scale: 0.965 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.55,
      ease: "power3.out",
      stagger: 0.05,
    },
    0.08,
  );
  return tl;
}

function staggerExit(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: "power2.in" } });
  const items = targets(
    root,
    ".showreel-anim-device, .showreel-anim-keyword, .showreel-intro-line, .showreel-outro-line, .showreel-anim-word, .showreel-anim-title, .showreel-anim-kicker, .showreel-intro-meta, .showreel-anim-body",
  );
  toIf(tl, items, { opacity: 0, y: -12, duration: 0.28, stagger: 0.02 }, 0);
  tl.to(root, { opacity: 0, scale: 0.96, y: -18, duration: 0.32 }, 0);
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
      const id = window.setTimeout(() => setRenderSlide(slide), 0);
      return () => window.clearTimeout(id);
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
