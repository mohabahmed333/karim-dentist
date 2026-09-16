import * as THREE from "three";
import {
  ARCH_CROWN,
  ARCH_ROOT,
} from "./applyArchClinicalMaterials";

export { nearestArchToothFdi, tagArchToothFdi } from "./tagArchToothFdi";

type PaintOpts = {
  focusMode: boolean;
  highlightColor: string;
  /** Teeth with an existing record but not the current selection. Defaults to highlightColor. */
  markedColor?: string;
  markedFdis: string[];
};

const TISSUE_TARGET = new THREE.Color(ARCH_ROOT);
const CROWN_TARGET = new THREE.Color(ARCH_CROWN);

/**
 * Selected / marked teeth use highlight; others stay clinical white.
 *
 * Stashes each material's *target* color rather than applying it directly —
 * AnatomicalArchModel's per-frame loop glides mat.color toward that target,
 * so picking a tooth reads as a smooth tint transition instead of an
 * instant, jarring color swap.
 */
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

    mat.emissive.set("#000000");
    mat.emissiveIntensity = 0;
    mat.transparent = false;
    mat.opacity = 1;

    if (mesh.userData.archTissue) {
      setArchTarget(mat, TISSUE_TARGET);
      return;
    }

    const fdi = mesh.userData.archFdi as string | undefined;
    const isMarked = fdi != null && marked.has(fdi);
    const isSelected = opts.focusMode && fdi === selectedFdi;

    if (isSelected) {
      // Soft tint toward crown white — no emissive glow.
      const tint = new THREE.Color(opts.highlightColor);
      tint.lerp(CROWN_TARGET, 0.45);
      setArchTarget(mat, tint);
    } else if (isMarked) {
      // A distinct hue from the selection color, so "has a record" and
      // "currently selected" read as different colors, not just different
      // intensities of the same one.
      const tint = new THREE.Color(opts.markedColor ?? opts.highlightColor);
      tint.lerp(CROWN_TARGET, 0.6);
      setArchTarget(mat, tint);
    } else {
      setArchTarget(mat, CROWN_TARGET);
    }
  });
}

/** Stash the color this material should glide toward in the next frames. */
function setArchTarget(
  mat: THREE.MeshPhysicalMaterial,
  target: THREE.Color,
): void {
  const current = mat.userData.archTargetColor as THREE.Color | undefined;
  if (current) current.copy(target);
  else mat.userData.archTargetColor = target.clone();
}
