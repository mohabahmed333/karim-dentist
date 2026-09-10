"use client";

import { useState } from "react";
import { Link2, MessageSquarePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type InteractiveDraft =
  | { mode: "buttons"; labels: string[] }
  | { mode: "cta"; label: string; url: string };

type Props = {
  value: InteractiveDraft | null;
  onChange: (value: InteractiveDraft | null) => void;
};

export function InteractiveBuilder({ value, onChange }: Props) {
  const [tab, setTab] = useState<"buttons" | "cta">(
    value?.mode === "cta" ? "cta" : "buttons",
  );

  if (!value) {
    return (
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          data-showreel-action="whatsapp-quick-replies"
          className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] px-2 py-1 text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
          onClick={() =>
            onChange({ mode: "buttons", labels: ["Yes", "No"] })
          }
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Quick reply buttons
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] px-2 py-1 text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
          onClick={() =>
            onChange({
              mode: "cta",
              label: "Book online",
              url: "https://",
            })
          }
        >
          <Link2 className="h-3.5 w-3.5" />
          URL CTA
        </button>
      </div>
    );
  }

  return (
    <div
      className="mb-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3"
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
            label="Quick replies"
          />
          <Tab
            active={tab === "cta"}
            onClick={() => {
              setTab("cta");
              onChange({ mode: "cta", label: "Book online", url: "https://" });
            }}
            label="URL CTA"
          />
        </div>
        <button
          type="button"
          aria-label="Remove interactive"
          className="rounded p-1 text-[#6B7280] hover:bg-white"
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
                onChange({ mode: "buttons", labels });
              }}
              placeholder={`Button ${i + 1}`}
            />
          ))}
          {value.labels.length < 3 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onChange({
                  mode: "buttons",
                  labels: [...value.labels, ""],
                })
              }
            >
              Add button
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
            placeholder="Button label"
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
          ? "rounded bg-white px-2 py-0.5 text-xs font-medium text-[#111827] shadow-sm"
          : "rounded px-2 py-0.5 text-xs text-[#6B7280]"
      }
    >
      {label}
    </button>
  );
}
