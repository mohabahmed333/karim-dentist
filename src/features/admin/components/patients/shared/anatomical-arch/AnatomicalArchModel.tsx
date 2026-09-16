"use client";

import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { applyArchClinicalMaterials } from "./applyArchClinicalMaterials";
import {
  nearestArchToothFdi,
  paintArchSelection,
  tagArchToothFdi,
} from "./paintArchSelection";
import { ANATOMICAL_ARCH_FIT, ANATOMICAL_ARCH_URL } from "./archAsset";

/** How fast a tooth's material glides to its new color — higher = snappier. */
const ARCH_COLOR_GLIDE_SPEED = 12;
/** Skip the lerp once a material is this close to its target (distance-squared, RGB 0–1 scale). */
const ARCH_COLOR_SNAP_EPSILON = 0.0001;

type Props = {
  selectedFdi: string | null;
  markedFdis?: string[];
  highlightColor?: string;
  markedColor?: string;
  focusMode?: boolean;
  flipped?: boolean;
  onSelectFdi?: (fdi: string) => void;
  onSelectUniversal?: (universal: number) => void;
};

export function AnatomicalArchModel({
  selectedFdi,
  markedFdis = [],
  highlightColor = "#F97316",
  markedColor,
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
      markedColor,
      markedFdis,
    });
  }, [root, selectedFdi, markedFdis, focusMode, highlightColor, markedColor]);

  // Cached once per model load so the per-frame glide below is a flat loop,
  // not a scene-graph traversal every frame.
  const paintableMaterials = useMemo(() => {
    const materials: THREE.MeshPhysicalMaterial[] = [];
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      if (mesh.isMesh && mat?.isMeshPhysicalMaterial) materials.push(mat);
    });
    return materials;
  }, [root]);

  // paintArchSelection only stashes a target color on each material —
  // glide toward it here so picking a tooth reads as a smooth tint
  // transition instead of an instant swap.
  useFrame((_, delta) => {
    const factor = 1 - Math.exp(-delta * ARCH_COLOR_GLIDE_SPEED);
    for (const mat of paintableMaterials) {
      const target = mat.userData.archTargetColor as THREE.Color | undefined;
      if (!target) continue;
      const dr = target.r - mat.color.r;
      const dg = target.g - mat.color.g;
      const db = target.b - mat.color.b;
      if (dr * dr + dg * dg + db * db < ARCH_COLOR_SNAP_EPSILON) continue;
      mat.color.lerp(target, factor);
      mat.needsUpdate = true;
    }
  });

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
          // event.point and the mesh centers nearestArchToothFdi measures are
          // both world-space, so both already carry the flip — un-mirroring
          // the point here picked the tooth on the opposite side of the arch.
          const nearest = nearestArchToothFdi(root, event.point);
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
