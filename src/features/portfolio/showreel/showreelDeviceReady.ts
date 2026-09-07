type EmbedRoot = {
  querySelector(selector: string): unknown;
};

type VideoState = {
  readyState?: number;
  classList?: {
    contains(name: string): boolean;
  };
};

export function isShowreelEmbedReady(
  root: EmbedRoot,
  mode: "site" | "customize",
) {
  if (mode === "customize") {
    return Boolean(root.querySelector(".showreel-demo-customize"));
  }

  const video = root.querySelector("video.scrub-video") as VideoState | null;
  if (!video) return false;

  return (
    (video.readyState ?? 0) >= 2 ||
    Boolean(video.classList?.contains("is-ready"))
  );
}
