"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Star, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
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
  /** Whether this page is starred. Omit `onToggleStar` to hide the star
   *  toggle entirely — used for rows that aren't a starrable page, like a
   *  group's own link. */
  starred?: boolean;
  onToggleStar?: () => void;
};

export function AdminNavLink({
  href,
  label,
  exact,
  badge,
  icon: Icon,
  className,
  activeStyle = "pill",
  starred,
  onToggleStar,
}: Props) {
  const pathname = usePathname();
  const t = useTranslations();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className={cn("group/navrow flex min-w-0 items-center gap-0.5", className)}>
      <Link
        href={href}
        // Marks the row for screen readers, and is what the tree's node dot keys
        // its accent off — the link owns the active check, nothing recomputes it.
        aria-current={active ? "page" : undefined}
        data-showreel-action={
          href === "/admin/support" ? "nav-front-desk" : undefined
        }
        className={cn(
          "flex min-w-0 flex-1 items-center justify-between rounded-md px-2 py-1 text-[13px] transition-colors",
          active
            ? activeStyle === "pill"
              ? "bg-[var(--admin-active)] font-medium text-[var(--admin-primary-contrast)]"
              : "bg-[var(--admin-hover)] font-medium text-[var(--admin-text)]"
            : "text-[var(--admin-text)]/80 hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
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
      {onToggleStar ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.75 }}
          whileHover={{ scale: 1.15 }}
          onClick={(event) => {
            // Stop the click from also landing on the sibling Link/row.
            event.preventDefault();
            event.stopPropagation();
            onToggleStar();
          }}
          aria-label={starred ? t("admin.nav.unstarItem") : t("admin.nav.starItem")}
          aria-pressed={starred}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-[var(--admin-hover)] focus-visible:opacity-100 group-hover/navrow:opacity-100",
            starred ? "opacity-100" : "text-[var(--admin-muted)] hover:text-yellow-500",
          )}
        >
          {/* Remounting on toggle (via `key`) re-triggers the pop-and-spin
              instead of relying on value-diffing, so both starring and
              unstarring animate every time, not just the first. */}
          <motion.span
            key={String(starred)}
            initial={{ scale: 0.3, rotate: -180, opacity: 0.4 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
            className="flex"
          >
            <Star
              className={cn("size-3.5", starred && "fill-yellow-500 text-yellow-500")}
              aria-hidden
            />
          </motion.span>
        </motion.button>
      ) : null}
    </div>
  );
}
