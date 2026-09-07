"use client";

import { useEffect, useState } from "react";

function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

/** Shortcut labels for Customize Undo / Redo / Save. */
export function useShortcutLabels() {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    setApple(isApplePlatform());
  }, []);
  const mod = apple ? "⌘" : "Ctrl";
  const alt = apple ? "⌥" : "Alt";
  return {
    undo: `${mod}+Z`,
    redo: `${mod}+${alt}+Z`,
    save: `${mod}+S`,
  };
}

type HotkeyHandlers = {
  undo: () => void;
  redo: () => void;
  save: () => void;
};

/** Ctrl/⌘+Z undo, Ctrl/⌘+Alt/⌥+Z redo, Ctrl/⌘+S save. */
export function useCustomizeEditorHotkeys({
  undo,
  redo,
  save,
}: HotkeyHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        save();
        return;
      }

      if (key !== "z") return;

      if (event.altKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (!event.shiftKey) {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, save]);
}
