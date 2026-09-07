"use client";

import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { applyArchClinicalMaterials } from "./applyArchClinicalMaterials";
import {
  nearestArchToothFdi,
  paintArchSelection,
  tagArchToothFdi,
} from "./paintArchSelection";
import { ANATOMICAL_ARCH_FIT, ANATOMICAL_ARCH_URL } from "./archAsset";

type Props = {
  selectedFdi: string | null;
  markedFdis?: string[];
  highlightColor?: string;
  focusMode?: boolean;
  flipped?: boolean;
  onSelectFdi?: (fdi: string) => void;
  onSelectUniversal?: (universal: number) => void;
};

export function AnatomicalArchModel({
  selectedFdi,
  markedFdis = [],
  highlightColor = "#F97316",
  focusMode = false,
  flipped = false,
  onSelectFdi,
  onSelectUniversal,
}: Props) {
  const { scene } = useGLTF(ANATOMICAL_ARCH_URL);
  const { camera } = useThree();

  const root = useMemo(() => {
    const group = new THREE.Group();
    const next = scene.clone(true);
    applyArchClinicalMaterials(next);
    group.add(next);
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = ANATOMICAL_ARCH_FIT / maxDim;
    group.scale.setScalar(scale);
    group.position.sub(center.multiplyScalar(scale));
    tagArchToothFdi(group);
    return group;
  }, [scene]);

  useLayoutEffect(() => {
    camera.lookAt(0, 0.1, 0.2);
  }, [camera]);

  useLayoutEffect(() => {
    paintArchSelection(root, selectedFdi, {
      focusMode,
      highlightColor,
      markedFdis,
    });
  }, [root, selectedFdi, markedFdis, focusMode, highlightColor]);

  return (
    <group
      scale={[flipped ? -1 : 1, 1, 1]}
      onClick={(event) => {
        event.stopPropagation();
        const hitMesh = event.intersections
          .map((hit) => hit.object as THREE.Mesh)
          .find(
            (mesh) =>
              mesh.isMesh &&
              !mesh.userData.archTissue &&
              Boolean(mesh.userData.archFdi),
          );

        let fdi = hitMesh?.userData.archFdi as string | undefined;
        let universal = hitMesh?.userData.archUniversal as number | undefined;

        if (!fdi) {
          const point = event.point.clone();
          if (flipped) point.x *= -1;
          const nearest = nearestArchToothFdi(root, point);
          if (!nearest) return;
          fdi = nearest.fdi;
          universal = nearest.universal;
        }

        onSelectFdi?.(fdi);
        if (universal != null) onSelectUniversal?.(universal);
      }}
    >
      <primitive object={root} />
    </group>
  );
}

useGLTF.preload(ANATOMICAL_ARCH_URL);
