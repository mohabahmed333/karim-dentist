import type { ArchToothSpec, ToothType } from "./dashboard.types";

const SLOT_TYPES: ToothType[] = [
  "molar",
  "molar",
  "molar",
  "premolar",
  "premolar",
  "canine",
  "lateral",
  "central",
  "central",
  "lateral",
  "canine",
  "premolar",
  "premolar",
  "molar",
  "molar",
  "molar",
];

function slot(index: number, upper: boolean): ArchToothSpec {
  const t = index / 15;
  const theta = upper
    ? Math.PI * (0.92 - 0.84 * t)
    : Math.PI * (0.08 + 0.84 * t);
  return {
    universal: upper ? index + 1 : index + 17,
    x: Math.cos(theta) * 2.58,
    y: upper ? 0.78 : -0.78,
    z: Math.sin(theta) * 1.68,
    rotateY: theta - Math.PI / 2,
    type: SLOT_TYPES[index] ?? "molar",
  };
}

export function archTeeth(): ArchToothSpec[] {
  return [
    ...Array.from({ length: 16 }, (_, i) => slot(i, true)),
    ...Array.from({ length: 16 }, (_, i) => slot(i, false)),
  ];
}
