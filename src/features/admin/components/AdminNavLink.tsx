"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
  icon?: LucideIcon;
  className?: string;
  /** "pill" (default) fills the row on active — used for top-level items.
   *  "text" is for nested child rows under a group: still a filled
   *  background, just lighter than the top-level pill so depth reads
   *  through the color, not only the tree-line indentation. */
  activeStyle?: "pill" | "text";
};

export function AdminNavLink({
  href,
  label,
  exact,
  badge,
  icon: Icon,
  className,
  activeStyle = "pill",
}: Props) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      data-showreel-action={
        href === "/admin/support" ? "nav-front-desk" : undefined
      }
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1 text-[13px] transition-colors",
        active
          ? activeStyle === "pill"
            ? "bg-[var(--admin-active)] font-medium text-[var(--admin-primary-contrast)]"
            : "bg-[var(--admin-hover)] font-medium text-[var(--admin-text)]"
          : "text-[var(--admin-text)]/80 hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
        <span className="truncate">{label}</span>
      </span>
      {badge && badge > 0 ? (
        <span
          className="ms-2 flex min-w-5 shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: "var(--admin-primary)" }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
