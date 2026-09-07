import * as THREE from "three";

/** Clinical palette matching white crowns + beige roots reference. */
export const ARCH_CROWN = "#FFFEF8";
export const ARCH_ROOT = "#CDB892";

function materialName(mesh: THREE.Mesh): string {
  const mat = mesh.material;
  if (Array.isArray(mat)) return mat.map((m) => m?.name ?? "").join(" ");
  return mat?.name ?? "";
}

/** True gum/tissue only — blinn18 in this GLB is a molar material, not gingiva. */
export function isArchTissueMesh(mesh: THREE.Mesh): boolean {
  const key = `${mesh.name} ${materialName(mesh)}`.toLowerCase();
  return (
    key.includes("gum") ||
    key.includes("gingiva") ||
    key.includes("tissue") ||
    key.includes("cast")
  );
}

export function applyArchClinicalMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const verts = mesh.geometry?.attributes?.position?.count ?? 0;
    if (verts < 8) {
      mesh.visible = false;
      return;
    }
    const tissue = isArchTissueMesh(mesh);
    mesh.material = new THREE.MeshPhysicalMaterial({
      color: tissue ? ARCH_ROOT : ARCH_CROWN,
      roughness: tissue ? 0.55 : 0.28,
      metalness: 0,
      clearcoat: tissue ? 0.05 : 0.35,
      clearcoatRoughness: tissue ? 0.6 : 0.28,
      side: THREE.DoubleSide,
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}
