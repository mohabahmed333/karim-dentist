"use client";

import { create } from "zustand";
import type { AdminNote } from "@/services/admin_notes/types";

type AdminNotesState = {
  /** Not persisted — the database is the source of truth for note content;
   *  this just lets sibling components (the +New menu and the floating
   *  widgets) share the fetched list without prop-drilling. */
  notes: AdminNote[];
  loaded: boolean;
  setNotes: (notes: AdminNote[]) => void;
  addNote: (note: AdminNote) => void;
  updateNote: (id: string, content: string) => void;
  removeNote: (id: string) => void;
};

export const useAdminNotesStore = create<AdminNotesState>()((set) => ({
  notes: [],
  loaded: false,
  setNotes: (notes) => set({ notes, loaded: true }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (id, content) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, content } : note,
      ),
    })),
  removeNote: (id) =>
    set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),
}));
