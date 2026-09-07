import { INBOX_WIDTH_DEFAULT } from "./inboxColumnWidth";
import { Skeleton } from "@/components/ui/skeleton";

const bone = "bg-[#E8EAED]";

function Block({ className }: { className?: string }) {
  return <Skeleton className={`${bone} ${className ?? ""}`} />;
}

function InboxRow() {
  return (
    <div className="flex w-full gap-3.5 border-b border-[#E5E7EB] px-4 py-3.5">
      <Block className="h-11 w-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Block className="h-4 w-32" />
          <Block className="h-3.5 w-12" />
        </div>
        <Block className="h-3.5 w-full" />
        <Block className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}

/** Inbox list column — same shell as SupportInboxColumn. */
export function SupportInboxColumnSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 shrink-0 flex-col border-r border-[#E5E7EB] bg-white"
      style={{ width: INBOX_WIDTH_DEFAULT }}
    >
      <div className="shrink-0 border-b border-[#E5E7EB] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Block className="h-5 w-28" />
          <Block className="size-8 rounded-md" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Block className="h-7 w-40 rounded-md" />
          <Block className="h-7 w-20 rounded-md" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <InboxRow key={i} />
        ))}
      </div>
    </aside>
  );
}

