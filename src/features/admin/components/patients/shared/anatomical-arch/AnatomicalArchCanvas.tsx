"use client";

import { Canvas } from "@react-three/fiber";
import { AnatomicalArchScene } from "./AnatomicalArchScene";

type Props = {
  selectedFdi: string | null;
  markedFdis?: string[];
  highlightColor?: string;
  focusMode?: boolean;
  flipped?: boolean;
  onSelectFdi?: (fdi: string) => void;
  onSelectUniversal?: (universal: number) => void;
  className?: string;
  /** Camera Z distance — higher = smaller-looking teeth in the frame. */
  cameraZ?: number;
};

export function AnatomicalArchCanvas({
  className = "h-full min-h-[240px] w-full",
  cameraZ = 5.2,
  ...scene
}: Props) {
  return (
    <Canvas
      camera={{
        position: [0, cameraZ * 0.35, cameraZ],
        fov: 35,
        near: 0.1,
        far: 80,
      }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      className={className}
      style={{ background: "transparent" }}
    >
      <AnatomicalArchScene {...scene} />
    </Canvas>
  );
}
