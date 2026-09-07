import {
  pauseScrollTriggers,
  resumeScrollTriggers,
} from "../motion/gsapClient";

let lockedScrollY = 0;

type FrozenVideo = {
  video: HTMLVideoElement;
  time: number;
  paused: boolean;
};

let frozenVideos: FrozenVideo[] = [];

function siteShell() {
  return document.querySelector<HTMLElement>(".site-shell");
}

function captureVideos() {
  frozenVideos = [...document.querySelectorAll("video")].map((video) => ({
    video,
    time: video.currentTime,
    paused: video.paused,
  }));
}

function restoreVideos() {
  for (const { video, time, paused } of frozenVideos) {
    if (!video.isConnected) continue;
    if (Math.abs(video.currentTime - time) > 0.05) video.currentTime = time;
    if (!paused && video.paused) void video.play();
  }
}

export function lockDrawerScroll() {
  lockedScrollY = window.scrollY;
  document.documentElement.style.setProperty(
    "--drawer-scroll-y",
    `${lockedScrollY}px`,
  );
  captureVideos();
  pauseScrollTriggers();
}

export function freezeSiteShellScroll() {
  const shell = siteShell();
  if (shell) shell.scrollTop = lockedScrollY;
  restoreVideos();
  requestAnimationFrame(() => {
    restoreVideos();
    requestAnimationFrame(restoreVideos);
  });
  window.setTimeout(restoreVideos, 80);
  window.setTimeout(restoreVideos, 200);
}

export function restoreDrawerScroll() {
  const shell = siteShell();
  if (shell) shell.scrollTop = 0;
  document.documentElement.style.removeProperty("--drawer-scroll-y");
  window.scrollTo({ top: lockedScrollY, behavior: "auto" });
  resumeScrollTriggers();
  restoreVideos();
  frozenVideos = [];
  return lockedScrollY;
}

export function getLockedScrollY() {
  return lockedScrollY;
}

export function scrollToElement(id: string) {
  const target = document.getElementById(id);
  if (!target) {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    return;
  }

  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 20;
  const top = target.getBoundingClientRect().top + window.scrollY - margin;
  window.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior() });
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}
