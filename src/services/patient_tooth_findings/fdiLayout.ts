import {
  FDI_NUMBERS,
  LOWER_LEFT,
  LOWER_RIGHT,
  UPPER_LEFT,
  UPPER_RIGHT,
  type FdiNumber,
} from "./fdi.ts";

export const ODONTOGRAM_VIEWBOX = { width: 400, height: 480, cx: 200, cy: 240 };

export type ToothPosition = {
  fdi: FdiNumber;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  rotate: number;
};

const UPPER = [...UPPER_RIGHT, ...UPPER_LEFT];
const LOWER = [...LOWER_RIGHT, ...LOWER_LEFT];

function archPoint(t: number, cy: number, rx: number, ry: number, ySign: 1 | -1) {
  const { cx } = ODONTOGRAM_VIEWBOX;
  const angle = Math.PI * (1 - t);
  return {
    x: cx + rx * Math.cos(angle),
    y: cy + ySign * ry * Math.sin(Math.PI * t),
    angle,
  };
}

function placeArch(
  numbers: readonly string[],
  cy: number,
  ySign: 1 | -1,
  rx: number,
  ry: number,
  labelScale: number,
): ToothPosition[] {
  const last = Math.max(numbers.length - 1, 1);
  return numbers.map((fdi, index) => {
    const t = index / last;
    const point = archPoint(t, cy, rx, ry, ySign);
    const label = archPoint(t, cy, rx * labelScale, ry * labelScale, ySign);
    return {
      fdi: fdi as FdiNumber,
      x: point.x,
      y: point.y,
      labelX: label.x,
      labelY: label.y,
      rotate: ySign === -1 ? (1 - t) * 180 - 90 : t * 180 + 90,
    };
  });
}

export function odontogramPositions(): Record<FdiNumber, ToothPosition> {
  const { cy } = ODONTOGRAM_VIEWBOX;
  const upper = placeArch(UPPER, cy - 28, -1, 150, 92, 1.2);
  const lower = placeArch(LOWER, cy + 28, 1, 150, 92, 1.2);
  const map = {} as Record<FdiNumber, ToothPosition>;
  for (const position of [...upper, ...lower]) {
    map[position.fdi] = position;
  }
  for (const fdi of FDI_NUMBERS) {
    if (!map[fdi]) throw new Error(`Missing layout for ${fdi}`);
  }
  return map;
}
