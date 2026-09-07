import * as THREE from "three";
import {
  ARCH_CROWN,
  ARCH_ROOT,
} from "./applyArchClinicalMaterials";

export { nearestArchToothFdi, tagArchToothFdi } from "./tagArchToothFdi";

type PaintOpts = {
  focusMode: boolean;
  highlightColor: string;
  markedFdis: string[];
};

/** Selected / marked teeth use highlight; others stay clinical white. */
export function paintArchSelection(
  root: THREE.Object3D,
  selectedFdi: string | null,
  opts: PaintOpts,
): void {
  const marked = new Set(opts.markedFdis.filter(Boolean));
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible) return;
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    if (!mat?.isMeshPhysicalMaterial) return;

    if (mesh.userData.archTissue) {
      mat.color.set(ARCH_ROOT);
      mat.emissive.set("#000000");
      mat.emissiveIntensity = 0;
      mat.transparent = false;
      mat.opacity = 1;
      mat.needsUpdate = true;
      return;
    }

    const fdi = mesh.userData.archFdi as string | undefined;
    const isMarked = fdi != null && marked.has(fdi);
    const isSelected = opts.focusMode && fdi === selectedFdi;

    if (isSelected || isMarked) {
      // Soft tint toward crown white — no emissive glow.
      const tint = new THREE.Color(opts.highlightColor);
      tint.lerp(new THREE.Color(ARCH_CROWN), isSelected ? 0.55 : 0.72);
      mat.color.copy(tint);
      mat.emissive.set("#000000");
      mat.emissiveIntensity = 0;
    } else {
      mat.color.set(ARCH_CROWN);
      mat.emissive.set("#000000");
      mat.emissiveIntensity = 0;
    }
    mat.transparent = false;
    mat.opacity = 1;
    mat.needsUpdate = true;
  });
}
