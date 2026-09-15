"use client";

import { useEffect } from "react";
import { useAdminNotesStore } from "@/features/admin/stores/adminNotesStore";
import { listActiveAdminNotes } from "@/services/admin_notes/queries";
import { NoteWidget } from "./NoteWidget";

export function AdminFloatingNotes() {
  const notes = useAdminNotesStore((state) => state.notes);
  const loaded = useAdminNotesStore((state) => state.loaded);
  const setNotes = useAdminNotesStore((state) => state.setNotes);

  useEffect(() => {
    if (loaded) return;
    void listActiveAdminNotes()
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [loaded, setNotes]);

  return (
    <>
      {notes.map((note, index) => (
        <NoteWidget key={note.id} note={note} index={index} />
      ))}
    </>
  );
}
