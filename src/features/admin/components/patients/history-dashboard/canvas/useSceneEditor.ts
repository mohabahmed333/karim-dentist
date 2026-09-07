"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createInitialScene } from "./initialScene";
import {
  addChildNode,
  autoLayoutTree,
  changeNodeShape,
  deleteNode,
  disconnectLink,
  updateNodeContent,
} from "./nodeGraphEngine";
import type {
  AddNodeDrawerState,
  AddNodePayload,
  CanvasNode,
  ContextMenuState,
  NodeSize,
} from "./canvas.types";

export function useSceneEditor(conditionTitle: string) {
  const defaults = useMemo(() => createInitialScene(conditionTitle), [conditionTitle]);
  const [nodes, setNodes] = useState(defaults);
  const [sizes, setSizes] = useState<Record<string, NodeSize>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>("node-root");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [drawer, setDrawer] = useState<AddNodeDrawerState>({ open: false, parentId: null });
  const [editNodeId, setEditNodeId] = useState<string | null>(null);
  const dragOrigin = useRef<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    setNodes(defaults.map((node) => ({ ...node })));
  }, [defaults]);

  const registerSize = useCallback((id: string, size: NodeSize) => {
    setSizes((prev) => {
      const current = prev[id];
      if (current?.width === size.width && current.height === size.height) return prev;
      return { ...prev, [id]: size };
    });
  }, []);

  const beginDrag = useCallback(
    (id: string) => {
      const node = nodes.find((item) => item.id === id);
      if (!node) return;
      dragOrigin.current = { id, x: node.x, y: node.y };
      setDraggingId(id);
      setSelectedId(id);
      setContextMenu(null);
    },
    [nodes],
  );

  const dragNode = useCallback((id: string, offsetX: number, offsetY: number) => {
    const origin = dragOrigin.current;
    if (!origin || origin.id !== id) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, x: origin.x + offsetX, y: origin.y + offsetY } : node,
      ),
    );
  }, []);

  const endDrag = useCallback(() => {
    dragOrigin.current = null;
    setDraggingId(null);
  }, []);

  const resetScene = useCallback(() => {
    setNodes(defaults.map((node) => ({ ...node })));
    setDraggingId(null);
    dragOrigin.current = null;
    setContextMenu(null);
  }, [defaults]);

  const autoLayout = useCallback(() => {
    setNodes((prev) => autoLayoutTree(prev));
    setContextMenu(null);
  }, []);

  const openAddDrawer = useCallback((parentId: string | null = null) => {
    setDrawer({ open: true, parentId });
    setContextMenu(null);
  }, []);

  const closeAddDrawer = useCallback(() => {
    setDrawer({ open: false, parentId: null });
  }, []);

  const openEditDrawer = useCallback((nodeId: string) => {
    setEditNodeId(nodeId);
    setContextMenu(null);
    setDrawer({ open: false, parentId: null });
  }, []);

  const closeEditDrawer = useCallback(() => {
    setEditNodeId(null);
  }, []);

  const createNode = useCallback((payload: AddNodePayload) => {
    setNodes((prev) => addChildNode(prev, payload));
    closeAddDrawer();
  }, [closeAddDrawer]);

  const removeNode = useCallback((nodeId: string) => {
    if (nodeId === "node-root") return;
    setNodes((prev) => deleteNode(prev, nodeId));
    setSelectedId("node-root");
    setContextMenu(null);
  }, []);

  const unlinkNode = useCallback((nodeId: string) => {
    setNodes((prev) => disconnectLink(prev, nodeId));
    setContextMenu(null);
  }, []);

  const swapShape = useCallback((nodeId: string, shapeType: string) => {
    setNodes((prev) => changeNodeShape(prev, nodeId, shapeType));
    setContextMenu(null);
  }, []);

  const saveEditNode = useCallback((nodeId: string, payload: { title: string; data: CanvasNode["data"] }) => {
    setNodes((prev) =>
      updateNodeContent(prev, nodeId, {
        title: payload.title,
        data: payload.data,
      }),
    );
    setEditNodeId(null);
    setContextMenu(null);
  }, []);

  return {
    nodes,
    sizes,
    draggingId,
    selectedId,
    hoveredId,
    contextMenu,
    drawer,
    editNodeId,
    setSelectedId,
    setHoveredId,
    setContextMenu,
    registerSize,
    beginDrag,
    dragNode,
    endDrag,
    resetScene,
    autoLayout,
    openAddDrawer,
    closeAddDrawer,
    createNode,
    removeNode,
    unlinkNode,
    swapShape,
    openEditDrawer,
    closeEditDrawer,
    saveEditNode,
  };
}
