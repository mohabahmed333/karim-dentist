"use client";

import type { ReactNode } from "react";
import type { AdminMessageKey } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type PatientProfileTab =
  | "information"
  | "history"
  | "next"
  | "medical";

const tabs: { id: PatientProfileTab; labelKey: AdminMessageKey }[] = [
  { id: "information", labelKey: "admin.patientTabs.information" },
  { id: "history", labelKey: "admin.patientTabs.history" },
  { id: "next", labelKey: "admin.patientTabs.next" },
  { id: "medical", labelKey: "admin.patientTabs.medical" },
];

type Props = {
  active: PatientProfileTab;
  onChange: (tab: PatientProfileTab) => void;
  /**
   * Sits on the tab row's baseline. Kept inside the bar so the rule underneath
   * still runs the full width — putting it beside the bar cropped the rule to
   * the width of the tabs.
   */
  actions?: ReactNode;
};

export function PatientProfileTabs({ active, onChange, actions }: Props) {
  const t = useTranslations();
  return (
    <div className="flex items-end gap-4 border-b border-[var(--admin-border)]">
      <nav
        className="-mb-px flex min-w-0 flex-1 gap-8 overflow-x-auto"
        aria-label={t("admin.patientTabs.legend")}
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 pb-3 text-[15px] font-medium transition-colors",
                selected
                  ? "border-[var(--admin-primary)] text-[var(--admin-primary)]"
                  : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
              )}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </nav>
      {actions ? <div className="shrink-0 pb-2">{actions}</div> : null}
    </div>
  );
}
