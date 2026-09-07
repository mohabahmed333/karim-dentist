"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  NOTE_CATEGORIES,
  NOTE_STAMPS,
  noteHeaderLabel,
  type ClinicalNote,
  type ClinicalNoteCategory,
  type NoteTarget,
} from "@/services/clinical_notes";
import { createDraftNote } from "./useClinicalNotes";
import { ClinicalNoteModalBody } from "./ClinicalNoteModalBody";

type Props = {
  target: NoteTarget | null;
  onClose: () => void;
  onSave: (note: ClinicalNote) => void;
};

export function ClinicalNoteModal({ target, onClose, onSave }: Props) {
  const open = Boolean(target);
  const [category, setCategory] = useState<ClinicalNoteCategory>("Quick Note");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (target) {
      setCategory("Quick Note");
      setContent("");
    }
  }, [target]);

  function save() {
    if (!target || !content.trim()) return;
    onSave(createDraftNote(target.id, category, content));
  }

  return (
    <AnimatePresence>
      {open && target ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={noteHeaderLabel(target)}
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
          >
            <ClinicalNoteModalBody
              title={noteHeaderLabel(target)}
              category={category}
              content={content}
              categories={NOTE_CATEGORIES}
              stamps={NOTE_STAMPS}
              onCategory={setCategory}
              onContent={setContent}
              onStamp={(stamp) =>
                setContent((prev) => (prev ? `${prev} ${stamp}` : stamp))
              }
              onClose={onClose}
              onSave={save}
              canSave={Boolean(content.trim())}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
