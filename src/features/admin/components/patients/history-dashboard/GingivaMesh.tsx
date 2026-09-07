"use client";

import { archTeeth } from "./archLayout";

export function GingivaMesh() {
  return (
    <group>
      {archTeeth().map((tooth) => (
        <mesh
          key={tooth.universal}
          position={[tooth.x, tooth.y * 0.36, tooth.z]}
        >
          <sphereGeometry
            args={[tooth.type === "molar" ? 0.11 : 0.08, 10, 8]}
          />
          <meshStandardMaterial
            color={tooth.y > 0 ? "#d09a90" : "#c88880"}
            roughness={0.82}
          />
        </mesh>
      ))}
    </group>
  );
}
