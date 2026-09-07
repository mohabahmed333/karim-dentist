"use client";

import { Calendar, Pencil, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  x: number;
  y: number;
  scheduleLabel?: string;
  onClose: () => void;
  onEdit: () => void;
  onSchedule: () => void;
  onDelete: () => void;
};

export function TreatmentContextMenu({
  open,
  x,
  y,
  scheduleLabel = "Schedule appointment",
  onClose,
  onEdit,
  onSchedule,
  onDelete,
}: Props) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        onClick={onClose}
      />
      <div
        className="fixed z-50 min-w-[200px] rounded-xl bg-white p-2"
        style={{ left: x, top: y }}
        role="menu"
      >
        <MenuItem
          icon={Pencil}
          label="Edit treatment"
          onClick={() => {
            onEdit();
            onClose();
          }}
        />
        <MenuItem
          icon={Calendar}
          label={scheduleLabel}
          onClick={() => {
            onSchedule();
            onClose();
          }}
        />
        <MenuItem
          icon={Trash2}
          label="Delete"
          onClick={() => {
            onDelete();
            onClose();
          }}
        />
      </div>
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-[#111827] hover:bg-gray-100"
    >
      <Icon className="size-4 text-gray-500" />
      {label}
    </button>
  );
}
