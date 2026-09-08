"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ChatUiSkeleton } from "@/features/admin/components/chat/ChatUiSkeleton";
import type { DockChatTab } from "./AdminChatDockTabs";

const bone = "bg-[#E8EAED]";

function Block({ className }: { className?: string }) {
  return <Skeleton className={`${bone} ${className ?? ""}`} />;
}

function CompactInboxSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-col bg-white"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="shrink-0 border-b border-[#E5E7EB] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <Block className="h-4 w-28" />
          <div className="flex gap-1">
            <Block className="size-7 rounded-md" />
            <Block className="size-7 rounded-md" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Block className="h-7 w-24 rounded-md" />
          <Block className="h-7 w-20 rounded-md" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 border-b border-[#E5E7EB] px-3 py-3"
          >
            <Block className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex justify-between gap-2">
                <Block className="h-3.5 w-28" />
                <Block className="h-3 w-10" />
              </div>
              <Block className="h-3 w-full" />
              <Block className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-height skeleton for dock tab switches. */
export function AdminChatDockPaneSkeleton({ tab }: { tab: DockChatTab }) {
  if (tab === "assist") {
    return (
      <div className="h-full min-h-0 bg-white">
        <ChatUiSkeleton showClose={false} />
      </div>
    );
  }
  return <CompactInboxSkeleton />;
}
