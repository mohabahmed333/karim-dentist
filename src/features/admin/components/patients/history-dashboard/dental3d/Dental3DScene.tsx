"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { GumMesh } from "./GumMesh";
import { ToothMesh } from "./ToothMesh";
import { ToothPin } from "./ToothPin";
import { ToothHoverLabel } from "./ToothHoverLabel";
import { useCameraPreset } from "./useCameraPreset";
import { TOOTH_POSITIONS } from "./arch-geometry";
import type { SceneProps } from "./dental3d.types";

export function Dental3DScene({
  selectedToothId,
  toothConditions,
  viewMode,
  enableOrbitControls,
  autoRotate,
  highlightColor,
  toothMeshColor,
  gumMeshColor,
  onToothClick,
  onToothHover,
}: SceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const { animate } = useCameraPreset({
    viewMode,
    selectedToothId,
    toothPositions: TOOTH_POSITIONS,
    camera,
    controls: controlsRef.current,
  });

  useFrame(() => {
    animate();
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 4, -3]} intensity={0.5} color="#ffeedd" />
      <pointLight position={[0, -3, 3]} intensity={0.3} color="#ffe4e4" />
      <Environment preset="studio" environmentIntensity={0.3} />

      {/* Gum pads */}
      <GumMesh gumMeshColor={gumMeshColor} />

      {/* Teeth */}
      {TOOTH_POSITIONS.map((tooth) => {
        const cond = toothConditions[tooth.id];
        const isSelected = tooth.id === selectedToothId;
        const isHovered = tooth.id === hoveredId;

        return (
          <group key={tooth.id}>
            <ToothMesh
              tooth={tooth}
              selected={isSelected}
              highlightColor={highlightColor}
              toothMeshColor={toothMeshColor}
              condition={cond}
              onClick={() => onToothClick(tooth.id)}
              onHover={(over) => {
                setHoveredId(over ? tooth.id : null);
                onToothHover(over ? tooth.id : null);
              }}
            />

            {/* Floating count badge for teeth with conditions */}
            {cond && (
              <ToothPin
                position={tooth.position}
                toothId={tooth.id}
                selected={isSelected}
                highlightColor={highlightColor}
                condition={cond}
                onClick={() => onToothClick(tooth.id)}
              />
            )}

            {/* Hover tooltip */}
            {isHovered && !isSelected && (
              <ToothHoverLabel
                position={tooth.position}
                toothId={tooth.id}
                condition={cond}
                arch={tooth.arch}
              />
            )}
          </group>
        );
      })}

      {/* Orbit controls */}
      {enableOrbitControls && (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.55}
          zoomSpeed={0.7}
          minDistance={2.5}
          maxDistance={14}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          makeDefault
        />
      )}
    </>
  );
}
