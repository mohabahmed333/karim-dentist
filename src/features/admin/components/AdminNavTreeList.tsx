"use client";

import type { ReactNode } from "react";
import type { AdminNavItem } from "@/features/admin/lib/adminNav";
import { useTranslations } from "@/lib/i18n";
import { AdminNavLink } from "./AdminNavLink";

type TreeRowProps = {
  isLast: boolean;
  depth: number;
  children: ReactNode;
};

/** Where the vertical trunk sits within the row's own indent, in px. */
const TRUNK_INSET = 10;
/** Vertical midpoint of a row (py-1 + 13px text) — where the elbow meets the label. */
const ROW_MIDPOINT = "0.875rem";

function TreeRow({ depth, isLast, children }: TreeRowProps) {
  const rail = depth * 16;

  return (
    <li
      className="relative list-none"
      style={{ paddingInlineStart: rail + 8 }}
    >
      {depth > 0 ? (
        <>
          {/* Vertical trunk: full height to reach the next sibling's elbow,
              or half height on the last child so the line stops there
              instead of trailing past the group. */}
          <span
            aria-hidden
            className="absolute top-0 border-s border-[var(--admin-border)]"
            style={{
              insetInlineStart: rail - (16 - TRUNK_INSET),
              height: isLast ? ROW_MIDPOINT : "100%",
            }}
          />
          {/* Elbow: trunk to this row's label. */}
          <span
            aria-hidden
            className="absolute border-t border-[var(--admin-border)]"
            style={{
              insetInlineStart: rail - (16 - TRUNK_INSET),
              top: ROW_MIDPOINT,
              width: 16 - TRUNK_INSET + 6,
            }}
          />
        </>
      ) : null}
      {children}
    </li>
  );
}

type Props = {
  items: AdminNavItem[];
  depth?: number;
  pendingCount?: number;
};

export function AdminNavTreeList({
  items,
  depth = 0,
  pendingCount = 0,
}: Props) {
  const t = useTranslations();

  return (
    <ul className="m-0 space-y-0.5 p-0">
      {items.map((item, index) => {
        const badge =
          item.href === "/admin/reservations" ? pendingCount : item.badge;

        return (
          <TreeRow
            key={item.href}
            isLast={index === items.length - 1}
            depth={depth}
          >
            <AdminNavLink
              href={item.href}
              label={t(item.labelKey)}
              exact={item.exact}
              badge={badge}
            />
          </TreeRow>
        );
      })}
    </ul>
  );
}

export function AdminNavTreeRow({
  isLast,
  depth,
  children,
}: TreeRowProps) {
  return (
    <TreeRow isLast={isLast} depth={depth}>
      {children}
    </TreeRow>
  );
}
