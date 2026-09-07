"use client";

import { useEffect, useRef } from "react";
import { clamp,
  isSeekable,
  loadVideoAsBlob,
  pageScrollY,
  trackProgress,
  unlockVideo,
} from "./scrubHelpers";
import { postShowreelEmbedReady } from "@/features/portfolio/showreel/showreelEmbedMessage";

type Args = {
  desktopSrc: string;
  mobileSrc: string;
  /** When set, overrides viewport matchMedia (customize device switcher). */
  forceMobile?: boolean;
};

function shouldUseMobile(
  track: HTMLElement,
  forceMobile: boolean | undefined,
): boolean {
  if (typeof forceMobile === "boolean") return forceMobile;
  const device = track.closest("[data-device]")?.getAttribute("data-device");
  if (device === "mobile") return true;
  if (device === "tablet" || device === "desktop") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function useHeroScrub({ desktopSrc, mobileSrc, forceMobile }: Args) {
  const trackRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLParagraphElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

    const copy = copyRef.current;
    const hint = hintRef.current;
    const loading = loadingRef.current;
    const nav = document.getElementById("site-nav");
    let ready = false;
    let ticking = false;
    let loadStarted = false;
    let blobUrl: string | null = null;
    const pick = () =>
      shouldUseMobile(track, forceMobile) ? mobileSrc : desktopSrc;

    const drawerOpen = () =>
      document.body.classList.contains("nav-drawer-open") ||
      document.body.classList.contains("nav-drawer-closing");

    const scrub = () => {
      if (drawerOpen()) return;
      const p = trackProgress(track);
      const past =
        pageScrollY() >=
        track.offsetTop + track.offsetHeight - window.innerHeight;
      if (ready && video.duration && Number.isFinite(video.duration)) {
        const t = p * video.duration;
        if (Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
      }
      const fade = clamp(1 - p / 0.18, 0, 1);
      if (copy) {
        copy.style.opacity = String(fade);
        copy.style.transform = `translateY(${(1 - fade) * 28}px)`;
      }
      if (hint) hint.style.opacity = String(fade * 0.7);
      nav?.classList.toggle("is-solid", past || p > 0.88);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        scrub();
        ticking = false;
      });
    };

    const finish = async () => {
      await unlockVideo(video);
      if (!isSeekable(video)) {
        try {
          blobUrl = await loadVideoAsBlob(video, pick(), blobUrl);
          await unlockVideo(video);
        } catch {
          /* progressive fallback */
        }
      }
      ready = true;
      video.classList.add("is-ready");
      loading?.classList.add("is-done");
      scrub();
    };

    const startLoad = () => {
      if (loadStarted) return;
      loadStarted = true;
      let showreelNotified = false;
      const notifyShowreel = () => {
        if (showreelNotified || !track.closest(".showreel-demo-site")) return;
        showreelNotified = true;
        postShowreelEmbedReady("site");
      };

      video.preload = "auto";
      video.src = pick();
      video.load();
      const done = () => {
        video.removeEventListener("loadeddata", done);
        video.removeEventListener("canplay", done);
        notifyShowreel();
        void finish();
      };
      video.addEventListener("loadeddata", done);
      video.addEventListener("canplay", done);
      window.setTimeout(() => {
        if (!ready && video.readyState >= 1) void finish();
      }, 4000);
    };

    const reloadIfNeeded = () => {
      const next = pick();
      if (video.getAttribute("data-active-src") !== next) {
        ready = false;
        loadStarted = false;
        video.classList.remove("is-ready");
        loading?.classList.remove("is-done");
        video.setAttribute("data-active-src", next);
        startLoad();
      }
      onScroll();
    };

    video.setAttribute("data-active-src", pick());
    startLoad();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", reloadIfNeeded, { passive: true });
    scrub();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", reloadIfNeeded);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [desktopSrc, mobileSrc, forceMobile]);

  return { trackRef, videoRef, copyRef, hintRef, loadingRef };
}
