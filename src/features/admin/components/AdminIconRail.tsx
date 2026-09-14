"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/lib/i18n";
import {
  adminRailItems,
  filterAdminRailItems,
  type AdminRailItem,
} from "@/features/admin/lib/adminNav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";
import { AdminAccountMenu } from "./AdminAccountMenu";

function railButtonClass(active: boolean) {
  return cn(
    "flex size-7 items-center justify-center rounded-md transition-colors",
    active
      ? "bg-[var(--admin-active)] text-[var(--admin-primary-contrast)]"
      : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
  );
}

/**
 * A rail item with children opens a flyout of its pages instead of navigating
 * straight there. Hover only opens it when the labeled sidebar is collapsed —
 * with the sidebar expanded, the same items are already visible there, so a
 * hover flyout over the rail would just be a redundant, flickery overlay.
 * Clicking still opens it either way.
 */
function RailDropdownItem({
  item,
  active,
  side,
  sidebarCollapsed,
}: {
  item: AdminRailItem;
  active: boolean;
  side: "left" | "right";
  sidebarCollapsed: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const Icon = item.icon;
  const label = t(item.labelKey);

  return (
    <AdminDropdownMenu>
      <AdminDropdownMenuTrigger
        aria-label={label}
        openOnHover={sidebarCollapsed}
        delay={200}
        closeDelay={150}
        className={railButtonClass(active)}
      >
        <Icon className="size-3.5" aria-hidden />
        <span className="sr-only">{label}</span>
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent side={side} align="start" className="min-w-40">
        {item.container ? null : (
          <AdminDropdownMenuItem onClick={() => router.push(item.href)}>
            {label}
          </AdminDropdownMenuItem>
        )}
        {(item.children ?? []).map((child) => (
          <AdminDropdownMenuItem
            key={child.href}
            onClick={() => router.push(child.href)}
          >
            {t(child.labelKey)}
          </AdminDropdownMenuItem>
        ))}
      </AdminDropdownMenuContent>
    </AdminDropdownMenu>
  );
}

type Props = {
  /** Omit to show every item unfiltered (e.g. showreel demos with no session). */
  permissions?: string[] | null;
  /** Whether the labeled sidebar next to the rail is collapsed. Gates hover-to-open on the rail's flyouts. */
  sidebarCollapsed?: boolean;
};

export function AdminIconRail({ permissions, sidebarCollapsed = true }: Props = {}) {
  const pathname = usePathname();
  const t = useTranslations();
  const { locale } = useLocale();
  const tipSide = locale === "ar" ? "left" : "right";
  const permissionSet = permissions ? new Set(permissions) : null;
  const items = filterAdminRailItems(adminRailItems, permissionSet);

  return (
    <TooltipProvider>
      <aside className="sticky top-0 hidden h-screen w-11 shrink-0 flex-col items-center gap-0.5 self-start border-e border-[var(--admin-border)] bg-[var(--admin-canvas)] py-3 md:flex">
        <div
          className="mb-2 flex size-6 items-center justify-center rounded-[5px] text-[9px] font-bold tracking-tight text-white"
          style={{ background: "var(--admin-primary)" }}
          title={t("admin.brand")}
        >
          DL
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) ||
              (item.children?.some((child) => pathname.startsWith(child.href)) ??
                false);

          if (item.children?.length) {
            return (
              <RailDropdownItem
                key={item.id}
                item={item}
                active={active}
                side={tipSide}
                sidebarCollapsed={sidebarCollapsed}
              />
            );
          }

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger
                delay={200}
                closeDelay={0}
                render={
                  <Link
                    href={item.href}
                    aria-label={label}
                    className={railButtonClass(active)}
                  />
                }
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="sr-only">{label}</span>
              </TooltipTrigger>
              <TooltipContent side={tipSide} sideOffset={10}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="mt-auto">
          <AdminAccountMenu compact />
        </div>
      </aside>
    </TooltipProvider>
  );
}
