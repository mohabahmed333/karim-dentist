type Measured = {
  rects: Record<string, DOMRect>;
  width: number;
  height: number;
};

export type StageMeasure = Measured;

export function measureLegacyAnchors(root: HTMLElement): Measured {
  const origin = root.getBoundingClientRect();
  const rects: Record<string, DOMRect> = {};
  root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((node) => {
    const id = node.dataset.anchor;
    if (!id) return;
    const box = node.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    rects[id] = new DOMRect(
      box.left - origin.left,
      box.top - origin.top,
      box.width,
      box.height,
    );
  });
  return { rects, width: origin.width, height: origin.height };
}

export function stageMeasureEqual(a: Measured, b: Measured): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  const keys = Object.keys(a.rects);
  if (keys.length !== Object.keys(b.rects).length) return false;
  for (const key of keys) {
    const left = a.rects[key];
    const right = b.rects[key];
    if (!left || !right) return false;
    if (
      left.left !== right.left ||
      left.top !== right.top ||
      left.width !== right.width ||
      left.height !== right.height
    ) {
      return false;
    }
  }
  return true;
}
