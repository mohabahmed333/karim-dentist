import { CHAT_BUBBLE } from "@/features/admin/components/chat/chatSkin";
import { cn } from "@/lib/utils";

/**
 * Merges a caller's skin over the shared chat bubble. Must go through `cn`:
 * CHAT_BUBBLE hardcodes `bg-white`/`text-[#111111]`, so plain concatenation
 * leaves both colours on the element and stylesheet order decides — which
 * rendered user bubbles as white text on a white fill (invisible message).
 */
export function showreelBubbleClass(
  isUser?: boolean,
  className?: string,
): string {
  return cn(CHAT_BUBBLE, isUser && "ms-8", className);
}
