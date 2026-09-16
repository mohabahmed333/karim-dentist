"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/lib/i18n";
import {
  adminRailItems,
  filterAdminRailItems,
  isRailSubGroup,
  type AdminRailChild,
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
  AdminDropdownMenuSub,
  AdminDropdownMenuSubContent,
  AdminDropdownMenuSubTrigger,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";
import { AdminAccountMenu } from "./AdminAccountMenu";

function anyRailChildMatches(children: AdminRailChild[], pathname: string): boolean {
  return children.some((child) =>
    isRailSubGroup(child)
      ? anyRailChildMatches(child.children, pathname)
      : pathname.startsWith(child.href),
  );
}

/** Each level of flyout casts a flatter shadow than the one it opened from, so
 *  a submenu reads as nested behind its parent rather than floating on top of
 *  it — and a deep stack never piles up into one dark overlapping edge. */
const railPanelShadows = [
  "shadow-[0_4px_18px_rgba(0,0,0,0.12)]",
  "shadow-[0_2px_10px_rgba(0,0,0,0.07)]",
  "shadow-[0_1px_5px_rgba(0,0,0,0.045)]",
];

function railPanelClass(depth: number) {
  return cn(
    "min-w-56",
    railPanelShadows[Math.min(depth, railPanelShadows.length - 1)],
  );
}

/** Each flyout row is a `group` so its connector can react to hover / open
 *  state, and sits a little tighter to the connector than a plain menu row. */
const railMenuItemClass = "group gap-2";

/** A row that opens a submenu drops the stock chevron for {@link RailBranchOut},
 *  so the way out of the row is drawn in the same hairline as the tree. */
const railSubTriggerClass = cn(railMenuItemClass, "[&>svg]:hidden");

/** How far the connector sits from the panel's inner edge: the row's own
 *  horizontal padding (px-3) plus the panel's (p-1.5). A submenu's incoming
 *  branch reaches back across both to touch the panel edge it entered by. */
const RAIL_PANEL_INSET = 18;

/** Panel border + padding above a panel's first row (1px + p-1.5). */
const RAIL_PANEL_HEAD = 7;
/** Half a row (py-2 + 13.5px/1.5 text) minus half the rail's size-7 icon —
 *  how far a flyout must ride up for its first row to sit level with the icon
 *  it opened from, so the branch leaves the icon and arrives at the same height. */
const RAIL_ICON_ALIGN_OFFSET = -(RAIL_PANEL_HEAD + 18 - 14);

/** Left-side connector before a row's label. An unbroken hairline trunk runs
 *  the height of the row so stacked rows read as one tree, a quarter-turn
 *  branches off it into the label, and a node dot marks the row and picks up
 *  the accent with it. The last row's trunk stops at its own turn, closing the
 *  group — the same tree the full sidebar draws, one level in.
 *
 *  `inbound` marks a panel's first row when its parent sits outside the panel —
 *  the rail icon for a flyout, the parent row for a submenu. Instead of starting
 *  a fresh trunk, the branch arrives through the panel edge at that row's
 *  midpoint, level with whatever opened it, runs straight on to the dot, and
 *  drops the trunk from that junction. Rail icon and panels then read as one
 *  tree rather than as separate menus. */
function RailTreeLine({
  last = false,
  inbound = false,
}: {
  last?: boolean;
  inbound?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="relative -my-2 w-4 shrink-0 self-stretch text-[var(--admin-border)]"
    >
      {/* Trunk. Drawn straight through the elbow rather than into it, so the
          curve reads as a branch and the line never breaks between rows. An
          inbound row hangs it off the junction the branch arrives at — and an
          only child, having no siblings to reach, drops no trunk at all. */}
      <span
        className={cn(
          "absolute start-[3px] border-s border-current",
          inbound
            ? last
              ? "hidden"
              : "top-1/2 bottom-0"
            : cn("top-0", last ? "h-[calc(50%-6px)]" : "bottom-0"),
        )}
      />
      {inbound ? (
        /* The branch arriving from outside, straight through to the dot. It
           enters in the accent the icon or parent row is lit in — a panel is
           only ever open while that is true — and cools into the tree's own
           hairline by the time it reaches the trunk, so the seam between the
           two panels doesn't break the line. */
        <span
          className="absolute top-1/2 h-px end-[4px] bg-linear-to-r from-[var(--admin-primary)] to-[var(--admin-border)] to-60% rtl:bg-linear-to-l"
          style={{ insetInlineStart: -RAIL_PANEL_INSET }}
        />
      ) : (
        /* Elbow: a quarter-turn off the trunk, landing exactly on the dot. */
        <span className="absolute top-[calc(50%-6px)] h-1.5 start-[3px] end-[4px] rounded-es-[6px] border-s border-b border-current" />
      )}
      {/* Node dot — the row's own marker, and its hover / open indicator. */}
      <span className="absolute end-0 top-1/2 size-1 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--admin-muted)_35%,transparent)] transition-colors group-data-highlighted:bg-[var(--admin-primary)] group-data-popup-open:bg-[var(--admin-primary)]" />
    </span>
  );
}

/** The tree leaving a row toward the submenu it opens: the same hairline,
 *  carried out through the panel's edge so it meets the branch arriving on the
 *  other side. It replaces the stock chevron — the tree itself says the row
 *  opens further — and lights up with the row's dot on hover and while open. */
function RailBranchOut() {
  return (
    <span
      aria-hidden
      className="ms-auto h-px w-8 bg-[color-mix(in_srgb,var(--admin-muted)_35%,transparent)] transition-colors group-data-highlighted:bg-[var(--admin-primary)] group-data-popup-open:bg-[var(--admin-primary)]"
      style={{ marginInlineEnd: -RAIL_PANEL_INSET }}
    />
  );
}

/** Renders one level of flyout content — a leaf becomes a plain menu item,
 *  a sub-group becomes a nested sub-menu, recursing for any further nesting. */
function RailMenuChildren({
  entries,
  side,
  inbound = false,
  depth,
}: {
  entries: AdminRailChild[];
  side: "left" | "right";
  /** Whether the first row continues a branch arriving from outside the panel. */
  inbound?: boolean;
  /** How many panels deep these rows are drawn, counting the flyout as 0. */
  depth: number;
}) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <>
      {entries.map((entry, index) => {
        const last = index === entries.length - 1;
        const arrives = inbound && index === 0;

        return isRailSubGroup(entry) ? (
          <AdminDropdownMenuSub key={entry.id}>
            <AdminDropdownMenuSubTrigger className={railSubTriggerClass}>
              <RailTreeLine last={last} inbound={arrives} />
              <span className="whitespace-nowrap">{t(entry.labelKey)}</span>
              <RailBranchOut />
            </AdminDropdownMenuSubTrigger>
            <AdminDropdownMenuSubContent
              side={side}
              align="start"
              sideOffset={4}
              alignOffset={-RAIL_PANEL_HEAD}
              className={railPanelClass(depth + 1)}
            >
              <RailMenuChildren
                entries={entry.children}
                side={side}
                depth={depth + 1}
                inbound
              />
            </AdminDropdownMenuSubContent>
          </AdminDropdownMenuSub>
        ) : (
          <AdminDropdownMenuItem
            key={entry.href}
            className={railMenuItemClass}
            onClick={() => router.push(entry.href)}
          >
            <RailTreeLine last={last} inbound={arrives} />
            <span className="whitespace-nowrap">{t(entry.labelKey)}</span>
          </AdminDropdownMenuItem>
        );
      })}
    </>
  );
}

