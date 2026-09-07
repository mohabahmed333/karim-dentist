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

function TreeRow({ depth, children }: TreeRowProps) {
  const rail = depth * 16;

  return (
    <li
      className="relative list-none"
      style={{ paddingInlineStart: rail + 8 }}
    >
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
