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
  mode: "site" | "customize" | "product",
) {
  if (mode === "customize") {
    return Boolean(root.querySelector(".showreel-demo-customize"));
  }

  if (mode === "product") {
    return Boolean(
      root.querySelector("[data-showreel-demo]") ||
        root.querySelector(".showreel-demo-dashboard") ||
        root.querySelector(".showreel-product-chrome") ||
        root.querySelector(".admin-shell"),
    );
  }

  if (root.querySelector('[data-customize-section="hero"]')) return true;

  const video = root.querySelector("video.scrub-video") as VideoState | null;
  if (!video) return false;

  return (
    (video.readyState ?? 0) >= 2 ||
    Boolean(video.classList?.contains("is-ready"))
  );
}
