"use client";

import { Canvas } from "@react-three/fiber";
import type { Dentition, ToothGltfKind } from "@/services/notation";
import { ChartingGltfScene } from "./ChartingGltfScene";

type Props = {
  dentition: Dentition;
  selectedFdi: string | null;
  available: Set<ToothGltfKind>;
  onSelect: (fdi: string) => void;
};

export function ChartingGltfCanvas(props: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.6, 7.4], fov: 36, near: 0.1, far: 80 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      className="h-full min-h-[320px] w-full rounded-xl"
      style={{ background: "#7A7A7A" }}
    >
      <ChartingGltfScene {...props} />
    </Canvas>
  );
}
