"use client";

import { Canvas } from "@react-three/fiber";
import { DentalArchScene } from "./DentalArchScene";

type Badge = { tooth: number; count: number; glowing: boolean };

type Props = {
  activeTooth: number;
  badges: Badge[];
  onSelectTooth: (tooth: number) => void;
  onHoverTooth: (tooth: number | null) => void;
};

export function DentalArchCanvas({
  activeTooth,
  badges,
  onSelectTooth,
  onHoverTooth,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 4.2, 3.4], fov: 34 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <DentalArchScene
        activeTooth={activeTooth}
        badges={badges}
        onSelectTooth={onSelectTooth}
        onHoverTooth={onHoverTooth}
      />
    </Canvas>
  );
}
