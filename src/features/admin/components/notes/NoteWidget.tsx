"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GripHorizontal, X } from "lucide-react";
import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";
import { useAdminNotesStore } from "@/features/admin/stores/adminNotesStore";
import {
  dismissAdminNote,
  updateAdminNoteContent,
} from "@/services/admin_notes/actions";
import type { AdminNote } from "@/services/admin_notes/types";

type Props = {
  note: AdminNote;
  /** Used only to stagger the default position when this note has never been dragged. */
  index: number;
};

const SAVE_DEBOUNCE_MS = 800;
const WIDTH = 220;

function defaultPosition(index: number) {
  const offset = (index % 6) * 32;
  return { x: 24 + offset, y: 80 + offset };
}

export function NoteWidget({ note, index }: Props) {
  const position =
    useAdminUiStore((state) => state.noteWidgetPositions[note.id]) ??
    defaultPosition(index);
  const setNoteWidgetPosition = useAdminUiStore(
    (state) => state.setNoteWidgetPosition,
  );
  const updateNote = useAdminNotesStore((state) => state.updateNote);
  const removeNote = useAdminNotesStore((state) => state.removeNote);

  const [content, setContent] = useState(note.content);
  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(
    null,
  );
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  function onGripDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: position.x, py: position.y };
  }
  function onGripMove(e: React.PointerEvent) {
    if (!dragOrigin.current) return;
    const dx = e.clientX - dragOrigin.current.mx;
    const dy = e.clientY - dragOrigin.current.my;
    setNoteWidgetPosition(note.id, {
      x: dragOrigin.current.px + dx,
      y: dragOrigin.current.py + dy,
    });
  }
  function onGripUp(e: React.PointerEvent) {
    dragOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function scheduleSave(next: string) {
    setContent(next);
    updateNote(note.id, next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void save(next), SAVE_DEBOUNCE_MS);
  }

  async function save(next: string) {
    if (!next.trim()) return;
    try {
      await updateAdminNoteContent(note.id, next);
    } catch {
      toast.error("Could not save note");
    }
  }

  async function handleDismiss() {
    removeNote(note.id);
    try {
      await dismissAdminNote(note.id);
    } catch {
      toast.error("Could not remove note");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: WIDTH,
        zIndex: 40,
      }}
      className="overflow-hidden rounded-lg border border-black/10 bg-[#fef3c7] shadow-xl"
    >
      <div
        className="flex cursor-grab items-center justify-between px-2 py-1 active:cursor-grabbing"
        onPointerDown={onGripDown}
        onPointerMove={onGripMove}
        onPointerUp={onGripUp}
      >
        <GripHorizontal className="size-3.5 text-black/30" />
        <button
          type="button"
          onClick={() => void handleDismiss()}
          className="flex size-5 items-center justify-center rounded text-black/40 hover:text-black/70"
          aria-label="Dismiss note"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => scheduleSave(e.target.value)}
        onBlur={() => void save(content)}
        rows={4}
        placeholder="Write a note for the team…"
        className="w-full resize-none bg-transparent px-2.5 pb-2.5 text-[13px] text-black/80 outline-none placeholder:text-black/40"
      />
    </div>
  );
}
