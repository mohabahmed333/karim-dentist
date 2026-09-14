"use client";

import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

export type NotificationMode = "off" | "dry_run" | "send";

const OPTIONS: { value: NotificationMode; labelKey: AdminMessageKey; hintKey: AdminMessageKey }[] = [
  { value: "off", labelKey: "admin.notifications.off", hintKey: "admin.notifications.offHint" },
  { value: "dry_run", labelKey: "admin.notifications.dryRun", hintKey: "admin.notifications.dryRunHint" },
  { value: "send", labelKey: "admin.notifications.send", hintKey: "admin.notifications.sendHint" },
];

type Props = {
  value: NotificationMode;
  onChange: (mode: NotificationMode) => void;
  /** Send is refused by the server while anything required is missing. */
  sendBlocked: boolean;
};

export function NotificationModeSwitch({ value, onChange, sendBlocked }: Props) {
  const t = useTranslations();
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">{t("admin.notifications.modeLabel")}</p>
      <div
        role="radiogroup"
        aria-label={t("admin.notifications.ariaModeGroup")}
        className="grid grid-cols-3 gap-1 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-canvas,#f7f7f8)] p-1"
      >
        {OPTIONS.map((option) => {
          const selected = option.value === value;
          const disabled = option.value === "send" && sendBlocked && !selected;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              title={disabled ? t("admin.notifications.sendDisabledTitle") : undefined}
              onClick={() => onChange(option.value)}
              className={`h-8 rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? "bg-[var(--admin-panel,#fff)] font-medium text-[var(--admin-text,#1a1a1a)] shadow-sm"
                  : "text-[var(--admin-muted)] hover:text-[var(--admin-text,#1a1a1a)]"
              }`}
            >
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-[var(--admin-muted)]">
        {sendBlocked && value !== "send" ? t("admin.notifications.sendLockedPrefix") : ""}
        {t(current.hintKey)}
      </p>
    </div>
  );
}
