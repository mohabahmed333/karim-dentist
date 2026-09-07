"use client";

import { Suspense } from "react";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import {
  chartToothKind,
  toothGltfKind,
  type Dentition,
  type ToothGltfKind,
} from "@/services/notation";
import { ChartingGumPads } from "./ChartingGumPads";
import { chartGltfSlots } from "./chartGltfLayout";
import { ChartingGltfTooth } from "./ChartingGltfTooth";

type Props = {
  dentition: Dentition;
  selectedFdi: string | null;
  available: Set<ToothGltfKind>;
  onSelect: (fdi: string) => void;
};

export function ChartingGltfScene({
  dentition,
  selectedFdi,
  available,
  onSelect,
}: Props) {
  const slots = chartGltfSlots(dentition);
  return (
    <>
      <color attach="background" args={["#7A7A7A"]} />
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[3.5, 7, 4]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.4} color="#ffe8dc" />
      <hemisphereLight args={["#f5f5f5", "#6b6b6b", 0.45]} />
      {dentition === "adult" ? <ChartingGumPads /> : null}
      <Suspense fallback={null}>
        {slots.map((slot) => {
          const kind = toothGltfKind(chartToothKind(slot.fdi));
          return (
            <ChartingGltfTooth
              key={slot.fdi}
              kind={kind}
              available={available.has(kind)}
              selected={selectedFdi === slot.fdi}
              position={slot.position}
              rotationY={slot.rotationY}
              onSelect={() => onSelect(slot.fdi)}
            />
          );
        })}
      </Suspense>
      <ContactShadows
        position={[0, -1.05, 0.6]}
        opacity={0.35}
        scale={12}
        blur={2.4}
        far={4}
      />
      <OrbitControls
        makeDefault
        target={[0, 0, 0.35]}
        enablePan={false}
        minDistance={4}
        maxDistance={11}
        maxPolarAngle={Math.PI / 1.7}
      />
    </>
  );
}
