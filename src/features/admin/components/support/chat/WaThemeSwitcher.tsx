"use client";

import { useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { useDismissOnOutsidePointer } from "./useDismissOnOutsidePointer";
import type { WaThemePreference } from "./theme/waThemeVars";

type Props = {
  value: WaThemePreference;
  onChange: (id: WaThemePreference) => void;
  /** True while the site-wide admin dark mode forces the chat to dark — the
   *  Light/Classic choice still saves, but has no visible effect until it's off. */
  disabled?: boolean;
};

const THEME_IDS: WaThemePreference[] = ["light", "classic"];

export function WaThemeSwitcher({ value, onChange, disabled = false }: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsidePointer(open, rootRef, () => setOpen(false));

  const labels: Record<WaThemePreference, string> = {
    light: t("admin.frontDesk.chatThemeLight"),
    classic: t("admin.frontDesk.chatThemeClassic"),
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="rounded-md p-1.5 text-[var(--wa-header-icon)] hover:bg-[var(--wa-header-hover)] disabled:opacity-40"
        aria-label={t("admin.frontDesk.chatTheme")}
        aria-expanded={open}
        title={
          disabled
            ? t("admin.frontDesk.chatThemeDarkForced")
            : t("admin.frontDesk.chatTheme")
        }
      >
        <Palette className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute end-0 z-30 mt-1.5 w-44 overflow-hidden rounded-lg border border-[var(--wa-surface-border)] bg-[var(--wa-surface-bg)] py-1 shadow-lg">
          {THEME_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[var(--wa-surface-text)] hover:bg-[var(--wa-surface-hover)]"
            >
              {labels[id]}
              {id === value ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
