import { getPortfolioImageSrc } from "../lib/portfolioImage";

type Props = {
  src: string | null | undefined;
  mediaType?: "image" | "video" | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  previewMode?: boolean;
  lazy?: boolean;
};

export function MediaFigure({
  src,
  mediaType = "image",
  alt = "",
  className,
  style,
  previewMode,
  lazy = false,
}: Props) {
  if (!src) return null;
  if (mediaType === "video") {
    return (
      <video
        className={className}
        style={style}
        src={src}
        autoPlay={!previewMode}
        muted
        loop={!previewMode}
        playsInline
        preload="metadata"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic CMS aspect ratios
    <img
      className={className}
      style={style}
      src={getPortfolioImageSrc(src, !previewMode)}
      alt={alt}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
    />
  );
}
