import type { CanvasNode, NodeSize } from "./canvas.types";

type Point = { x: number; y: number };

const FALLBACK: NodeSize = { width: 200, height: 88 };

function anchorRight(node: CanvasNode, sizes: Record<string, NodeSize>): Point {
  const size = sizes[node.id] ?? FALLBACK;
  return { x: node.x + size.width, y: node.y + size.height / 2 };
}

function anchorLeft(node: CanvasNode, sizes: Record<string, NodeSize>): Point {
  const size = sizes[node.id] ?? FALLBACK;
  return { x: node.x, y: node.y + size.height / 2 };
}

export function cubicEdgePath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const c1x = from.x + dx / 2;
  const c2x = to.x - dx / 2;
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${c1x.toFixed(1)} ${from.y.toFixed(1)}, ${c2x.toFixed(1)} ${to.y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

export function buildCanvasEdges(
  nodes: CanvasNode[],
  sizes: Record<string, NodeSize>,
  selectedId: string | null = null,
): { id: string; d: string; active: boolean }[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const paths: { id: string; d: string; active: boolean }[] = [];
  for (const node of nodes) {
    if (!node.parentId) continue;
    const parent = byId.get(node.parentId);
    if (!parent) continue;
    const from = anchorRight(parent, sizes);
    const to = anchorLeft(node, sizes);
    const active =
      !selectedId || selectedId === node.parentId || selectedId === node.id;
    paths.push({
      id: `${node.parentId}->${node.id}`,
      d: cubicEdgePath(from, to),
      active,
    });
  }
  return paths;
}
