/** Shared admin dashboard field + menu styles (Slack-like menus, soft fields). */

export const adminMenuPanelClass =
  "min-w-44 rounded-[10px] border border-[#E8E8E8] bg-white p-1.5 text-[#1D1C1D] shadow-[0_4px_18px_rgba(0,0,0,0.12)] ring-0";

export const adminMenuItemClass =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-normal text-[#1D1C1D] outline-none focus:bg-[#F2F2F2] focus:text-[#1D1C1D] data-highlighted:bg-[#F2F2F2] data-highlighted:text-[#1D1C1D] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75] [&_svg]:text-[#616061]";

export const adminMenuSeparatorClass = "mx-0 my-1.5 bg-[#EBEBEB]";

export const adminMenuLabelClass =
  "px-3 py-1.5 text-xs font-medium text-[#616061]";

export const adminFieldClass =
  "h-9 w-full min-w-0 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 py-1 text-sm text-[var(--admin-text,#1a1a1a)] shadow-none outline-none transition-colors placeholder:text-[var(--admin-muted,#9ca3af)] focus-visible:border-[#d1d5db] focus-visible:ring-2 focus-visible:ring-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-50";

export const adminTextareaClass =
  "flex min-h-24 w-full field-sizing-content rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 py-2 text-sm text-[var(--admin-text,#1a1a1a)] shadow-none outline-none transition-colors placeholder:text-[var(--admin-muted,#9ca3af)] focus-visible:border-[#d1d5db] focus-visible:ring-2 focus-visible:ring-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-50";

export const adminSelectTriggerClass =
  "flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 py-2 text-sm text-[var(--admin-text,#1a1a1a)] whitespace-nowrap shadow-none outline-none transition-colors focus-visible:border-[#d1d5db] focus-visible:ring-2 focus-visible:ring-[#e5e7eb] disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-[var(--admin-muted,#9ca3af)] [&_svg]:size-4 [&_svg]:text-[#616061]";

export const adminSelectContentClass =
  "rounded-[10px] border border-[#E8E8E8] bg-white p-1.5 text-[#1D1C1D] shadow-[0_4px_18px_rgba(0,0,0,0.12)] ring-0";

export const adminSelectItemClass =
  "cursor-pointer gap-2 rounded-md px-3 py-2 text-[13.5px] text-[#1D1C1D] outline-none focus:bg-[#F2F2F2] focus:text-[#1D1C1D] data-highlighted:bg-[#F2F2F2] [&_svg]:size-4 [&_svg]:text-[#616061]";

export const adminFieldButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#ffffff)] px-3 text-sm text-[var(--admin-text,#1a1a1a)] shadow-none outline-none transition-colors hover:bg-[#F2F2F2] focus-visible:border-[#d1d5db] focus-visible:ring-2 focus-visible:ring-[#e5e7eb]";
