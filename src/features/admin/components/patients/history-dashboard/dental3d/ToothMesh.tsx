"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ToothPosition } from "./arch-geometry";
import type { ToothConditionInfo } from "./dental3d.types";
import { SEVERITY_COLORS } from "./dental3d.types";

type Props = {
  tooth: ToothPosition;
  selected: boolean;
  highlightColor: string;
  toothMeshColor: string;
  condition?: ToothConditionInfo;
  onClick: () => void;
  onHover: (over: boolean) => void;
};

function toHex(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/** Rounded-box geometry approximating a tooth crown */
function crownGeometry(w: number, h: number, d: number, kind: ToothPosition["kind"]) {
  const geo = new THREE.BoxGeometry(w, h, d, 3, 3, 3);
  const pos = geo.attributes.position;
  if (!pos) return geo;
  // round corners by pushing vertices toward centre
  const radius = kind === "incisor" ? 0.08 : kind === "canine" ? 0.10 : 0.12;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.sqrt(x * x + z * z);
    if (len > 0.01) {
      const clamp = Math.max(0, len - radius) / len;
      pos.setX(i, x * clamp + x * (1 - clamp) * 0.82);
      pos.setZ(i, z * clamp + z * (1 - clamp) * 0.82);
    }
    // taper towards occlusal surface
    const t = (y / (h / 2) + 1) / 2; // 0 = cervical, 1 = occlusal
    if (t > 0.6) {
      const taper = 1 - (t - 0.6) * 0.35;
      pos.setX(i, pos.getX(i) * taper);
      pos.setZ(i, pos.getZ(i) * taper);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function ToothMesh({
  tooth,
  selected,
  highlightColor,
  toothMeshColor,
  condition,
  onClick,
  onHover,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(0);

  const [w, h, d] = tooth.size;

  const geo = useMemo(
    () => crownGeometry(w, h, d, tooth.kind),
    [w, h, d, tooth.kind],
  );

  useFrame(({ clock }) => {
    if (selected) {
      setPulse(Math.sin(clock.getElapsedTime() * 3) * 0.5 + 0.5);
    }
  });

  const baseColor = toHex(toothMeshColor);
  const hlColor = toHex(highlightColor);

  // surface tinting by severity
  const severityColor = condition
    ? toHex(SEVERITY_COLORS[condition.severity])
    : null;

  const emissiveColor = useMemo(() => {
    if (selected) return hlColor.clone().multiplyScalar(0.22 + pulse * 0.18);
    if (hovered) return hlColor.clone().multiplyScalar(0.14);
    if (severityColor) return severityColor.clone().multiplyScalar(0.1);
    return new THREE.Color(0, 0, 0);
  }, [selected, hovered, hlColor, severityColor, pulse]);

  const meshColor = useMemo(() => {
    if (severityColor && !selected) {
      return baseColor.clone().lerp(severityColor, 0.18);
    }
    return baseColor.clone();
  }, [baseColor, severityColor, selected]);

  return (
    <group
      position={tooth.position}
      rotation={[0, tooth.rotation, 0]}
    >
      <mesh
        ref={meshRef}
        geometry={geo}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); onHover(true); }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); onHover(false); }}
      >
        <meshStandardMaterial
          color={meshColor}
          emissive={emissiveColor}
          roughness={0.38}
          metalness={0.04}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Neon outline shell — only for selected */}
      {selected && (
        <mesh geometry={geo} scale={[1.06, 1.04, 1.06]}>
          <meshBasicMaterial
            color={highlightColor}
            transparent
            opacity={0.18 + pulse * 0.14}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Root stub */}
      <mesh position={[0, -(h / 2 + 0.18), 0]}>
        <cylinderGeometry args={[w * 0.22, w * 0.1, 0.38, 8]} />
        <meshStandardMaterial
          color={meshColor}
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}
