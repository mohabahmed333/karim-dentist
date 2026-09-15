"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  notificationTotal,
  type AdminNotificationGroup,
} from "@/services/admin_notifications/groups";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  /** Already filtered to what this user holds a permission for. */
  groups: AdminNotificationGroup[];
};

/**
 * What is waiting on the clinic, in the topbar.
 *
 * A toast announces a thing once; this is what is still true afterwards. A
 * dismissed toast, a reloaded tab or a shift change all leave the list, so
 * whoever is at the desk can see at a glance what is outstanding.
 *
 * Grouped rather than itemised: five rows saying what kind of thing is waiting
 * and how many beats fifty rows nobody reads, and each row is a link to the
 * page that can clear it.
 */
export function AdminNotificationBell({ groups }: Props) {
  const t = useTranslations();
  const total = notificationTotal(groups);
  const waiting = total > 0;
  const label = waiting
    ? `${t("admin.bell.title")} (${total})`
    : t("admin.bell.empty");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        title={label}
        className={cn(
          "relative inline-flex shrink-0 rounded-md p-1.5 transition-colors",
          waiting
            ? "text-[var(--admin-primary)] hover:bg-[var(--admin-hover)]"
            : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
        )}
      >
        <Bell className="size-4" aria-hidden />
        {waiting ? (
          <span
            aria-hidden
            className="absolute -end-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--admin-primary)] px-1 text-[10px] font-semibold leading-4 tabular-nums text-white"
          >
            {total > 9 ? "9+" : total}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* DropdownMenuLabel is Base UI's GroupLabel, which reads its context
            from an enclosing Menu.Group and throws without one. The group is
            required even for a single heading — see CollectionTable, which
            wraps its label the same way. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[var(--admin-muted)]">
            {t("admin.bell.title")}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {waiting ? (
          groups.map((group) => (
            <DropdownMenuItem
              key={group.key}
              className="gap-3"
              render={<Link href={group.href} />}
            >
              <span className="min-w-0 flex-1 truncate">
                {t(group.labelKey)}
              </span>
              <span className="shrink-0 rounded-full bg-[var(--admin-hover)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--admin-text)]">
                {group.count}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="px-2 py-3 text-center text-xs text-[var(--admin-muted)]">
            {t("admin.bell.empty")}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
