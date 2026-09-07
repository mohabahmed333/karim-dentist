"use client";

import { useEffect } from "react";
import { imageFileFromClipboard } from "@/lib/supabase/clipboardImage";

type Options = {
  enabled: boolean;
  busy?: boolean;
  onImage: (file: File) => void;
};

/** Listens for Cmd/Ctrl+V image pastes while enabled. */
export function usePasteImage({ enabled, busy = false, onImage }: Options) {
  useEffect(() => {
    if (!enabled) return;

    function onPaste(event: ClipboardEvent) {
      if (busy) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      const file = imageFileFromClipboard(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      onImage(file);
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy, enabled, onImage]);
}
