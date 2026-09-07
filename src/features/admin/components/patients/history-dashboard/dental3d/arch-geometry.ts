import * as THREE from "three";

// ---------------------------------------------------------------------------
// ARCH SHAPE
// Maxillary (upper) and Mandibular (lower) arches share the same U-shape
// parameterised with the parabolic function:
//   x(t) = A * t
//   z(t) = B * t^2 - C
// t runs from -1 (right posterior) to +1 (left posterior)
// ---------------------------------------------------------------------------

const MAX_A = 3.2; // half-width of upper arch
const MAX_B = 4.8; // depth of upper arch
const MAN_A = 2.9;
const MAN_B = 4.2;

const TEETH_PER_ARCH = 16;

/** 2D parametric position on arch curve for tooth index 0–15 (left to right) */
function archPoint(
  index: number,
  a: number,
  b: number,
  count = TEETH_PER_ARCH,
): { x: number; z: number } {
  const t = (index / (count - 1)) * 2 - 1; // -1..+1
  return { x: a * t, z: b * t * t - b * 0.05 };
}

/** Rotation angle so tooth faces outward along the arch tangent */
function archAngle(
  index: number,
  a: number,
  b: number,
  count = TEETH_PER_ARCH,
): number {
  const dt = 0.01;
  const t0 = (index / (count - 1)) * 2 - 1;
  const t1 = t0 + dt;
  const dx = a * t1 - a * t0;
  const dz = b * t1 * t1 - b * t0 * t0;
  return Math.atan2(dx, dz);
}

// ---------------------------------------------------------------------------
// TOOTH SIZE LOOKUP  (universal #1–#32)
// Values are [width, height, depth] in world units
// ---------------------------------------------------------------------------
export type ToothKind = "molar" | "premolar" | "canine" | "incisor";

export const TOOTH_KIND: Record<number, ToothKind> = {};
export const TOOTH_SIZE: Record<number, [number, number, number]> = {};

function assignArchSizes(universalBase: number, reversed = false) {
  // upper (1–16) and lower (17–32) share the same 16-tooth pattern each arch
  const pattern: ToothKind[] = [
    "molar",
    "molar",
    "molar",
    "premolar",
    "premolar",
    "canine",
    "incisor",
    "incisor",
    "incisor",
    "incisor",
    "canine",
    "premolar",
    "premolar",
    "molar",
    "molar",
    "molar",
  ];
  const sizes: Record<ToothKind, [number, number, number]> = {
    molar:    [0.68, 0.76, 0.64],
    premolar: [0.52, 0.72, 0.50],
    canine:   [0.44, 0.86, 0.42],
    incisor:  [0.40, 0.80, 0.34],
  };
  const indices = reversed ? [...pattern].reverse() : pattern;
  indices.forEach((kind, i) => {
    const id = universalBase + i;
    TOOTH_KIND[id] = kind;
    TOOTH_SIZE[id] = sizes[kind];
  });
}

assignArchSizes(1);
assignArchSizes(17);

// ---------------------------------------------------------------------------
// TOOTH WORLD POSITIONS
// ---------------------------------------------------------------------------
export type ToothPosition = {
  id: number;          // universal 1–32
  position: THREE.Vector3;
  rotation: number;    // Y-rotation
  size: [number, number, number];
  kind: ToothKind;
  arch: "upper" | "lower";
};

const UPPER_Y = 0.38;    // y position of upper arch teeth
const LOWER_Y = -0.38;

export const TOOTH_POSITIONS: ToothPosition[] = [];

// Upper arch: universal 1–16, arch index 0–15 right to left
for (let i = 0; i < 16; i++) {
  const id = i + 1;
  const { x, z } = archPoint(i, MAX_A, MAX_B);
  const rot = archAngle(i, MAX_A, MAX_B);
  const size = TOOTH_SIZE[id] ?? [0.5, 0.7, 0.5];
  TOOTH_POSITIONS.push({
    id,
    position: new THREE.Vector3(x, UPPER_Y, z),
    rotation: rot,
    size: size as [number, number, number],
    kind: TOOTH_KIND[id] ?? "molar",
    arch: "upper",
  });
}

// Lower arch: universal 17–32, arch index 0–15 (mirror)
for (let i = 0; i < 16; i++) {
  const id = i + 17;
  const { x, z } = archPoint(15 - i, MAN_A, MAN_B); // mirrored
  const rot = archAngle(15 - i, MAN_A, MAN_B);
  const size = TOOTH_SIZE[id] ?? [0.5, 0.7, 0.5];
  TOOTH_POSITIONS.push({
    id,
    position: new THREE.Vector3(x, LOWER_Y, z),
    rotation: rot + Math.PI, // lower arch teeth face opposite
    size: size as [number, number, number],
    kind: TOOTH_KIND[id] ?? "molar",
    arch: "lower",
  });
}

// ---------------------------------------------------------------------------
// ARCH CURVE POINTS for gum mesh
// ---------------------------------------------------------------------------
export function archCurvePoints(
  a: number,
  b: number,
  segments = 48,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 - 1;
    pts.push(new THREE.Vector3(a * t, 0, b * t * t - b * 0.05));
  }
  return pts;
}

export function upperArchPoints() { return archCurvePoints(MAX_A, MAX_B); }
export function lowerArchPoints() { return archCurvePoints(MAN_A, MAN_B); }
