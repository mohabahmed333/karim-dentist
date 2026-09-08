import {
  adminMenuItemClass,
  adminMenuPanelClass,
} from "@/features/admin/ui/styles";

/** Filter menus share the same panel/row look as admin dropdowns. */
export const filterMenuPanelClass = adminMenuPanelClass;

export const filterMenuRowClass = adminMenuItemClass;

export const filterMenuChipClass =
  "rounded-lg border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#ffffff)] px-2 py-1.5 text-center text-[11px] font-medium whitespace-nowrap text-[var(--admin-text,#1a1a1a)] hover:bg-[#F2F2F2]";

export const filterMenuChipActiveClass =
  "rounded-lg border border-[var(--admin-primary,#5e6ad2)] bg-[var(--admin-active,#eceef9)] px-2 py-1.5 text-center text-[11px] font-semibold whitespace-nowrap text-[var(--admin-primary,#5e6ad2)]";
