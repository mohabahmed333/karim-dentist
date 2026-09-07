"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n";

export type ChatHeaderAction = {
  id: string;
  label: string;
  onClick: () => void;
};

type Props = {
  actions: ChatHeaderAction[];
};

export function ChatActionsMenu({ actions }: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={t("admin.chat.actions")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-[#70758A] hover:bg-[#F3F4F6] hover:text-[#111111]"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute end-0 z-30 mt-1 min-w-[168px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {actions.map((action) => (
            <li key={action.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 text-start text-[12px] font-medium text-[#111111] hover:bg-[#F3F4F6]"
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
