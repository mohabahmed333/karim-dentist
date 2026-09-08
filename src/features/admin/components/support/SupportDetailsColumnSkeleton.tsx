import { Skeleton } from "@/components/ui/skeleton";

const bone = "bg-[#E8EAED]";

function Block({ className }: { className?: string }) {
  return <Skeleton className={`${bone} ${className ?? ""}`} />;
}

function Section() {
  return (
    <div className="border-b border-[#E5E7EB] px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <Block className="h-4 w-24" />
        <Block className="size-4 rounded" />
      </div>
      <div className="space-y-2">
        <Block className="h-3 w-full" />
        <Block className="h-3 w-4/5" />
        <Block className="h-3 w-3/5" />
      </div>
    </div>
  );
}

/** Details column — width matches the resizable panel default. */
export function SupportDetailsColumnSkeleton() {
  return (
    <aside className="flex h-full min-h-0 w-full min-w-[260px] max-w-[480px] shrink-0 flex-col border-s border-[#E5E7EB] bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
        <Block className="h-4 w-28" />
        <Block className="size-8 rounded-md" />
      </header>
      <div className="flex gap-2 border-b border-[#E5E7EB] px-4 py-2">
        <Block className="h-7 w-16 rounded-md" />
        <Block className="h-7 w-14 rounded-md" />
        <Block className="h-7 w-12 rounded-md" />
        <Block className="h-7 w-20 rounded-md" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Section />
        <Section />
        <Section />
        <Section />
      </div>
    </aside>
  );
}
