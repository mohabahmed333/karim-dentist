"use client";

import { useMemo, useState } from "react";
import { buildCanvasEdges } from "./bezierFromNodes";
import { CANVAS_WORLD } from "./initialScene";
import { AddNodeDrawer } from "./AddNodeDrawer";
import { CanvasMiniMap } from "./CanvasMiniMap";
import { CanvasToolbar } from "./CanvasToolbar";
import { DraggableNode } from "./DraggableNode";
import { NodeContextMenu } from "./NodeContextMenu";
import { NodeGraphEdges } from "./NodeGraphEdges";
import { useCanvasViewport } from "./useCanvasViewport";
import { useSceneEditor } from "./useSceneEditor";
import { EditNodeDrawer } from "./EditNodeDrawer";

type Props = {
  conditionTitle?: string;
  onOpenCbct?: () => void;
};

export function NodeGraphCanvas({ conditionTitle = "Endodontic Infection", onOpenCbct }: Props) {
  const editor = useSceneEditor(conditionTitle);
  const viewport = useCanvasViewport();
  const [shapePickerFor, setShapePickerFor] = useState<string | null>(null);
  const paths = useMemo(
    () => buildCanvasEdges(editor.nodes, editor.sizes, editor.selectedId),
    [editor.nodes, editor.sizes, editor.selectedId],
  );

  return (
    <div className="relative hidden h-[min(72vh,680px)] overflow-hidden rounded-[28px] border border-black/5 bg-[#EBEAE5]/70 shadow-inner lg:block">
      <EditNodeDrawer
        open={Boolean(editor.editNodeId)}
        node={editor.editNodeId ? editor.nodes.find((n) => n.id === editor.editNodeId) ?? null : null}
        onClose={editor.closeEditDrawer}
        onSave={(payload) => {
          if (!editor.editNodeId) return;
          editor.saveEditNode(editor.editNodeId, payload);
        }}
      />
      <CanvasToolbar
        scale={viewport.viewport.scale}
        onAddNode={() => editor.openAddDrawer(null)}
        onAutoLayout={editor.autoLayout}
        onReset={editor.resetScene}
      />
      <CanvasMiniMap nodes={editor.nodes} viewport={viewport.viewport} />
      <div
        className="h-full w-full cursor-grab pt-12 active:cursor-grabbing"
        onWheel={viewport.onWheel}
        onPointerDown={viewport.onPanStart}
        onPointerMove={viewport.onPanMove}
        onPointerUp={viewport.onPanEnd}
        onPointerCancel={viewport.onPanEnd}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: CANVAS_WORLD.width,
            height: CANVAS_WORLD.height,
            transform: `translate(${viewport.viewport.x}px, ${viewport.viewport.y}px) scale(${viewport.viewport.scale})`,
          }}
        >
          <NodeGraphEdges width={CANVAS_WORLD.width} height={CANVAS_WORLD.height} paths={paths} />
          {editor.nodes.map((node) => (
            <DraggableNode
              key={node.id}
              node={node}
              scale={viewport.viewport.scale}
              dragging={editor.draggingId === node.id}
              selected={editor.selectedId === node.id}
              hovered={editor.hoveredId === node.id}
              onBegin={editor.beginDrag}
              onDrag={editor.dragNode}
              onEnd={editor.endDrag}
              onSize={editor.registerSize}
              onSelect={editor.setSelectedId}
              onHover={editor.setHoveredId}
              onContextMenu={(nodeId, x, y) => editor.setContextMenu({ nodeId, x, y })}
              onAddChild={(nodeId) => editor.openAddDrawer(nodeId)}
              onOpenCbct={onOpenCbct}
            />
          ))}
        </div>
      </div>
      <AddNodeDrawer
        open={editor.drawer.open || Boolean(shapePickerFor)}
        parentId={shapePickerFor ?? editor.drawer.parentId}
        nodes={editor.nodes}
        onClose={() => {
          editor.closeAddDrawer();
          setShapePickerFor(null);
        }}
        onCreate={(payload) => {
          if (shapePickerFor) {
            editor.swapShape(shapePickerFor, payload.shapeType);
            setShapePickerFor(null);
            editor.closeAddDrawer();
            return;
          }
          editor.createNode(payload);
        }}
      />
      <NodeContextMenu
        menu={editor.contextMenu}
        onClose={() => editor.setContextMenu(null)}
        onAddChild={(nodeId) => editor.openAddDrawer(nodeId)}
        onChangeShape={(nodeId) => setShapePickerFor(nodeId)}
        onEditNodeData={(nodeId) => editor.openEditDrawer(nodeId)}
        onDelete={editor.removeNode}
        onDisconnect={editor.unlinkNode}
      />
    </div>
  );
}
