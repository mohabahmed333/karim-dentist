import type { TeethChartStyle } from "./chartStyles";

type Props = {
  styleId: TeethChartStyle;
  active: boolean;
};

export function ChartStyleThumb({ styleId, active }: Props) {
  // Inherit the button's text colour so the thumb is legible on either theme
  // and in both selected states.
  const stroke = "currentColor";
  const fill = active ? "rgba(255,255,255,0.22)" : "currentColor";

  if (styleId === "anatomic") {
    return (
      <svg viewBox="0 0 48 36" className="h-8 w-full" aria-hidden>
        <path d="M8 28c0-8 4-14 8-16 2 6 4 10 0 18-3 1-6 1-8-2z" fill={fill} stroke={stroke} strokeWidth="1.2" />
        <path d="M20 26c1-10 3-16 4-18 1 2 3 8 4 18-2 2-5 2-8 0z" fill={fill} stroke={stroke} strokeWidth="1.2" />
        <path d="M32 28c-4-8-2-12 0-18 4 2 8 8 8 16-2 3-5 3-8 2z" fill={fill} stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }
  if (styleId === "arch") {
    return (
      <svg viewBox="0 0 48 36" className="h-8 w-full" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const t = (i / 6) * Math.PI;
          const x = 8 + Math.cos(t) * 16 + 16;
          const y = 28 - Math.sin(t) * 14;
          return (
            <ellipse key={i} cx={x} cy={y} rx="2.4" ry="3.2" fill={fill} stroke={stroke} strokeWidth="1" />
          );
        })}
      </svg>
    );
  }
  if (styleId === "grid") {
    return (
      <svg viewBox="0 0 48 36" className="h-8 w-full" aria-hidden>
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={8 + col * 8}
              y={4 + row * 7}
              width="6"
              height="5"
              rx="1"
              fill={fill}
              stroke={stroke}
              strokeWidth="1"
            />
          )),
        )}
      </svg>
    );
  }
  if (styleId === "model") {
    // A U-arch seen at an angle — reads as "the 3D one" next to the flat charts.
    return (
      <svg viewBox="0 0 48 36" className="h-8 w-full" aria-hidden>
        <ellipse
          cx="24"
          cy="20"
          rx="15"
          ry="9"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
        <ellipse
          cx="24"
          cy="16"
          rx="15"
          ry="9"
          fill="none"
          stroke={stroke}
          strokeWidth="1.2"
        />
        <path d="M9 16v4M39 16v4" stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 36" className="h-8 w-full" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const t = (i / 6) * Math.PI;
        const x = 8 + Math.cos(t) * 16 + 16;
        const y = 28 - Math.sin(t) * 14;
        return (
          <circle key={i} cx={x} cy={y} r="2.6" fill={fill} stroke={stroke} strokeWidth="1" />
        );
      })}
    </svg>
  );
}
