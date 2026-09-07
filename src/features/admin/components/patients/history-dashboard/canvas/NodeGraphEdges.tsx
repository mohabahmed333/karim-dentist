"use client";

type EdgePath = { id: string; d: string; active: boolean };

type Props = {
  width: number;
  height: number;
  paths: EdgePath[];
};

export function NodeGraphEdges({ width, height, paths }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
      aria-hidden
    >
      {paths.map((path) => (
        <path
          key={path.id}
          d={path.d}
          fill="none"
          stroke={path.active ? "#E2F163" : "rgba(0,0,0,0.15)"}
          strokeWidth={path.active ? 3 : 1.5}
          vectorEffect="non-scaling-stroke"
          className={path.active ? "hx-path-glow hx-path-active hx-bezier-path" : "hx-bezier-path"}
        />
      ))}
    </svg>
  );
}
