import * as THREE from "three";
import { fdiForUniversalAdult } from "@/services/notation";
import { assignArchUniversals } from "./assignArchUniversals";
import { isArchTissueMesh } from "./applyArchClinicalMaterials";

/** Stamp each tooth mesh with a unique FDI from arch order (not raw x bins). */
export function tagArchToothFdi(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const center = new THREE.Vector3();
  const teeth: {
    mesh: THREE.Mesh;
    id: string;
    x: number;
    y: number;
    z: number;
  }[] = [];

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible) return;
    if (isArchTissueMesh(mesh)) {
      mesh.userData.archTissue = true;
      mesh.userData.archFdi = undefined;
      mesh.userData.archUniversal = undefined;
      return;
    }
    mesh.userData.archTissue = false;
    new THREE.Box3().setFromObject(mesh).getCenter(center);
    const id = mesh.uuid;
    teeth.push({ mesh, id, x: center.x, y: center.y, z: center.z });
  });

  const assigned = assignArchUniversals(
    teeth.map(({ id, x, y, z }) => ({ id, x, y, z })),
  );

  for (const tooth of teeth) {
    const universal = assigned.get(tooth.id);
    tooth.mesh.userData.archUniversal = universal ?? null;
    tooth.mesh.userData.archFdi =
      universal != null ? fdiForUniversalAdult(universal) : null;
  }
}

/** Nearest tagged tooth to a world point (for gum / edge clicks). */
export function nearestArchToothFdi(
  root: THREE.Object3D,
  point: THREE.Vector3,
): { fdi: string; universal: number } | null {
  const center = new THREE.Vector3();
  let bestFdi: string | null = null;
  let bestUniversal: number | null = null;
  let bestDist = Infinity;
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || mesh.userData.archTissue) return;
    const fdi = mesh.userData.archFdi as string | undefined;
    const universal = mesh.userData.archUniversal as number | undefined;
    if (!fdi || universal == null) return;
    new THREE.Box3().setFromObject(mesh).getCenter(center);
    const dist = center.distanceToSquared(point);
    if (dist < bestDist) {
      bestDist = dist;
      bestFdi = fdi;
      bestUniversal = universal;
    }
  });
  if (!bestFdi || bestUniversal == null) return null;
  return { fdi: bestFdi, universal: bestUniversal };
}
