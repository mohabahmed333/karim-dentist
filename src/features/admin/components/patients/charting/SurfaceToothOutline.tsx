"use client";

import type { ChartToothKind } from "@/services/notation";
import { CHART_CROWN_PATHS } from "@/services/notation";

type Props = {
  kind: ChartToothKind;
  crown: boolean;
  missing: boolean;
  selected: boolean;
  uid: string;
};

export function SurfaceToothOutline({
  kind,
  crown,
  missing,
  selected,
  uid,
}: Props) {
  const d = CHART_CROWN_PATHS[kind];
  const gid = `enamel-${uid}`;
  const stroke = selected ? "#2563EB" : crown ? "#059669" : "#94A3B8";

  return (
    <svg
      viewBox="0 0 40 52"
      className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-sm"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="8" y1="0" x2="34" y2="52" gradientUnits="userSpaceOnUse">
          {crown ? (
            <>
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="55%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </>
          ) : missing ? (
            <>
              <stop offset="0%" stopColor="#E5E7EB" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="38%" stopColor="#F1F5F9" />
              <stop offset="72%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${gid}-shine`} x1="12" y1="2" x2="22" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill={`url(#${gid})`}
        stroke={stroke}
        strokeWidth={selected ? 2.2 : 1.45}
        strokeLinejoin="round"
      />
      {!missing ? (
        <path
          d={d}
          fill={`url(#${gid}-shine)`}
          stroke="none"
          opacity={crown ? 0.35 : 0.55}
          clipPath="inset(0)"
        />
      ) : null}
      {!crown && !missing && (kind === "premolar" || kind === "molar") ? (
        <>
          <path d="M 16 10 L 17 38" fill="none" stroke={stroke} strokeWidth={0.8} opacity={0.28} />
          <path d="M 24 10 L 23 38" fill="none" stroke={stroke} strokeWidth={0.8} opacity={0.28} />
        </>
      ) : null}
      {!crown && !missing && kind === "molar" ? (
        <path
          d="M 10 24 Q 20 28 30 24"
          fill="none"
          stroke={stroke}
          strokeWidth={0.8}
          opacity={0.25}
        />
      ) : null}
      {!missing ? (
        <ellipse
          cx="16"
          cy="14"
          rx="5.5"
          ry="8"
          fill="#FFFFFF"
          opacity={crown ? 0.18 : 0.32}
        />
      ) : null}
    </svg>
  );
}
