"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Dental3DScene } from "./Dental3DScene";
import { ViewModeToggle } from "./ViewModeToggle";
import type { Dental3DModelProps, ViewMode } from "./dental3d.types";

export function Dental3DModel({
  selectedToothId,
  toothConditions = {},
  viewMode: viewModeProp,
  enableOrbitControls = true,
  autoRotate = false,
  highlightColor = "#E2F163",
  toothMeshColor = "#F5F5F0",
  gumMeshColor = "#E5A2A2",
  onToothClick,
  onToothHover,
}: Dental3DModelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(viewModeProp ?? "LATERAL");

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[#EBEAE5]">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 0.6, 7.2], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#EBEAE5" }}
      >
        <Suspense fallback={null}>
          <Dental3DScene
            selectedToothId={selectedToothId}
            toothConditions={toothConditions}
            viewMode={viewMode}
            enableOrbitControls={enableOrbitControls}
            autoRotate={autoRotate}
            highlightColor={highlightColor}
            toothMeshColor={toothMeshColor}
            gumMeshColor={gumMeshColor}
            onToothClick={onToothClick}
            onToothHover={onToothHover}
          />
        </Suspense>
      </Canvas>

      {/* View mode controls — overlaid at bottom */}
      <div className="absolute bottom-3 start-1/2 z-10 -translate-x-1/2">
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Selected tooth label — top left */}
      {selectedToothId !== null && (
        <div className="pointer-events-none absolute top-3 start-3 z-10">
          <span className="rounded-full bg-[#E2F163] px-3 py-1 text-[11px] font-semibold text-[#111111] shadow">
            Tooth #{selectedToothId}
          </span>
        </div>
      )}
    </div>
  );
}
