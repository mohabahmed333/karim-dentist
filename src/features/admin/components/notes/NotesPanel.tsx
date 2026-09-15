"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, GripHorizontal, Minus, Plus, Save, StickyNote, X } from "lucide-react";
import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";
import { useAdminNotesStore } from "@/features/admin/stores/adminNotesStore";
import {
  createAdminNote,
  dismissAdminNote,
  updateAdminNoteContent,
} from "@/services/admin_notes/actions";
import { hasMeaningfulContent } from "@/services/admin_notes/schemas";
import { uploadAdminNoteImage } from "@/services/admin_notes/uploadImage";
import type { AdminNote } from "@/services/admin_notes/types";
import { RichTextEditor } from "@/features/admin/components/patients/RichTextEditor";

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const MIN_HEIGHT = 220;
const MAX_HEIGHT = 640;
const SAVE_DEBOUNCE_MS = 800;
const VIEWPORT_MARGIN = 12;

const COLOR_SWATCH: Record<string, string> = {
  yellow: "#f2b73d",
  pink: "#f472b6",
  blue: "#60a5fa",
  green: "#4ade80",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Keeps the panel from being dragged (or left, after a resize/viewport
 * change) somewhere the user can no longer reach to bring it back. */
function clampToViewport(
  pos: { x: number; y: number },
  size: { width: number; height: number },
) {
  if (typeof window === "undefined") return pos;
  const maxX = window.innerWidth - size.width - VIEWPORT_MARGIN;
  const maxY = window.innerHeight - size.height - VIEWPORT_MARGIN;
  return {
    x: clamp(pos.x, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, maxX)),
    y: clamp(pos.y, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, maxY)),
  };
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** A short plain-text preview for the list row — falls back to a photo
 * marker for an image-only note, since stripping tags alone would leave it
 * blank. */
function previewText(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text) return text;
  if (/<img\b/i.test(html)) return "📷 Photo";
  return "New note";
}

