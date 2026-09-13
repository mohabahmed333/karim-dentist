"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  clean: boolean;
  busy: boolean;
  undoShortcut: string;
  redoShortcut: string;
  saveShortcut: string;
  onUndo: () => void;
  onRedo: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

function ShortcutHint({ label }: { label: string }) {
  return (
    <kbd className="ms-1 hidden rounded-[3px] border border-[var(--admin-border)] bg-[var(--admin-hover)] px-1 py-px text-[9px] font-normal text-[var(--admin-muted)] sm:inline">
      {label}
    </kbd>
  );
}

export function CustomizeHistoryControls({
  canUndo,
  canRedo,
  clean,
  busy,
  undoShortcut,
  redoShortcut,
  saveShortcut,
  onUndo,
  onRedo,
  onDiscard,
  onSave,
}: Props) {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-1.5" data-tour="history">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 rounded-[6px] px-2 text-xs text-[var(--admin-muted)]"
        title={`${t("admin.customize.undo")} (${undoShortcut})`}
        onClick={onUndo}
        disabled={!canUndo || busy}
      >
        {t("admin.customize.undo")}
        <ShortcutHint label={undoShortcut} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 rounded-[6px] px-2 text-xs text-[var(--admin-muted)]"
        title={`${t("admin.customize.redo")} (${redoShortcut})`}
        onClick={onRedo}
        disabled={!canRedo || busy}
      >
        {t("admin.customize.redo")}
        <ShortcutHint label={redoShortcut} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 rounded-[6px] px-2 text-xs text-[var(--admin-muted)]"
        title={t("admin.customize.discardTitle")}
        onClick={onDiscard}
        disabled={clean || busy}
      >
        {t("admin.customize.discard")}
      </Button>
      <Button
        type="button"
        size="sm"
        className="h-7 rounded-[6px] bg-[var(--admin-primary)] px-2.5 text-xs text-white hover:opacity-90"
        title={`${t("admin.customize.save")} (${saveShortcut})`}
        onClick={onSave}
        disabled={clean || busy}
      >
        {t("admin.customize.save")}
        <kbd className="ms-1.5 hidden rounded-[3px] border border-white/25 bg-white/10 px-1 py-px text-[9px] font-normal text-white/80 sm:inline">
          {saveShortcut}
        </kbd>
      </Button>
    </div>
  );
}
