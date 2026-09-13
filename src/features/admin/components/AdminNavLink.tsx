"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
  className?: string;
  /** "pill" (default) fills the row on active — used for top-level items.
   *  "text" only colors the label, for nested child rows under a group. */
  activeStyle?: "pill" | "text";
};

export function AdminNavLink({
  href,
  label,
  exact,
  badge,
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
            : "font-medium text-[var(--admin-primary-contrast)] hover:bg-[var(--admin-hover)]"
          : "text-[var(--admin-text)]/80 hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
        className,
      )}
    >
      <span className="truncate">{label}</span>
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
