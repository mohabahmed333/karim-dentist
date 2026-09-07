export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function unlockVideo(video: HTMLVideoElement) {
  try {
    await video.play();
    video.pause();
  } catch {
    /* autoplay policies */
  }
}

export function isSeekable(video: HTMLVideoElement) {
  return video.seekable.length > 0 && video.seekable.end(0) > 0.1;
}

export async function loadVideoAsBlob(
  video: HTMLVideoElement,
  src: string,
  prevBlob: string | null,
): Promise<string> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("video fetch failed");
  const blob = await res.blob();
  if (prevBlob) URL.revokeObjectURL(prevBlob);
  const url = URL.createObjectURL(blob);
  video.src = url;
  video.load();
  await new Promise<void>((resolve) => {
    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
  });
  return url;
}

/** Window Y, or the locked value while the nav drawer holds scroll. */
export function pageScrollY() {
  const raw = document.documentElement.style.getPropertyValue(
    "--drawer-scroll-y",
  );
  if (raw) {
    const next = Number.parseFloat(raw);
    if (Number.isFinite(next)) return next;
  }
  return window.scrollY;
}

export function trackProgress(track: HTMLElement) {
  const scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
  return clamp((pageScrollY() - track.offsetTop) / scrollable, 0, 1);
}
