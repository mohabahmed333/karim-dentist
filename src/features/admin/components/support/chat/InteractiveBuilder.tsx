"use client";

import { useState } from "react";
import { Link2, MessageSquarePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

export type InteractiveDraft =
  | {
      mode: "buttons";
      labels: string[];
      /** Stable ids of buttons inserted from a saved quick reply, by position. */
      ids?: string[];
      /** Set when the draft came from a quick reply rather than being built by hand. */
      fromQuickReply?: boolean;
    }
  | { mode: "cta"; label: string; url: string };

type Props = {
  value: InteractiveDraft | null;
  onChange: (value: InteractiveDraft | null) => void;
};

export function InteractiveBuilder({ value, onChange }: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<"buttons" | "cta">(
    value?.mode === "cta" ? "cta" : "buttons",
  );

  if (!value) {
    return (
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          data-showreel-action="whatsapp-quick-replies"
          className="inline-flex items-center gap-1 rounded-md border border-[var(--wa-surface-border)] px-2 py-1 text-xs text-[var(--wa-surface-muted-text)] hover:bg-[var(--wa-surface-hover)]"
          onClick={() =>
            onChange({ mode: "buttons", labels: ["Yes", "No"] })
          }
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {t("admin.frontDesk.quickReplyButtons")}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-[var(--wa-surface-border)] px-2 py-1 text-xs text-[var(--wa-surface-muted-text)] hover:bg-[var(--wa-surface-hover)]"
          onClick={() =>
            onChange({
              mode: "cta",
              label: "Book online",
              url: "https://",
            })
          }
        >
          <Link2 className="h-3.5 w-3.5" />
          {t("admin.frontDesk.urlCta")}
        </button>
      </div>
    );
  }

  return (
    <div
      className="mb-2 rounded-lg border border-[var(--wa-surface-border)] bg-[var(--wa-surface-hover)] p-3"
      data-showreel-action="whatsapp-quick-replies-open"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <Tab
            active={tab === "buttons"}
            onClick={() => {
              setTab("buttons");
              onChange({ mode: "buttons", labels: ["Yes", "No"] });
            }}
            label={t("admin.frontDesk.quickReplies")}
          />
          <Tab
            active={tab === "cta"}
            onClick={() => {
              setTab("cta");
              onChange({ mode: "cta", label: "Book online", url: "https://" });
            }}
            label={t("admin.frontDesk.urlCta")}
          />
        </div>
        <button
          type="button"
          aria-label={t("admin.frontDesk.removeInteractive")}
          className="rounded p-1 text-[var(--wa-surface-muted-text)] hover:bg-[var(--wa-surface-bg)]"
          onClick={() => onChange(null)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {value.mode === "buttons" ? (
        <div className="space-y-2">
          {value.labels.map((label, i) => (
            <Input
              key={i}
              value={label}
              maxLength={20}
              onChange={(e) => {
                const labels = [...value.labels];
                labels[i] = e.target.value;
                onChange({ ...value, labels });
              }}
              placeholder={t("admin.frontDesk.buttonPlaceholder").replace("{n}", String(i + 1))}
            />
          ))}
          {value.labels.length < 3 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({ ...value, labels: [...value.labels, ""] })
              }
            >
              {t("admin.pages.quickReplies.addButton")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            value={value.label}
            maxLength={20}
            onChange={(e) =>
              onChange({ ...value, label: e.target.value })
            }
            placeholder={t("admin.customize.buttonLabel")}
          />
          <Input
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
            placeholder="https://"
          />
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded bg-[var(--wa-surface-bg)] px-2 py-0.5 text-xs font-medium text-[var(--wa-surface-text)] shadow-sm"
          : "rounded px-2 py-0.5 text-xs text-[var(--wa-surface-muted-text)]"
      }
    >
      {label}
    </button>
  );
}
