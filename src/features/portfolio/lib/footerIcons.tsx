import type { ReactNode } from "react";

export const FOOTER_ICON_PRESETS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "behance", label: "Behance" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
] as const;

export type FooterIconKey = (typeof FOOTER_ICON_PRESETS)[number]["value"];

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons: Record<FooterIconKey, ReactNode> = {
  linkedin: (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  behance: (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M3 8h6a3 3 0 0 1 0 6H3V8zm0 6h7a3 3 0 0 1 0 6H3v-6zM14 9h7M15 15.5h6a3 3 0 0 0-6-3.2V15.5z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" aria-hidden {...stroke}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  ),
};

export function isFooterIconKey(value: string): value is FooterIconKey {
  return FOOTER_ICON_PRESETS.some((p) => p.value === value);
}

export function FooterPresetIcon({
  iconKey,
}: {
  iconKey: string | null | undefined;
}) {
  if (!iconKey || !isFooterIconKey(iconKey)) return null;
  return icons[iconKey];
}
