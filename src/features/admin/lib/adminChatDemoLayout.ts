import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";

/** Switching to dock always expands so the panel is visible (not the collapsed rail). */
export function nextDockCollapsedOnLayoutToggle(
  nextLayout: AdminChatLayout,
  currentCollapsed: boolean,
): boolean {
  if (nextLayout === "dock") return false;
  return currentCollapsed;
}