function railButtonClass(active: boolean) {
  return cn(
    "group/rail relative flex size-7 items-center justify-center rounded-md transition-colors",
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
        {/* The tree starts at the icon: while the flyout is open a hairline
            leaves the button and meets the branch arriving inside the panel. */}
        <span
          aria-hidden
          className="absolute top-1/2 start-full h-px w-1.5 bg-[var(--admin-primary)] opacity-0 transition-opacity group-data-popup-open/rail:opacity-100"
        />
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent
        side={side}
        align="start"
        alignOffset={RAIL_ICON_ALIGN_OFFSET}
        className={railPanelClass(0)}
      >
        {item.container ? null : (
          <AdminDropdownMenuItem
            className={railMenuItemClass}
            onClick={() => router.push(item.href)}
          >
            <RailTreeLine last={!item.children?.length} inbound />
            <span className="whitespace-nowrap">{label}</span>
          </AdminDropdownMenuItem>
        )}
        <RailMenuChildren
          entries={item.children ?? []}
          side={side}
          depth={0}
          inbound={item.container}
        />
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
      {/* z-45: above the floating notes panel (z-40, fixed, can sit anywhere)
          so rail clicks never get swallowed by it; below dialogs (z-50). */}
      <aside className="sticky top-0 z-45 hidden h-screen w-11 shrink-0 flex-col items-center gap-0.5 self-start border-e border-[var(--admin-border)] bg-[var(--admin-canvas)] py-3 md:flex">
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
              (item.children ? anyRailChildMatches(item.children, pathname) : false);

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
