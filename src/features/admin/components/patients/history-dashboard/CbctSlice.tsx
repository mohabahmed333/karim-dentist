"use client";

type Props = { variant: 0 | 1 | 2 | 3 };

const OFFSETS = [0, 18, 34, 52];

export function CbctSlice({ variant }: Props) {
  const shift = OFFSETS[variant];
  return (
    <svg viewBox="0 0 80 80" className="h-full w-full">
      <rect width="80" height="80" fill="#0c0c0c" />
      <circle cx={40} cy={38} r="28" fill="#1a1a1a" />
      <circle cx={40} cy={40} r="18" fill="#2a2a2a" />
      <ellipse
        cx={40}
        cy={42}
        rx="11"
        ry="14"
        fill="#3d3d3d"
        transform={`rotate(${shift} 40 42)`}
      />
      <path
        d={`M${28 + variant} 50 Q 40 62 52 48`}
        fill="none"
        stroke="#8a8a8a"
        strokeWidth="1.2"
      />
      <circle cx={36 + variant} cy={34} r="2.2" fill="#cfcfcf" />
    </svg>
  );
}