export function NotesPanel() {
  const reduced = useReducedMotion();
  const notes = useAdminNotesStore((state) => state.notes);
  const addNote = useAdminNotesStore((state) => state.addNote);
  const updateNote = useAdminNotesStore((state) => state.updateNote);
  const removeNote = useAdminNotesStore((state) => state.removeNote);

  const rawPosition = useAdminUiStore((state) => state.notesPanelPosition);
  const size = useAdminUiStore((state) => state.notesPanelSize);
  const minimized = useAdminUiStore((state) => state.notesPanelMinimized);
  const setPosition = useAdminUiStore((state) => state.setNotesPanelPosition);
  const setSize = useAdminUiStore((state) => state.setNotesPanelSize);
  const setMinimized = useAdminUiStore((state) => state.setNotesPanelMinimized);

  const position = clampToViewport(rawPosition, size);

  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(
    null,
  );
  const resizeOrigin = useRef<{ mx: number; my: number; w: number; h: number } | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const openNote = notes.find((note) => note.id === openId) ?? null;

  // A saved position from a smaller/different screen can end up unreachable —
  // snap it back on mount rather than only when the user next drags it.
  useEffect(() => {
    if (position.x !== rawPosition.x || position.y !== rawPosition.y) {
      setPosition(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  if (notes.length === 0) return null;

  function onGripDown(e: PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: position.x, py: position.y };
  }
  function onGripMove(e: PointerEvent) {
    if (!dragOrigin.current) return;
    setPosition(
      clampToViewport(
        {
          x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
          y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
        },
        size,
      ),
    );
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
      const note = await createAdminNote("");
      addNote(note);
      setOpenId(note.id);
    } catch {
      toast.error("Could not add note");
    } finally {
      setCreating(false);
    }
  }

  async function handleDismiss(id: string) {
    removeNote(id);
    if (openId === id) setOpenId(null);
    try {
      await dismissAdminNote(id);
    } catch {
      toast.error("Could not remove note");
    }
  }

  return (
    <AnimatePresence>
      {minimized ? (
        <motion.button
          key="pill"
          type="button"
          onClick={() => setMinimized(false)}
          initial={reduced ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.14 }}
          className="fixed bottom-6 start-6 z-40 flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 text-[12px] font-medium text-[var(--admin-text)] shadow-lg hover:bg-[var(--admin-hover)]"
        >
          <StickyNote className="size-3.5 text-[var(--admin-muted)]" />
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </motion.button>
      ) : (
        <motion.div
          key="panel"
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16 }}
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
            <div className="flex min-w-0 items-center gap-1.5">
              {openNote ? (
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Back to notes"
                  className="flex items-center gap-1 rounded text-[12px] font-semibold text-[var(--admin-text)] hover:text-[var(--admin-muted)]"
                >
                  <ArrowLeft className="size-3.5" />
                  Notes
                </button>
              ) : (
                <>
                  <GripHorizontal className="size-3.5 text-[var(--admin-muted)]" />
                  <span className="text-[12px] font-semibold text-[var(--admin-text)]">
                    My notes
                  </span>
                  <span className="rounded-full bg-[var(--admin-hover)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--admin-muted)]">
                    {notes.length}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!openNote ? (
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void handleAdd()}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Add note"
                  className="flex size-5 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-panel)] hover:text-[var(--admin-text)]"
                >
                  <Plus className="size-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setMinimized(true)}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Minimize"
                className="flex size-5 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-panel)] hover:text-[var(--admin-text)]"
              >
                <Minus className="size-3.5" />
              </button>
            </div>
          </div>

          <div className={`min-h-0 flex-1 p-2 ${openNote ? "overflow-hidden" : "overflow-y-auto"}`}>
            <AnimatePresence mode="wait" initial={false}>
              {openNote ? (
                <motion.div
                  key={`editor-${openNote.id}`}
                  initial={reduced ? false : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? undefined : { opacity: 0, x: 18 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="h-full"
                >
                  <NoteEditor
                    note={openNote}
                    autoFocus
                    onChange={(content) => updateNote(openNote.id, content)}
                    onDismiss={() => void handleDismiss(openNote.id)}
                    onSaved={() => setOpenId(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={reduced ? false : { opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? undefined : { opacity: 0, x: -18 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="space-y-1.5"
                >
                  <AnimatePresence initial={false}>
                    {notes.map((note) => (
                      <motion.div
                        key={note.id}
                        layout={!reduced}
                        initial={reduced ? false : { opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.14 }}
                      >
                        <NoteListRow
                          note={note}
                          onOpen={() => setOpenId(note.id)}
                          onDismiss={() => void handleDismiss(note.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            aria-hidden
            className="absolute bottom-0 end-0 flex size-5 cursor-nwse-resize items-end justify-end p-1 text-[var(--admin-muted)] opacity-50 hover:opacity-90"
          >
            <div
              className="size-2.5"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 1px, transparent 3px)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NoteListRow({
  note,
  onOpen,
  onDismiss,
}: {
  note: AdminNote;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex w-full cursor-pointer items-start gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-2 text-start transition-shadow hover:shadow-sm"
    >
      <span
        className="mt-1 size-2 shrink-0 rounded-full"
        style={{ background: COLOR_SWATCH[note.color] ?? COLOR_SWATCH.yellow }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-[var(--admin-text)]">
          {previewText(note.content)}
        </span>
        <span className="block text-[10px] text-[var(--admin-muted)]">
          {timeAgo(note.created_at)}
        </span>
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss note"
        className="flex size-4 shrink-0 items-center justify-center rounded text-[var(--admin-muted)] opacity-0 group-hover:opacity-100 hover:text-red-500"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function NoteEditor({
  note,
  autoFocus,
  onChange,
  onDismiss,
  onSaved,
}: {
  note: AdminNote;
  autoFocus: boolean;
  onChange: (content: string) => void;
  onDismiss: () => void;
  onSaved: () => void;
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
    if (!hasMeaningfulContent(next)) return;
    try {
      await updateAdminNoteContent(note.id, next);
    } catch {
      toast.error("Could not save note");
    }
  }

  async function handleSaveClick() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await save(content);
    onSaved();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5 flex shrink-0 items-center justify-end gap-1.5">
        <span className="text-[10px] text-[var(--admin-muted)]">
          {timeAgo(note.created_at)}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss note"
          className="flex size-5 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-red-500"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <RichTextEditor
        value={content}
        onChange={schedule}
        onImageUpload={uploadAdminNoteImage}
        autoFocus={autoFocus}
        placeholder="Write a note…"
        minHeightClass="min-h-16"
        className="min-h-0 flex-1"
        scrollable
      />
      <button
        type="button"
        onClick={() => void handleSaveClick()}
        className="mt-2 flex shrink-0 items-center justify-center gap-1.5 self-end rounded-md bg-[var(--admin-primary)] px-3 py-1.5 text-[11px] font-medium text-white hover:opacity-90"
      >
        <Save className="size-3.5" />
        Save
      </button>
    </div>
  );
}
