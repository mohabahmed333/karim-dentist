"use client";

import { Html } from "@react-three/drei";

type Badge = { tooth: number; count: number; glowing: boolean };

type Props = {
  position: [number, number, number];
  badge: Badge;
  onHover: (tooth: number | null) => void;
  onSelect: (tooth: number) => void;
};

export function ToothBadgeHtml({ position, badge, onHover, onSelect }: Props) {
  return (
    <Html position={position} center sprite distanceFactor={7} zIndexRange={[20, 0]}>
      <button
        type="button"
        onMouseEnter={() => onHover(badge.tooth)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(badge.tooth)}
        className={
          badge.glowing
            ? "hx-badge-glow flex size-9 items-center justify-center rounded-full border-[3px] border-[#E2F163] bg-[#111111]/55 text-[11px] font-semibold text-white backdrop-blur-sm"
            : "flex size-9 items-center justify-center rounded-full bg-[#111111]/50 text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(17,17,17,0.25)] backdrop-blur-sm"
        }
      >
        {badge.count}
      </button>
    </Html>
  );
}
