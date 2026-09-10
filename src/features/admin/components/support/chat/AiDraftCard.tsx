"use client";

import { useState } from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { textDirection } from "./textDirection";
import type { SupportMessage } from "../supportDummyData";
import { cn } from "@/lib/utils";

type Props = {
  message: SupportMessage;
  onResolved?: () => void;
};

/**
 * An AI-written reply awaiting staff approval.
 *
 * Deliberately does not look like a sent bubble: dashed border, an explicit
 * "not sent" label, and no delivery ticks. The whole point of the hybrid design
 * is that a reader can tell at a glance whether the patient has seen this.
 */
export function AiDraftCard({ message, onResolved }: Props) {
  const t = useTranslations();
  const [text, setText] = useState(message.body);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function call(action: "send" | "discard" | "save") {
    setBusy(true);
    try {
      const res =
        action === "discard"
          ? await fetch(`/api/v1/whatsapp/ai/drafts/${message.id}`, {
              method: "DELETE",
            })
          : await fetch(`/api/v1/whatsapp/ai/drafts/${message.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ send: action === "send", text }),
            });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        toast.error(
          payload.code === "SESSION_EXPIRED"
            ? t("admin.frontDesk.aiDraftWindowClosed")
            : payload.error || t("admin.frontDesk.aiDraftFailed"),
        );
        return;
      }
      if (action === "save") setEditing(false);
      else onResolved?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "max-w-[75%] rounded-2xl border border-dashed border-[#A78BFA] bg-[#F5F3FF] p-3",
          "text-[13px] text-[#312E81]",
        )}
      >
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#6D28D9]">
          <Sparkles className="size-3.5" aria-hidden />
          {t("admin.frontDesk.aiDraftLabel")}
        </p>

        {editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            dir={textDirection(text)}
            className="w-full resize-y rounded-lg border border-[#DDD6FE] bg-white p-2 text-[13px] outline-none focus:border-[#A78BFA]"
          />
        ) : (
          <p dir={textDirection(text)} className="whitespace-pre-wrap">
            {text}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => call("send")}
            className="inline-flex items-center gap-1 rounded-full bg-[#6D28D9] px-3 py-1 text-[12px] font-medium text-white disabled:opacity-50"
          >
            <Check className="size-3.5" aria-hidden />
            {t("admin.frontDesk.aiDraftApprove")}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => (editing ? call("save") : setEditing(true))}
            className="inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-white px-3 py-1 text-[12px] text-[#4C1D95] disabled:opacity-50"
          >
            <Pencil className="size-3.5" aria-hidden />
            {editing
              ? t("admin.frontDesk.aiDraftSave")
              : t("admin.frontDesk.aiDraftEdit")}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => call("discard")}
            className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[12px] text-[#6B7280] hover:bg-white disabled:opacity-50"
          >
            <X className="size-3.5" aria-hidden />
            {t("admin.frontDesk.aiDraftDiscard")}
          </button>
        </div>
      </div>
    </div>
  );
}
