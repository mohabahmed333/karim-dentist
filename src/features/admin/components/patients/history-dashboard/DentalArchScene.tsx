"use client";

import { OrbitControls } from "@react-three/drei";
import { ArchTooth } from "./ArchTooth";
import { archTeeth } from "./archLayout";
import { GingivaMesh } from "./GingivaMesh";
import { ToothBadgeHtml } from "./ToothBadgeHtml";
import { ToothNumberLabels } from "./ToothNumberLabels";

type Badge = { tooth: number; count: number; glowing: boolean };

type Props = {
  activeTooth: number;
  badges: Badge[];
  onSelectTooth: (tooth: number) => void;
  onHoverTooth: (tooth: number | null) => void;
};

export function DentalArchScene({
  activeTooth,
  badges,
  onSelectTooth,
  onHoverTooth,
}: Props) {
  const teeth = archTeeth();
  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight position={[2.4, 4.8, 5]} intensity={1.2} />
      <directionalLight position={[-3, 1.2, -1.5]} intensity={0.28} />
      <group rotation={[0.08, 0.18, 0]}>
        <GingivaMesh />
        {teeth.map((tooth) => (
          <ArchTooth
            key={tooth.universal}
            spec={tooth}
            lit={tooth.universal === activeTooth}
            onSelect={onSelectTooth}
            onHover={onHoverTooth}
          />
        ))}
        <ToothNumberLabels teeth={teeth} />
        {badges.map((badge) => {
          const tooth = teeth.find((item) => item.universal === badge.tooth);
          if (!tooth) return null;
          return (
            <ToothBadgeHtml
              key={badge.tooth}
              position={[tooth.x, tooth.y + 0.5, tooth.z]}
              badge={badge}
              onHover={onHoverTooth}
              onSelect={onSelectTooth}
            />
          );
        })}
      </group>
      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.45}
        minDistance={4.2}
        maxDistance={9}
        target={[0, 0, 0.2]}
        minPolarAngle={0.45}
        maxPolarAngle={1.05}
      />
    </>
  );
}
