"use client";

import { useMemo } from "react";
import { Center, RoundedBox, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { ToothGltfKind } from "@/services/notation";
import { toothGltfUrl } from "@/services/notation";

type Props = {
  kind: ToothGltfKind;
  available: boolean;
  selected: boolean;
  position: [number, number, number];
  rotationY: number;
  onSelect: () => void;
};

export function ChartingGltfTooth(props: Props) {
  if (!props.available) return <PlaceholderTooth {...props} />;
  return <LoadedTooth {...props} />;
}

function LoadedTooth({
  kind,
  selected,
  position,
  rotationY,
  onSelect,
}: Props) {
  const { scene } = useGLTF(toothGltfUrl(kind));
  const clone = useMemo(() => {
    const next = scene.clone(true);
    next.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: "#FFFFFF",
        roughness: 0.2,
        metalness: 0,
        clearcoat: 0.65,
        clearcoatRoughness: 0.15,
      });
    });
    return next;
  }, [scene]);

  const scale =
    kind === "molar" ? 0.72 : kind === "premolar" ? 0.62 : kind === "canine" ? 0.58 : 0.52;

  return (
    <group
      position={position}
      rotation={[0.1, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Center>
        <primitive object={clone} scale={scale} />
      </Center>
      {selected ? (
        <mesh position={[0, 0.35, 0.35]} rotation={[-0.4, 0, 0]} raycast={() => null}>
          <circleGeometry args={[0.28, 32]} />
          <meshBasicMaterial
            color="#F97316"
            transparent
            opacity={0.45}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function PlaceholderTooth({
  selected,
  position,
  rotationY,
  onSelect,
}: Props) {
  return (
    <RoundedBox
      args={[0.36, 0.55, 0.32]}
      radius={0.07}
      position={position}
      rotation={[0.1, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshPhysicalMaterial
        color={selected ? "#FFF7ED" : "#FFFFFF"}
        roughness={0.22}
        clearcoat={0.55}
        emissive={selected ? "#F97316" : "#000000"}
        emissiveIntensity={selected ? 0.2 : 0}
      />
    </RoundedBox>
  );
}
