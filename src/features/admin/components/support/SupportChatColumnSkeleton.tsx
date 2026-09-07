import { Skeleton } from "@/components/ui/skeleton";

const bone = "bg-[#E8EAED]";

function Block({ className }: { className?: string }) {
  return <Skeleton className={`${bone} ${className ?? ""}`} />;
}

function Bubble({ agent }: { agent?: boolean }) {
  return (
    <div className={`flex flex-col ${agent ? "items-end" : "items-start"}`}>
      <Block className="mb-1 h-3 w-16" />
      <div
        className={
          agent
            ? "max-w-[75%] rounded-2xl rounded-tr-md border border-[#E5E7EB] bg-white px-3.5 py-2.5"
            : "max-w-[75%] rounded-2xl rounded-tl-md bg-[#F3F4F6] px-3.5 py-2.5"
        }
      >
        <div className="space-y-2">
          <Block className={`h-3 ${agent ? "w-40" : "w-52"}`} />
          <Block className={`h-3 ${agent ? "w-28" : "w-36"}`} />
        </div>
      </div>
    </div>
  );
}

/** Chat column — same shell as SupportChatColumn + WhatsApp composer. */
export function SupportChatColumnSkeleton() {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#F9FAFB]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Block className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-1.5">
            <Block className="h-4 w-32" />
            <Block className="h-3 w-24" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Block className="h-8 w-16 rounded-md" />
          <Block className="size-8 rounded-md" />
          <Block className="size-8 rounded-md" />
          <Block className="size-8 rounded-md" />
          <Block className="ml-2 h-8 w-24 rounded-md" />
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-hidden p-6">
        <Bubble />
        <Bubble agent />
        <Bubble />
        <Bubble agent />
      </div>

      <div className="shrink-0 border-t border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2.5">
        <div className="flex items-end gap-2">
          <Block className="mb-0.5 size-10 shrink-0 rounded-full" />
          <Block className="h-11 min-w-0 flex-1 rounded-[24px]" />
          <Block className="mb-0.5 size-10 shrink-0 rounded-full" />
        </div>
      </div>
    </section>
  );
}
