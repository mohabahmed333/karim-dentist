import { SupportChatColumnSkeleton } from "./SupportChatColumnSkeleton";
import { SupportInboxColumnSkeleton } from "./SupportInboxColumnSkeleton";

/** Full Front desk page — inbox + chat (details closed until opened). */
export function SupportPageSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-white font-sans text-[#111827]"
      aria-busy
      aria-label="Loading front desk"
    >
      <SupportInboxColumnSkeleton />
      <SupportChatColumnSkeleton />
    </div>
  );
}
