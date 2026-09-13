"use client";

import {
  useCustomizeActions,
  useCustomizeData,
  useCustomizeStatus,
} from "../context/CustomizeContext";
import type { CustomizeSection, SaveStatus } from "../types";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n";
import { CustomizeHistoryControls } from "./CustomizeHistoryControls";
import { CustomizeSectionNav } from "./CustomizeSectionNav";
import { CustomizeTranslateControls } from "./CustomizeTranslateControls";
import { CustomizeVisibilityMenu } from "./CustomizeVisibilityMenu";
import { useCmsTranslate } from "./CmsTranslateProvider";
import { TourGuidesMenu } from "./TourGuidesMenu";
import {
  useCustomizeEditorHotkeys,
  useShortcutLabels,
} from "./useCustomizeEditorHotkeys";
import { useLeaveGuard } from "./UnsavedChangesGuard";

const STATUS_KEY: Record<SaveStatus, AdminMessageKey> = {
  saved: "admin.saved",
  unsaved: "admin.unsaved",
  saving: "admin.saving",
  error: "admin.error",
};

type Props = {
  active: CustomizeSection;
  itemId: string | null;
  onStartGuide: (id: string) => void;
};

export function CustomizeHeader({ active, itemId, onStartGuide }: Props) {
  const data = useCustomizeData();
  const t = useTranslations();
  const { saveNow, discard, undo, redo, canUndo, canRedo } =
    useCustomizeActions();
  const status = useCustomizeStatus();
  const { requestLeave } = useLeaveGuard();
  const shortcuts = useShortcutLabels();
  const { isTranslating } = useCmsTranslate();
  const busy = status === "saving" || isTranslating;
  const clean = status === "saved";

  useCustomizeEditorHotkeys({
    undo: () => {
      if (canUndo && !busy) undo();
    },
    redo: () => {
      if (canRedo && !busy) redo();
    },
    save: () => {
      if (!clean && !busy) void saveNow();
    },
  });

  return (
    <header className="customize-header shrink-0 border-b border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <div className="flex h-11 items-center gap-3 px-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--admin-primary)] text-[10px] font-semibold text-white">
            I
          </span>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[13px] font-medium leading-tight">
              {data.settings?.brand_name ?? t("admin.brand")}
            </p>
            <p className="truncate text-[10px] text-[var(--admin-muted)]">
              {t("admin.customize.title")}
            </p>
          </div>
        </div>

        <CustomizeSectionNav active={active} itemId={itemId} />
        <CustomizeVisibilityMenu />

        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          <CustomizeTranslateControls activeSection={active} />
          <TourGuidesMenu onStartGuide={onStartGuide} />
          <button
            type="button"
            className="hidden rounded-[6px] px-2 py-1 text-[11px] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] lg:inline"
            onClick={() => requestLeave("/admin")}
          >
            {t("admin.customize.dashboard")}
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-[6px] px-2 py-1 text-[11px] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] lg:inline"
          >
            {t("admin.customize.viewSite")}
          </a>
          <div className="mx-0.5 hidden h-4 w-px bg-[var(--admin-border)] lg:block" />
          <span className="hidden rounded-[4px] bg-[var(--admin-hover)] px-1.5 py-0.5 text-[10px] text-[var(--admin-muted)] md:inline">
            {t(STATUS_KEY[status])}
          </span>
          <CustomizeHistoryControls
            canUndo={canUndo}
            canRedo={canRedo}
            clean={clean}
            busy={busy}
            undoShortcut={shortcuts.undo}
            redoShortcut={shortcuts.redo}
            saveShortcut={shortcuts.save}
            onUndo={undo}
            onRedo={redo}
            onDiscard={discard}
            onSave={() => void saveNow()}
          />
        </div>
      </div>
    </header>
  );
}
