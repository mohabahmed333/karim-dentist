import type { AddNodePayload, CanvasNode } from "./canvas.types";
import { defaultDataForShape } from "./shapeRegistry";

const CHILD_OFFSET_X = 320;
const CHILD_OFFSET_Y = 150;

let nodeCounter = 0;

export function nextNodeId(): string {
  nodeCounter += 1;
  return `node-${Date.now()}-${nodeCounter}`;
}

export function autoPositionChild(parent: CanvasNode, nodes: CanvasNode[]): { x: number; y: number } {
  const siblings = nodes.filter((node) => node.parentId === parent.id);
  const baseY = parent.y + siblings.length * CHILD_OFFSET_Y;
  return { x: parent.x + CHILD_OFFSET_X, y: baseY };
}

export function addChildNode(nodes: CanvasNode[], payload: AddNodePayload): CanvasNode[] {
  const parent = payload.parentId ? nodes.find((node) => node.id === payload.parentId) : null;
  const id = nextNodeId();
  const position = parent
    ? autoPositionChild(parent, nodes)
    : { x: 80 + nodes.length * 40, y: 80 + nodes.length * 30 };

  const child: CanvasNode = {
    id,
    x: position.x,
    y: position.y,
    shapeType: payload.shapeType,
    title: payload.title,
    parentId: payload.parentId,
    childrenIds: [],
    data: payload.data ?? defaultDataForShape(payload.shapeType),
  };

  if (!parent) return [...nodes, child];

  return nodes
    .map((node) =>
      node.id === parent.id ? { ...node, childrenIds: [...node.childrenIds, id] } : node,
    )
    .concat(child);
}

export function disconnectLink(nodes: CanvasNode[], childId: string): CanvasNode[] {
  const child = nodes.find((node) => node.id === childId);
  if (!child?.parentId) return nodes;
  const parentId = child.parentId;
  return nodes.map((node) => {
    if (node.id === childId) return { ...node, parentId: null };
    if (node.id === parentId) {
      return { ...node, childrenIds: node.childrenIds.filter((id) => id !== childId) };
    }
    return node;
  });
}

export function deleteNode(nodes: CanvasNode[], targetId: string): CanvasNode[] {
  const target = nodes.find((node) => node.id === targetId);
  if (!target) return nodes;
  const removeIds = new Set<string>();
  const walk = (id: string) => {
    removeIds.add(id);
    nodes.filter((node) => node.parentId === id).forEach((child) => walk(child.id));
  };
  walk(targetId);
  return nodes
    .filter((node) => !removeIds.has(node.id))
    .map((node) => ({
      ...node,
      childrenIds: node.childrenIds.filter((id) => !removeIds.has(id)),
      parentId: node.parentId && removeIds.has(node.parentId) ? null : node.parentId,
    }));
}

export function changeNodeShape(
  nodes: CanvasNode[],
  nodeId: string,
  shapeType: string,
  data?: CanvasNode["data"],
): CanvasNode[] {
  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          shapeType,
          data: data ?? defaultDataForShape(shapeType) ?? node.data,
        }
      : node,
  );
}

export function updateNodeContent(
  nodes: CanvasNode[],
  nodeId: string,
  payload: { title?: string; data?: CanvasNode["data"]; shapeType?: string },
): CanvasNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId) return node;
    return {
      ...node,
      ...(payload.title ? { title: payload.title } : null),
      ...(payload.shapeType ? { shapeType: payload.shapeType } : null),
      data:
        payload.data === undefined
          ? node.data
          : payload.data ?? defaultDataForShape(payload.shapeType ?? node.shapeType) ?? node.data,
    };
  });
}

export function autoLayoutTree(nodes: CanvasNode[], rootId = "node-root"): CanvasNode[] {
  const byId = new Map(nodes.map((node) => [node.id, { ...node }]));
  const root = byId.get(rootId) ?? [...byId.values()].find((node) => node.parentId === null);
  if (!root) return nodes;

  const tiers: string[][] = [[root.id]];
  const visited = new Set([root.id]);
  for (;;) {
    const current = tiers[tiers.length - 1];
    const nextTier: string[] = [];
    for (const id of current) {
      const node = byId.get(id);
      if (!node) continue;
      for (const childId of node.childrenIds) {
        if (visited.has(childId)) continue;
        visited.add(childId);
        nextTier.push(childId);
      }
    }
    if (nextTier.length === 0) break;
    tiers.push(nextTier);
  }

  root.x = 50;
  root.y = 220;
  tiers.forEach((tier, columnIndex) => {
    tier.forEach((id, rowIndex) => {
      const node = byId.get(id);
      if (!node) return;
      if (columnIndex === 0) {
        node.x = 50;
        node.y = 220;
        return;
      }
      node.x = 50 + columnIndex * 350;
      node.y = 80 + rowIndex * 160;
    });
  });

  return nodes.map((node) => byId.get(node.id) ?? node);
}
