"use client";

import { RoundedBox } from "@react-three/drei";
import type { ArchToothSpec } from "./dashboard.types";

function size(type: ArchToothSpec["type"]) {
  if (type === "molar") return { w: 0.3, h: 0.34, d: 0.28 };
  if (type === "premolar") return { w: 0.2, h: 0.32, d: 0.2 };
  if (type === "canine") return { w: 0.14, h: 0.4, d: 0.14 };
  if (type === "lateral") return { w: 0.12, h: 0.36, d: 0.12 };
  return { w: 0.15, h: 0.38, d: 0.11 };
}

type Props = {
  spec: ArchToothSpec;
  lit: boolean;
  onSelect?: (id: number) => void;
  onHover?: (id: number | null) => void;
};

export function ArchTooth({ spec, lit, onSelect, onHover }: Props) {
  const { w, h, d } = size(spec.type);
  return (
    <RoundedBox
      args={[w, h, d]}
      radius={0.045}
      smoothness={3}
      position={[spec.x, spec.y, spec.z]}
      rotation={[spec.y > 0 ? 0.16 : -0.16, spec.rotateY, 0]}
      castShadow
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.(spec.universal);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
        onHover?.(spec.universal);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onHover?.(null);
      }}
    >
      <meshStandardMaterial
        color={lit ? "#E2F163" : "#f7f1e7"}
        emissive={lit ? "#8ea32a" : "#000000"}
        emissiveIntensity={lit ? 0.28 : 0}
        roughness={0.36}
      />
    </RoundedBox>
  );
}
