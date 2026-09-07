"use client";

type Props = { className?: string };

export function ScallopEdge({ className }: Props) {
  return (
    <svg
      viewBox="0 0 320 20"
      preserveAspectRatio="none"
      className={className ?? "h-5 w-full"}
      aria-hidden
    >
      <path
        d="M0 20 L0 11 Q 10 0 20 11 T 40 11 T 60 11 T 80 11 T 100 11 T 120 11 T 140 11 T 160 11 T 180 11 T 200 11 T 220 11 T 240 11 T 260 11 T 280 11 T 300 11 T 320 11 L320 20 Z"
        fill="rgba(255,255,255,0.62)"
      />
    </svg>
  );
}
