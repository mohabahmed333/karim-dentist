import type { ChartToothKind } from "./chartToothKind";

export type ToothGltfKind = "incisor" | "canine" | "premolar" | "molar";

export const TOOTH_GLTF_KINDS: readonly ToothGltfKind[] = [
  "incisor",
  "canine",
  "premolar",
  "molar",
];

/** Maps Charting silhouette kinds onto shared GLB templates. */
export function toothGltfKind(kind: ChartToothKind): ToothGltfKind {
  if (kind === "central" || kind === "lateral") return "incisor";
  return kind;
}

/** Bump when regenerating meshes so browsers refetch. */
const TOOTH_GLTF_VERSION = "3";

export function toothGltfUrl(kind: ToothGltfKind): string {
  return `/dental/teeth/${kind}.glb?v=${TOOTH_GLTF_VERSION}`;
}

export async function probeToothGltfKinds(
  fetchImpl: typeof fetch = fetch,
): Promise<Set<ToothGltfKind>> {
  const found = new Set<ToothGltfKind>();
  await Promise.all(
    TOOTH_GLTF_KINDS.map(async (kind) => {
      try {
        // Prefer GET — some static hosts mishandle HEAD.
        const res = await fetchImpl(toothGltfUrl(kind), {
          method: "GET",
          cache: "no-cache",
        });
        if (res.ok) found.add(kind);
      } catch {
        /* missing or offline */
      }
    }),
  );
  return found;
}
