"use client";

import { Pencil, Plus, Trash2, Unlink, Wand2 } from "lucide-react";
import type { ContextMenuState } from "./canvas.types";

type Props = {
  menu: ContextMenuState;
  onClose: () => void;
  onAddChild: (nodeId: string) => void;
  onChangeShape: (nodeId: string) => void;
  onEditNodeData: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onDisconnect: (nodeId: string) => void;
};

export function NodeContextMenu({
  menu,
  onClose,
  onAddChild,
  onChangeShape,
  onEditNodeData,
  onDelete,
  onDisconnect,
}: Props) {
  if (!menu) return null;

  const items = [
    { label: "Add Child Node", icon: Plus, action: () => onAddChild(menu.nodeId) },
    { label: "Change Shape Variant", icon: Wand2, action: () => onChangeShape(menu.nodeId) },
    { label: "Edit Node Data", icon: Pencil, action: () => onEditNodeData(menu.nodeId) },
    { label: "Disconnect Link", icon: Unlink, action: () => onDisconnect(menu.nodeId) },
    { label: "Delete Node", icon: Trash2, action: () => onDelete(menu.nodeId), danger: true },
  ];

  return (
    <>
      <button type="button" className="fixed inset-0 z-[60]" aria-label="Close menu" onClick={onClose} />
      <div
        className="fixed z-[70] min-w-[180px] overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-xl"
        style={{ left: menu.x, top: menu.y }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#EBEAE5] ${
              item.danger ? "text-red-600" : "text-[#111111]"
            }`}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
