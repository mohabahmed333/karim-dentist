"use client";

import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";

/** Sidebar collapse preference, backed by the shared admin UI store. */
export function useAdminSidebarCollapse() {
  const collapsed = useAdminUiStore((state) => state.sidebarCollapsed);
  const toggle = useAdminUiStore((state) => state.toggleSidebar);
  const ready = useAdminUiStore((state) => state.hasHydrated);

  return { collapsed, toggle, ready };
}
