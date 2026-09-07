"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { upperArchPoints, lowerArchPoints } from "./arch-geometry";

type Props = { gumMeshColor: string };

function buildGumMesh(archPts: THREE.Vector3[], y: number, sign: 1 | -1): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(archPts);
  const tubeSegments = 96;
  const radius = 0.32;
  const radialSegments = 10;

  const tube = new THREE.TubeGeometry(curve, tubeSegments, radius, radialSegments, false);

  // flatten slightly in Y so it looks like a gum pad, not a tube
  const pos = tube.attributes.position;
  if (!pos) return tube;
  for (let i = 0; i < pos.count; i++) {
    const localY = pos.getY(i);
    pos.setY(i, y + localY * 0.38 * sign);
  }
  tube.computeVertexNormals();
  return tube;
}

export function GumMesh({ gumMeshColor }: Props) {
  const upperPts = useMemo(() => upperArchPoints(), []);
  const lowerPts = useMemo(() => lowerArchPoints(), []);

  const upperGeo = useMemo(() => buildGumMesh(upperPts, 0.18, 1), [upperPts]);
  const lowerGeo = useMemo(() => buildGumMesh(lowerPts, -0.18, -1), [lowerPts]);

  return (
    <group>
      <mesh geometry={upperGeo} receiveShadow>
        <meshStandardMaterial
          color={gumMeshColor}
          roughness={0.72}
          metalness={0.01}
        />
      </mesh>
      <mesh geometry={lowerGeo} receiveShadow>
        <meshStandardMaterial
          color={gumMeshColor}
          roughness={0.72}
          metalness={0.01}
        />
      </mesh>
    </group>
  );
}
