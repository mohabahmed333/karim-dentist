"use client";

type Rect = { top: number; left: number; width: number; height: number };

type Props = { hole: Rect | null };

/** Dims the page; optional spotlight hole via box-shadow (no SVG mask). */
export function CustomizeTourMask({ hole }: Props) {
  if (!hole) {
    return (
      <div
        className="absolute inset-0 bg-black/55"
        aria-hidden
        data-tour-mask=""
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute rounded-lg bg-transparent"
      aria-hidden
      data-tour-mask=""
      style={{
        top: hole.top,
        left: hole.left,
        width: hole.width,
        height: hole.height,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
      }}
    />
  );
}
