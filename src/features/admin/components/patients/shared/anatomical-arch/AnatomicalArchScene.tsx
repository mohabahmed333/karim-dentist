"use client";

import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";
import { AnatomicalArchModel } from "./AnatomicalArchModel";

type Props = {
  selectedFdi: string | null;
  markedFdis?: string[];
  highlightColor?: string;
  focusMode?: boolean;
  flipped?: boolean;
  onSelectFdi?: (fdi: string) => void;
  onSelectUniversal?: (universal: number) => void;
};

export function AnatomicalArchScene(props: Props) {
  return (
    <>
      <ambientLight intensity={1.05} />
      <directionalLight position={[3.5, 7, 4]} intensity={1.15} />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.35} color="#e8eef5" />
      <hemisphereLight args={["#ffffff", "#d4d4d8", 0.5]} />
      <Suspense fallback={null}>
        <AnatomicalArchModel {...props} />
      </Suspense>
      <OrbitControls
        makeDefault
        target={[0, 0.15, 0.15]}
        enablePan
        enableRotate
        enableZoom
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
        panSpeed={0.8}
        minDistance={2.2}
        maxDistance={9}
        maxPolarAngle={Math.PI / 1.65}
      />
    </>
  );
}
