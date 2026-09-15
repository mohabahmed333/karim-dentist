"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { toast } from "sonner";
import { GripHorizontal, Minus, Plus, StickyNote, X } from "lucide-react";
import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";
import { useAdminNotesStore } from "@/features/admin/stores/adminNotesStore";
import {
  createAdminNote,
  dismissAdminNote,
  updateAdminNoteContent,
} from "@/services/admin_notes/actions";
import type { AdminNote } from "@/services/admin_notes/types";

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const MIN_HEIGHT = 220;
const MAX_HEIGHT = 640;
const SAVE_DEBOUNCE_MS = 800;

const COLOR_SWATCH: Record<string, string> = {
  yellow: "#f2b73d",
  pink: "#f472b6",
  blue: "#60a5fa",
  green: "#4ade80",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotesPanel() {
  const notes = useAdminNotesStore((state) => state.notes);
  const addNote = useAdminNotesStore((state) => state.addNote);
  const updateNote = useAdminNotesStore((state) => state.updateNote);
  const removeNote = useAdminNotesStore((state) => state.removeNote);

  const position = useAdminUiStore((state) => state.notesPanelPosition);
  const size = useAdminUiStore((state) => state.notesPanelSize);
  const minimized = useAdminUiStore((state) => state.notesPanelMinimized);
  const setPosition = useAdminUiStore((state) => state.setNotesPanelPosition);
  const setSize = useAdminUiStore((state) => state.setNotesPanelSize);
  const setMinimized = useAdminUiStore((state) => state.setNotesPanelMinimized);

  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(
    null,
  );
  const resizeOrigin = useRef<{ mx: number; my: number; w: number; h: number } | null>(
    null,
  );
  const [creating, setCreating] = useState(false);

  if (notes.length === 0) return null;

  function onGripDown(e: PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: position.x, py: position.y };
  }
  function onGripMove(e: PointerEvent) {
    if (!dragOrigin.current) return;
    setPosition({
      x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
    });
  }
  function onGripUp(e: PointerEvent) {
    dragOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function onResizeDown(e: PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.width, h: size.height };
  }
  function onResizeMove(e: PointerEvent) {
    if (!resizeOrigin.current) return;
    setSize({
      width: clamp(
        resizeOrigin.current.w + (e.clientX - resizeOrigin.current.mx),
        MIN_WIDTH,
        MAX_WIDTH,
      ),
      height: clamp(
        resizeOrigin.current.h + (e.clientY - resizeOrigin.current.my),
        MIN_HEIGHT,
        MAX_HEIGHT,
      ),
    });
  }
  function onResizeUp(e: PointerEvent) {
    resizeOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  async function handleAdd() {
    setCreating(true);
    try {
      addNote(await createAdminNote(""));
    } catch {
      toast.error("Could not add note");
    } finally {
      setCreating(false);
    }
  }

  async function handleDismiss(id: string) {
    removeNote(id);
    try {
      await dismissAdminNote(id);
    } catch {
      toast.error("Could not remove note");
    }
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 end-6 z-40 flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 text-[12px] font-medium text-[var(--admin-text)] shadow-lg hover:bg-[var(--admin-hover)]"
      >
        <StickyNote className="size-3.5 text-[var(--admin-muted)]" />
        {notes.length} {notes.length === 1 ? "note" : "notes"}
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 40,
      }}
      className="flex flex-col overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
    >
      <div
        className="flex shrink-0 cursor-grab items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-3 py-2 active:cursor-grabbing"
        onPointerDown={onGripDown}
        onPointerMove={onGripMove}
        onPointerUp={onGripUp}
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="size-3.5 text-[var(--admin-muted)]" />
          <span className="text-[12px] font-semibold text-[var(--admin-text)]">
            Team notes
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleAdd()}
            aria-label="Add note"
            className="flex size-5 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label="Minimize"
            className="flex size-5 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <Minus className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {notes.map((note) => (
          <NoteRow
            key={note.id}
            note={note}
            onChange={(content) => updateNote(note.id, content)}
            onDismiss={() => void handleDismiss(note.id)}
          />
        ))}
      </div>

      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        aria-hidden
        className="absolute bottom-0.5 end-0.5 size-3 cursor-nwse-resize opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 1px, transparent 3px)",
          color: "var(--admin-muted)",
        }}
      />
    </div>
  );
}

function NoteRow({
  note,
  onChange,
  onDismiss,
}: {
  note: AdminNote;
  onChange: (content: string) => void;
  onDismiss: () => void;
}) {
  const [content, setContent] = useState(note.content);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  function schedule(next: string) {
    setContent(next);
    onChange(next);
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

  return (
    <div className="group rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-2">
      <div className="mb-1 flex items-center justify-between">
        <span
          className="size-2 rounded-full"
          style={{ background: COLOR_SWATCH[note.color] ?? COLOR_SWATCH.yellow }}
        />
        <span className="text-[10px] text-[var(--admin-muted)]">
          {timeAgo(note.created_at)}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss note"
          className="flex size-4 items-center justify-center rounded text-[var(--admin-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500"
        >
          <X className="size-3" />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => schedule(e.target.value)}
        onBlur={() => void save(content)}
        rows={3}
        placeholder="Write a note for the team…"
        className="w-full resize-none bg-transparent text-[12px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
      />
    </div>
  );
}
