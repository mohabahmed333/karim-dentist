"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  lowerArchPoints,
  upperArchPoints,
} from "../../history-dashboard/dental3d/arch-geometry";

function buildGumPad(
  archPts: THREE.Vector3[],
  y: number,
  sign: 1 | -1,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(archPts);
  const tube = new THREE.TubeGeometry(curve, 96, 0.36, 12, false);
  const pos = tube.attributes.position;
  if (!pos) return tube;
  for (let i = 0; i < pos.count; i++) {
    const localY = pos.getY(i);
    pos.setY(i, y + localY * 0.42 * sign);
  }
  tube.computeVertexNormals();
  return tube;
}

/** Pink glossy gingiva matching the reference dental viewer. */
export function ChartingGumPads() {
  const upperPts = useMemo(() => upperArchPoints(), []);
  const lowerPts = useMemo(() => lowerArchPoints(), []);
  const upperGeo = useMemo(
    () => buildGumPad(upperPts, 0.16, 1),
    [upperPts],
  );
  const lowerGeo = useMemo(
    () => buildGumPad(lowerPts, -0.16, -1),
    [lowerPts],
  );

  return (
    <group>
      <mesh geometry={upperGeo} receiveShadow castShadow>
        <meshPhysicalMaterial
          color="#E8919A"
          roughness={0.42}
          metalness={0.0}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
        />
      </mesh>
      <mesh geometry={lowerGeo} receiveShadow castShadow>
        <meshPhysicalMaterial
          color="#E8919A"
          roughness={0.42}
          metalness={0.0}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
        />
      </mesh>
    </group>
  );
}
