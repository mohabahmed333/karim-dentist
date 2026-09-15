"use client";

import { useEffect } from "react";
import { useAdminNotesStore } from "@/features/admin/stores/adminNotesStore";
import { listActiveAdminNotes } from "@/services/admin_notes/queries";
import { NotesPanel } from "./NotesPanel";

export function AdminFloatingNotes() {
  const loaded = useAdminNotesStore((state) => state.loaded);
  const setNotes = useAdminNotesStore((state) => state.setNotes);

  useEffect(() => {
    if (loaded) return;
    void listActiveAdminNotes()
      .then(setNotes)
      .catch(() => setNotes([]));
  }, [loaded, setNotes]);

  return <NotesPanel />;
}
