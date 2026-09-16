"use client";

import type { ReactNode } from "react";
import type { AdminNavItem } from "@/features/admin/lib/adminNav";
import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";
import { useTranslations } from "@/lib/i18n";
import { AdminNavLink } from "./AdminNavLink";

type TreeRowProps = {
  isLast: boolean;
  depth: number;
  children: ReactNode;
};

/** One level of indentation, in px. */
export const NAV_INDENT = 16;
/** How far back from a level's content edge its trunk is drawn. Picked so that
 *  a level's trunk lands exactly on the node dot of the row it hangs from:
 *  NAV_TRUNK_BACK + DOT_OUT === NAV_INDENT. Change one, change the other. */
export const NAV_TRUNK_BACK = 10;
/** Where a row's node dot sits, out from its level's content edge. */
const DOT_OUT = NAV_INDENT - NAV_TRUNK_BACK;
/** Vertical midpoint of a row (py-1 + 13px/1.5 text) — where a branch meets it. */
export const NAV_ROW_MIDPOINT = 14;
/** Radius of the quarter-turn a branch makes off the trunk. */
const ELBOW_RADIUS = 6;
/** The `space-y-0.5` between rows, which the trunk has to carry across. */
const ROW_GAP = 2;
/** Node dot: 4px, sitting in the gutter just before the row's own box. */
const DOT_SIZE = 4;

const LINE_COLOR = "border-[var(--admin-border)]";

/**
 * A row in the nav tree, drawn with the same hairline the rail's flyouts use:
 * an unbroken trunk down the level, a rounded quarter-turn into each row, and a
 * node dot that picks up the accent with the row it marks. The last row of a
 * level stops at its own turn, closing the group.
 */
function TreeRow({ depth, isLast, children }: TreeRowProps) {
  const rail = depth * NAV_INDENT;
  const trunk = rail - NAV_TRUNK_BACK;
  // Centred on DOT_OUT, so it sits in the gutter just before the row's own box
  // and the next level down can hang its trunk straight off it.
  const dot = rail + DOT_OUT - DOT_SIZE / 2;

  return (
    <li
      className="group/row relative list-none"
      style={{ paddingInlineStart: rail + 8 }}
    >
      {depth > 0 ? (
        <>
          {/* Trunk. Carries on across the gap to the next sibling's turn, so a
              level reads as one line; the last row stops where it turns. */}
          <span
            aria-hidden
            className={`absolute top-0 border-s ${LINE_COLOR}`}
            style={{
              insetInlineStart: trunk,
              height: isLast
                ? NAV_ROW_MIDPOINT - ELBOW_RADIUS
                : `calc(100% + ${ROW_GAP}px)`,
            }}
          />
          {/* Elbow: a quarter-turn off the trunk, landing on the dot. */}
          <span
            aria-hidden
            className={`absolute border-s border-b ${LINE_COLOR}`}
            style={{
              insetInlineStart: trunk,
              top: NAV_ROW_MIDPOINT - ELBOW_RADIUS,
              height: ELBOW_RADIUS,
              width: dot - trunk,
              borderEndStartRadius: ELBOW_RADIUS,
            }}
          />
          {/* Node dot — the row's marker, and its hover / current indicator. */}
          <span
            aria-hidden
            className="absolute rounded-full bg-[color-mix(in_srgb,var(--admin-muted)_35%,transparent)] transition-colors group-has-[:hover]/row:bg-[var(--admin-primary)] group-has-[[aria-current]]/row:bg-[var(--admin-primary)]"
            style={{
              insetInlineStart: dot,
              top: NAV_ROW_MIDPOINT - DOT_SIZE / 2,
              width: DOT_SIZE,
              height: DOT_SIZE,
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
  navBadges?: Record<string, number>;
  /** False when more rows of this level follow in a later block, so the last
   *  row here keeps its trunk running instead of closing the group early. */
  closesLevel?: boolean;
};

export function AdminNavTreeList({
  items,
  depth = 0,
  navBadges = {},
  closesLevel = true,
}: Props) {
  const t = useTranslations();
  const starredHrefs = useAdminUiStore((state) => state.starredHrefs);
  const toggleStarred = useAdminUiStore((state) => state.toggleStarred);

  return (
    <ul className="m-0 space-y-0.5 p-0">
      {items.map((item, index) => {
        // Counts are keyed by href rather than special-cased per route, so a
        // new badge is a query in loadAdminChrome and nothing else.
        const badge = navBadges[item.href] ?? item.badge;

        return (
          <TreeRow
            key={item.href}
            isLast={closesLevel && index === items.length - 1}
            depth={depth}
          >
            <AdminNavLink
              href={item.href}
              label={t(item.labelKey)}
              exact={item.exact}
              badge={badge}
              icon={depth === 0 ? item.icon : undefined}
              activeStyle={depth > 0 ? "text" : "pill"}
              starred={starredHrefs.includes(item.href)}
              onToggleStar={() => toggleStarred(item.href)}
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
