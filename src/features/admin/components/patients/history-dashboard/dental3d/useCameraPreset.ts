"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ViewMode } from "./dental3d.types";
import type { TOOTH_POSITIONS } from "./arch-geometry";

type CameraPreset = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};

const PRESETS: Record<ViewMode, CameraPreset> = {
  LATERAL: {
    position: new THREE.Vector3(0, 0.6, 7.2),
    target: new THREE.Vector3(0, 0, 0),
  },
  UPPER_OCCLUSAL: {
    position: new THREE.Vector3(0, 7.5, 0.1),
    target: new THREE.Vector3(0, 0, 0),
  },
  LOWER_OCCLUSAL: {
    position: new THREE.Vector3(0, -7.5, 0.1),
    target: new THREE.Vector3(0, 0, 0),
  },
  SINGLE_TOOTH: {
    // overridden per-tooth in the hook
    position: new THREE.Vector3(0, 1.0, 3.5),
    target: new THREE.Vector3(0, 0, 0),
  },
};

type Args = {
  viewMode: ViewMode;
  selectedToothId: number | null;
  toothPositions: typeof TOOTH_POSITIONS;
  camera: THREE.Camera;
  controls: { target: THREE.Vector3 } | null;
};

const LERP_SPEED = 0.07;

export function useCameraPreset({
  viewMode,
  selectedToothId,
  toothPositions,
  camera,
  controls,
}: Args) {
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const initiated = useRef(false);

  useEffect(() => {
    const preset = PRESETS[viewMode];
    let pos = preset.position.clone();
    let look = preset.target.clone();

    if (viewMode === "SINGLE_TOOTH" && selectedToothId !== null) {
      const tp = toothPositions.find((t) => t.id === selectedToothId);
      if (tp) {
        look = tp.position.clone();
        pos = tp.position.clone().add(new THREE.Vector3(0, 0.8, 2.4));
      }
    }

    targetPos.current.copy(pos);
    targetLook.current.copy(look);

    if (!initiated.current) {
      camera.position.copy(pos);
      if (controls) controls.target.copy(look);
      initiated.current = true;
    }
  }, [viewMode, selectedToothId, toothPositions, camera, controls]);

  // called every frame from useFrame
  function animate() {
    camera.position.lerp(targetPos.current, LERP_SPEED);
    if (controls) {
      controls.target.lerp(targetLook.current, LERP_SPEED);
    }
  }

  return { animate };
}
