"use client";

import { Text } from "@react-three/drei";
import type { ArchToothSpec } from "./dashboard.types";

type Props = { teeth: ArchToothSpec[] };

export function ToothNumberLabels({ teeth }: Props) {
  return (
    <>
      {teeth.map((tooth) => (
        <Text
          key={tooth.universal}
          position={[
            tooth.x,
            tooth.y + (tooth.y > 0 ? 0.24 : -0.24),
            tooth.z + 0.04,
          ]}
          fontSize={0.1}
          color="#111111"
          anchorX="center"
          anchorY="middle"
        >
          {String(tooth.universal)}
        </Text>
      ))}
    </>
  );
}
