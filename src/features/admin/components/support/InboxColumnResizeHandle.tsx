"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { INBOX_WIDTH_MAX, INBOX_WIDTH_MIN } from "./inboxColumnWidth";

type Props = {
  width: number;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  dragging?: boolean;
};

export function InboxColumnResizeHandle({
  width,
  onPointerDown,
  dragging,
}: Props) {
  const t = useTranslations();
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuemin={INBOX_WIDTH_MIN}
      aria-valuemax={INBOX_WIDTH_MAX}
      aria-valuenow={width}
      aria-label={t("admin.frontDesk.resizeInbox")}
      onPointerDown={onPointerDown}
      className={cn(
        "group relative z-10 hidden h-full w-1.5 shrink-0 cursor-col-resize touch-none select-none sm:block",
        "bg-transparent hover:bg-[#E5E7EB]",
        dragging && "bg-[#D1D5DB]",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 -left-1 -right-1",
          dragging ? "bg-[#9CA3AF]/25" : "group-hover:bg-[#E5E7EB]/60",
        )}
      />
    </div>
  );
}
