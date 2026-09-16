# Sidebar Tree Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admin sidebar groups nest one level deeper (sub-groups), reorganize the current flat/lightly-grouped nav into that deeper tree, switch the expand state from "one group open at a time" to "any set of groups/sub-groups open at once," and fix the four UX gaps (icons, active-state, sub-group styling, section spacing) that a deeper tree exposes.

**Architecture:** `src/features/admin/lib/adminNav.ts` is the single source of truth (types + data + pure filter/flatten/active-path functions); `AdminNavGroup.items` becomes able to hold either leaf items or further groups, discriminated by the same `isAdminNavGroup` check the file already uses. Three renderer files — `AdminSidebar.tsx` (owns open/closed state as a `Set<string>`), `AdminNavSectionBlock.tsx` (recursive tree renderer), `AdminNavTreeList.tsx`/`AdminNavLink.tsx` (leaf row + active-state styling) — consume that data recursively instead of assuming exactly two levels. The icon rail (`AdminIconRail.tsx`, `adminRailItems`) is untouched, per the spec's non-goal.

**Tech Stack:** Next.js App Router, React (client components), TypeScript, Tailwind, `framer-motion` (existing collapse animation), `node:test`/`node:assert/strict` for the new pure-function tests, Playwright for the manual smoke test.

**Spec:** `docs/superpowers/specs/2026-09-15-sidebar-tree-nav-design.md`

## Global Constraints

- Every existing `href`/`permission` on every existing leaf nav item stays exactly as it is today — this is a regroup, not a route or permission change.
- The icon rail (`adminRailItems`, `AdminIconRail.tsx`) is explicitly out of scope — no structural changes. The one exception: the `admin.nav.messagingGroup` i18n key is shared between the rail's "messaging" entry and the sidebar's group of the same id, so retitling it in Task 1 renames both at once — this is intentional and is how the rail and sidebar stay in sync for this one rename, not a rail code change.
- No arbitrary depth — exactly one more level than exists today (section → group → sub-group → item, at most).
- Keep calling it "group," not "Collection" — avoids colliding with the existing `CollectionTable` component.
- `GITHUB_TOKEN=x` must prefix every `yarn` command in this repo.
- Never regenerate `database.types.ts` — not touched by this plan at all (no schema changes).
- This repo has continuous unrelated concurrent work landing on shared files. Before editing any file in this plan, re-read it fresh rather than trusting line numbers from this document if they no longer match.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/features/admin/lib/adminNav.ts` | Types (`AdminNavItem`, `AdminNavGroup`, recursive), data (`adminNavSections`, `adminRailItems` unchanged), pure functions (`filterAdminNavSections`, `flattenAdminNavItems`, `findActiveAdminNavGroupIds`) |
| `src/features/admin/lib/adminNav.test.ts` (new) | Unit tests for the four recursive pure functions above |
| `src/lib/i18n/messages/admin/en.ts` / `ar.ts` | New/renamed label strings for the new groups |
| `src/features/admin/components/AdminSidebar.tsx` | Owns `openGroupIds: Set<string>` state, computes `activeGroupIds`, resets on route change, passes `isFirst` per section |
| `src/features/admin/components/AdminNavSectionBlock.tsx` | Recursive tree renderer (`AdminNavEntryList` + `NavGroup`), depth-aware icon/styling, section spacing |
| `src/features/admin/components/AdminNavTreeList.tsx` | Leaf-row list, passes `icon` only at depth 0 |
| `src/features/admin/components/AdminNavLink.tsx` | Single leaf-row link, gains `icon` prop, stronger active style at every depth |

---

### Task 1: New i18n keys for the regrouped nav

**Files:**
- Modify: `src/lib/i18n/messages/admin/en.ts:99` (retitle existing key), and insert new keys nearby
- Modify: `src/lib/i18n/messages/admin/en.ts:603` (insert new keys after `admin.settings.doctors`)
- Modify: `src/lib/i18n/messages/admin/ar.ts:101` (retitle existing key), and insert new keys nearby
- Modify: `src/lib/i18n/messages/admin/ar.ts:605` (insert new keys after `admin.settings.doctors`)

**Interfaces:**
- Produces: i18n keys `admin.nav.messagingGroup` (retitled, existing key — used later by Task 5 for the Communications group and already used by the rail's "messaging" entry), `admin.nav.bookingsGroup`, `admin.nav.patientsBillingGroup`, `admin.nav.insightsGroup`, `admin.settings.groupClinic`, `admin.settings.groupCommunications`, `admin.settings.groupBilling`, `admin.settings.groupSite`, `admin.settings.groupStaffAccess` — all consumed by Task 5's `adminNavSections` data.

`adminAr` is typed `Record<AdminMessageKey, string>` and `AdminMessageKey` is `keyof typeof adminEn` — so every key added to `en.ts` must also land in `ar.ts` in the same step, or `yarn build` fails immediately. There's no separate test file for these message files; the type system is the enforcement.

- [ ] **Step 1: Add/retitle the English keys**

In `src/lib/i18n/messages/admin/en.ts`, change line 99 from:

```ts
  "admin.nav.messagingGroup": "Messaging",
```

to:

```ts
  "admin.nav.messagingGroup": "Communications",
```

and insert three new keys directly after it (still before `"admin.pages.outbox.title"`):

```ts
  "admin.nav.messagingGroup": "Communications",
  "admin.nav.bookingsGroup": "Bookings",
  "admin.nav.patientsBillingGroup": "Patients & Billing",
  "admin.nav.insightsGroup": "Insights",
```

Then, after `"admin.settings.doctors": "Doctors",` (currently line 603), insert:

```ts
  "admin.settings.doctors": "Doctors",
  "admin.settings.groupClinic": "Clinic",
  "admin.settings.groupCommunications": "Communications",
  "admin.settings.groupBilling": "Billing",
  "admin.settings.groupSite": "Site",
  "admin.settings.groupStaffAccess": "Staff & Access",
```

- [ ] **Step 2: Add/retitle the matching Arabic keys**

In `src/lib/i18n/messages/admin/ar.ts`, change line 101 from:

```ts
  "admin.nav.messagingGroup": "المراسلة",
```

to:

```ts
  "admin.nav.messagingGroup": "التواصل",
  "admin.nav.bookingsGroup": "الحجوزات والمواعيد",
  "admin.nav.patientsBillingGroup": "المرضى والفواتير",
  "admin.nav.insightsGroup": "الإحصاءات",
```

Then, after `"admin.settings.doctors": "الأطباء",` (currently line 605), insert:

```ts
  "admin.settings.doctors": "الأطباء",
  "admin.settings.groupClinic": "العيادة",
  "admin.settings.groupCommunications": "التواصل",
  "admin.settings.groupBilling": "الفواتير",
  "admin.settings.groupSite": "الموقع",
  "admin.settings.groupStaffAccess": "الموظفون والصلاحيات",
```

- [ ] **Step 3: Verify the build catches any mismatch**

Run: `GITHUB_TOKEN=x yarn build`
Expected: succeeds (this step only adds message keys, nothing consumes the new ones yet — this just confirms `en.ts`/`ar.ts` stay in sync and nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "$(cat <<'EOF'
feat(admin): add i18n keys for the regrouped sidebar nav

Retitles the shared "messagingGroup" key from Messaging to
Communications (renames both the sidebar group and the icon rail's
matching flyout, since they share the key) and adds the new group
labels the sidebar tree-nav restructure needs.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Recursive nesting type + recursive permission filtering

**Files:**
- Modify: `src/features/admin/lib/adminNav.ts:18-45` (types), `:422-435` (`filterAdminNavGroup`)
- Test: `src/features/admin/lib/adminNav.test.ts` (new)

**Interfaces:**
- Consumes: nothing new (pure refactor of existing types/functions).
- Produces: `AdminNavGroup.items: AdminNavSectionEntry[]` (was `AdminNavItem[]`) — a group's children can now be plain items or further groups. `AdminNavItem.icon?: LucideIcon` and `AdminNavGroup.icon?: LucideIcon` (both optional, new). `filterAdminNavGroup` (unexported, used internally by `filterAdminNavSections`) now recurses. These are what Task 5's new data and Task 6/7's renderers depend on.

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/lib/adminNav.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterAdminNavSections,
  type AdminNavSection,
} from "./adminNav";

const nestedFixture: AdminNavSection[] = [
  {
    id: "test-section",
    titleKey: "admin.nav.clinic",
    entries: [
      { href: "/admin/a", labelKey: "admin.nav.overview" },
      {
        id: "group-a",
        labelKey: "admin.nav.overview",
        items: [
          { href: "/admin/b", labelKey: "admin.nav.overview", permission: "b.view" },
          {
            id: "group-a-sub",
            labelKey: "admin.nav.overview",
            items: [
              { href: "/admin/c", labelKey: "admin.nav.overview", permission: "c.view" },
            ],
          },
        ],
      },
    ],
  },
];

describe("filterAdminNavSections (recursive)", () => {
  it("keeps every level unchanged when permissions is null (fails open)", () => {
    const result = filterAdminNavSections(nestedFixture, null);
    assert.deepEqual(result, nestedFixture);
  });

  it("collapses only the sub-group whose sole item is unpermitted, keeping the parent group", () => {
    const result = filterAdminNavSections(nestedFixture, new Set(["b.view"]));
    const groupA = result[0]!.entries!.find(
      (e) => "id" in e && e.id === "group-a",
    );
    assert.ok(groupA && "items" in groupA);
    assert.deepEqual(
      (groupA as { items: unknown[] }).items.map((i) => (i as { href: string }).href),
      ["/admin/b"],
    );
  });

  it("collapses a group two levels deep when nothing inside it is permitted", () => {
    const result = filterAdminNavSections(nestedFixture, new Set());
    const ids = result[0]!.entries!.map((e) => ("href" in e ? e.href : e.id));
    assert.deepEqual(ids, ["/admin/a"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "adminNav"`
Expected: FAIL — either a TypeScript error (nested `AdminNavGroup` inside `items` doesn't match today's `AdminNavItem[]` type) or, if it happens to typecheck loosely, the second/third assertions fail because today's `filterAdminNavGroup` only filters one level and doesn't recurse into a nested group.

- [ ] **Step 3: Widen the types**

In `src/features/admin/lib/adminNav.ts`, replace lines 18-36:

```ts
export type AdminNavItem = {
  href: string;
  labelKey: AdminMessageKey;
  exact?: boolean;
  badge?: number;
  /** Permission key required to see/use this item. Omit to always show it. */
  permission?: string;
};

export type AdminNavGroup = {
  id: string;
  labelKey: AdminMessageKey;
  /** When set, the group's own label is also a link (e.g. Reservations), not just a toggle. */
  href?: string;
  /** Permission key required to see/use the group's own link, if it has one. */
  permission?: string;
  items: AdminNavItem[];
  defaultOpen?: boolean;
};
```

with:

```ts
export type AdminNavItem = {
  href: string;
  labelKey: AdminMessageKey;
  exact?: boolean;
  badge?: number;
  /** Permission key required to see/use this item. Omit to always show it. */
  permission?: string;
  /** Only rendered at depth 0 (a top-level item/group directly under a section). */
  icon?: LucideIcon;
};

export type AdminNavGroup = {
  id: string;
  labelKey: AdminMessageKey;
  /** When set, the group's own label is also a link (e.g. Reservations), not just a toggle. */
  href?: string;
  /** Permission key required to see/use the group's own link, if it has one. */
  permission?: string;
  /** Only rendered at depth 0. Sub-groups (depth > 0) don't carry one. */
  icon?: LucideIcon;
  /** A child can be a plain item or a further sub-group — one level deeper than today, discriminated the same way `AdminNavSectionEntry` is (`isAdminNavGroup`). */
  items: AdminNavSectionEntry[];
  defaultOpen?: boolean;
};
```

(`AdminNavSectionEntry` is declared a few lines below `AdminNavGroup` already — TypeScript type aliases can forward-reference each other at module scope, so no reordering is needed.)

- [ ] **Step 4: Make `filterAdminNavGroup` recursive**

Replace lines 422-435 (the `filterAdminNavGroup` function):

```ts
function filterAdminNavGroup(
  group: AdminNavGroup,
  permissions: Set<string> | null,
): AdminNavGroup | null {
  const items = group.items.filter((item) =>
    isPermitted(item.permission, permissions),
  );
  // Only a group with its own link is worth showing empty — a pure
  // toggle/container group (no href) with no visible children is just an
  // empty expander, so hide it rather than leave a dead-end in the sidebar.
  const hasOwnLink = Boolean(group.href) && isPermitted(group.permission, permissions);
  if (!hasOwnLink && items.length === 0) return null;
  return { ...group, items };
}
```

with:

```ts
function filterAdminNavGroup(
  group: AdminNavGroup,
  permissions: Set<string> | null,
): AdminNavGroup | null {
  const items: AdminNavSectionEntry[] = [];
  for (const entry of group.items) {
    if (isAdminNavGroup(entry)) {
      const filtered = filterAdminNavGroup(entry, permissions);
      if (filtered) items.push(filtered);
    } else if (isPermitted(entry.permission, permissions)) {
      items.push(entry);
    }
  }
  // Only a group with its own link is worth showing empty — a pure
  // toggle/container group (no href) with no visible children is just an
  // empty expander, so hide it rather than leave a dead-end in the sidebar,
  // at every depth (a sub-group collapses the same way a top-level one does).
  const hasOwnLink = Boolean(group.href) && isPermitted(group.permission, permissions);
  if (!hasOwnLink && items.length === 0) return null;
  return { ...group, items };
}
```

`filterAdminNavSections` (lines 437-469) calls `filterAdminNavGroup` the same way it already does — no changes needed there; the recursion is entirely inside `filterAdminNavGroup` now.

- [ ] **Step 5: Run test to verify it passes**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "adminNav"`
Expected: PASS (all 3 tests)

- [ ] **Step 6: Type-check and lint**

Run: `GITHUB_TOKEN=x yarn build && GITHUB_TOKEN=x yarn lint`
Expected: both succeed (data still uses flat `AdminNavItem[]` today, which is a valid subtype of `AdminNavSectionEntry[]`, so nothing else breaks yet)

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/lib/adminNav.ts src/features/admin/lib/adminNav.test.ts
git commit -m "$(cat <<'EOF'
feat(admin): let nav groups nest one level deeper

AdminNavGroup.items can now hold either plain items or further
groups, and filterAdminNavGroup recurses so a sub-group with nothing
permitted inside it collapses away at any depth, matching today's
top-level-only behavior.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Recursive `flattenAdminNavItems`

**Files:**
- Modify: `src/features/admin/lib/adminNav.ts:471-485`
- Test: `src/features/admin/lib/adminNav.test.ts`

**Interfaces:**
- Consumes: `AdminNavSectionEntry`, `isAdminNavGroup` (from Task 2).
- Produces: `flattenAdminNavItems(sections: AdminNavSection[] = adminNavSections): AdminNavItem[]` — signature widened with an optional parameter (defaults to the real data, so every existing no-arg call site keeps working unchanged) so it can be unit-tested against a fixture instead of only the real production tree.

- [ ] **Step 1: Write the failing test**

Add to `src/features/admin/lib/adminNav.test.ts`:

```ts
import { flattenAdminNavItems } from "./adminNav";

describe("flattenAdminNavItems (recursive)", () => {
  it("reaches an item nested two levels deep, including the sub-group's own link", () => {
    const fixture: AdminNavSection[] = [
      {
        id: "s",
        titleKey: "admin.nav.clinic",
        entries: [
          { href: "/admin/a", labelKey: "admin.nav.overview" },
          {
            id: "g",
            labelKey: "admin.nav.overview",
            items: [
              { href: "/admin/b", labelKey: "admin.nav.overview" },
              {
                id: "g2",
                href: "/admin/g2",
                labelKey: "admin.nav.overview",
                items: [{ href: "/admin/c", labelKey: "admin.nav.overview" }],
              },
            ],
          },
        ],
      },
    ];
    const hrefs = flattenAdminNavItems(fixture).map((item) => item.href);
    assert.deepEqual(hrefs, ["/admin/a", "/admin/b", "/admin/g2", "/admin/c"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "flattenAdminNavItems"`
Expected: FAIL — `flattenAdminNavItems` doesn't currently accept an argument, and even if it did, today's implementation only descends one level into `entry.items` without recursing into nested groups inside it.

- [ ] **Step 3: Implement the recursive version**

Replace lines 471-485:

```ts
export function flattenAdminNavItems(): AdminNavItem[] {
  return adminNavSections.flatMap((section) => {
    if (section.entries) {
      return section.entries.flatMap((entry) =>
        isAdminNavGroup(entry)
          ? [...(entry.href ? [{ href: entry.href, labelKey: entry.labelKey }] : []), ...entry.items]
          : [entry],
      );
    }
    return [
      ...(section.items ?? []),
      ...(section.groups?.flatMap((group) => group.items) ?? []),
    ];
  });
}
```

with:

```ts
function flattenEntry(entry: AdminNavSectionEntry): AdminNavItem[] {
  if (!isAdminNavGroup(entry)) return [entry];
  return [
    ...(entry.href ? [{ href: entry.href, labelKey: entry.labelKey }] : []),
    ...entry.items.flatMap(flattenEntry),
  ];
}

export function flattenAdminNavItems(
  sections: AdminNavSection[] = adminNavSections,
): AdminNavItem[] {
  return sections.flatMap((section) => {
    if (section.entries) {
      return section.entries.flatMap(flattenEntry);
    }
    return [
      ...(section.items ?? []),
      ...(section.groups?.flatMap((group) => flattenEntry(group)) ?? []),
    ];
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "flattenAdminNavItems"`
Expected: PASS

- [ ] **Step 5: Type-check and lint**

Run: `GITHUB_TOKEN=x yarn build && GITHUB_TOKEN=x yarn lint`
Expected: both succeed

- [ ] **Step 6: Commit**

```bash
git add src/features/admin/lib/adminNav.ts src/features/admin/lib/adminNav.test.ts
git commit -m "$(cat <<'EOF'
feat(admin): make flattenAdminNavItems recurse into sub-groups

Also widens it to take an optional sections argument (defaulting to
the real adminNavSections) so it's unit-testable against a fixture.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Set-based expand state (`findActiveAdminNavGroupIds` + `AdminSidebar.tsx`)

**Files:**
- Modify: `src/features/admin/lib/adminNav.ts:491-513` (rename + recurse `findActiveAdminNavGroupId` → `findActiveAdminNavGroupIds`)
- Modify: `src/features/admin/components/AdminSidebar.tsx` (full file, 91 lines — `openGroupId` → `openGroupIds: Set<string>`, `toggleGroup`, `isFirst` prop threading)
- Test: `src/features/admin/lib/adminNav.test.ts`

**Interfaces:**
- Consumes: `AdminNavSectionEntry`, `isAdminNavGroup`, `hrefMatches` (existing private helper, unchanged) from Task 2/3.
- Produces: `findActiveAdminNavGroupIds(sections: AdminNavSection[], pathname: string): Set<string>` (replaces `findActiveAdminNavGroupId`, no caller outside this file and `AdminSidebar.tsx` exists per repo-wide grep, so this is a clean rename). `AdminSidebar` now passes `openGroupIds: Set<string>`, `onToggleGroup: (groupId: string) => void`, and `isFirst: boolean` to `AdminNavSectionBlock` — the exact prop names Task 6 consumes.

- [ ] **Step 1: Write the failing test**

Add to `src/features/admin/lib/adminNav.test.ts`:

```ts
import { findActiveAdminNavGroupIds } from "./adminNav";

describe("findActiveAdminNavGroupIds (recursive, Set-returning)", () => {
  const fixture: AdminNavSection[] = [
    {
      id: "site",
      titleKey: "admin.nav.site",
      entries: [
        {
          id: "settings",
          labelKey: "admin.nav.settings",
          items: [
            {
              id: "settings-clinic",
              labelKey: "admin.settings.groupClinic",
              items: [
                { href: "/admin/settings/clinic-hours", labelKey: "admin.settings.hours" },
              ],
            },
          ],
        },
        {
          id: "inventory",
          href: "/admin/inventory",
          labelKey: "admin.nav.inventory",
          items: [
            { href: "/admin/inventory/reports", labelKey: "admin.nav.inventoryReports" },
          ],
        },
      ],
    },
  ];

  it("adds both the group and the sub-group on the path to a doubly-nested active page", () => {
    const ids = findActiveAdminNavGroupIds(fixture, "/admin/settings/clinic-hours");
    assert.deepEqual([...ids].sort(), ["settings", "settings-clinic"]);
  });

  it("adds a group whose own href matches, even with no active descendant", () => {
    const ids = findActiveAdminNavGroupIds(fixture, "/admin/inventory");
    assert.deepEqual([...ids], ["inventory"]);
  });

  it("returns an empty set when nothing matches", () => {
    const ids = findActiveAdminNavGroupIds(fixture, "/admin/unrelated-page");
    assert.deepEqual([...ids], []);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "findActiveAdminNavGroupIds"`
Expected: FAIL — `findActiveAdminNavGroupIds` doesn't exist yet (only the singular, non-recursive `findActiveAdminNavGroupId` does).

- [ ] **Step 3: Implement the recursive, Set-returning version**

Replace lines 491-513 (from the JSDoc comment through the end of `findActiveAdminNavGroupId`):

```ts
/**
 * Which collapsible group (if any) the current page lives under — the
 * sidebar opens that one and closes every other group, so drilling into
 * Settings doesn't leave Reservations/Messaging sitting open behind it.
 */
export function findActiveAdminNavGroupId(
  sections: AdminNavSection[],
  pathname: string,
): string | null {
  for (const section of sections) {
    const groups =
      section.groups ??
      (section.entries?.filter(isAdminNavGroup) as AdminNavGroup[] | undefined) ??
      [];
    for (const group of groups) {
      if (group.href && hrefMatches(pathname, group.href)) return group.id;
      if (group.items.some((item) => hrefMatches(pathname, item.href))) {
        return group.id;
      }
    }
  }
  return null;
}
```

with:

```ts
function collectActiveGroupIds(
  entries: AdminNavSectionEntry[],
  pathname: string,
  activeIds: Set<string>,
): boolean {
  let anyActive = false;
  for (const entry of entries) {
    if (!isAdminNavGroup(entry)) {
      if (hrefMatches(pathname, entry.href)) anyActive = true;
      continue;
    }
    const ownMatch = Boolean(entry.href) && hrefMatches(pathname, entry.href!);
    const childMatch = collectActiveGroupIds(entry.items, pathname, activeIds);
    if (ownMatch || childMatch) {
      activeIds.add(entry.id);
      anyActive = true;
    }
  }
  return anyActive;
}

/**
 * Every group and sub-group (at any depth) that the current page lives
 * under — the sidebar auto-opens all of them at once (e.g. landing on a
 * settings sub-page opens both "Settings" and its sub-group), unlike the
 * old single-group accordion this replaces.
 */
export function findActiveAdminNavGroupIds(
  sections: AdminNavSection[],
  pathname: string,
): Set<string> {
  const activeIds = new Set<string>();
  for (const section of sections) {
    const entries: AdminNavSectionEntry[] =
      section.entries ?? [...(section.items ?? []), ...(section.groups ?? [])];
    collectActiveGroupIds(entries, pathname, activeIds);
  }
  return activeIds;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "findActiveAdminNavGroupIds"`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Update `AdminSidebar.tsx` to consume the Set and thread `isFirst`**

Re-read `src/features/admin/components/AdminSidebar.tsx` fresh first — it's a shared file. Replace the full 91-line file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";
import {
  adminNavSections,
  filterAdminNavSections,
  findActiveAdminNavGroupIds,
} from "@/features/admin/lib/adminNav";
import { useTranslations } from "@/lib/i18n";
import { AdminNavSectionBlock } from "./AdminNavSectionBlock";

type Props = {
  pendingCount?: number;
  mobile?: boolean;
  /** Omit to show every section unfiltered (e.g. showreel demos with no session). */
  permissions?: string[] | null;
};

export function AdminSidebar({
  pendingCount = 0,
  mobile = false,
  permissions,
}: Props) {
  const t = useTranslations();
  const pathname = usePathname();
  const permissionSet = permissions ? new Set(permissions) : null;
  const sections = filterAdminNavSections(adminNavSections, permissionSet);

  // Every group/sub-group on the path to the current page auto-opens; a
  // manual click can open/close others on top of that until the route
  // changes, when the whole set is recomputed fresh from scratch (not
  // accumulated forever — a group closes again once you navigate away from
  // it and don't reopen it).
  //
  // Adjusted during render rather than in an effect — React's documented
  // pattern for "reset state when a prop changes" — so the old set never
  // has a chance to paint open on the new page.
  const activeGroupIds = useMemo(
    () => findActiveAdminNavGroupIds(sections, pathname),
    [sections, pathname],
  );
  const [openGroupIds, setOpenGroupIds] = useState(activeGroupIds);
  const [renderedForPathname, setRenderedForPathname] = useState(pathname);
  if (pathname !== renderedForPathname) {
    setRenderedForPathname(pathname);
    setOpenGroupIds(activeGroupIds);
  }

  function toggleGroup(groupId: string) {
    setOpenGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-[220px] shrink-0 flex-col overflow-y-auto bg-[var(--admin-canvas)] px-2.5 py-3"
          : "flex h-full w-[220px] shrink-0 flex-col overflow-y-auto bg-[var(--admin-canvas)] px-2.5 py-3"
      }
    >
      <div className="mb-4 px-2">
        <p className="text-[13px] font-semibold tracking-tight text-[var(--admin-text)]">
          {t("admin.brand")}
        </p>
        <p className="text-[11px] text-[var(--admin-muted)]">
          {t("admin.clinicWorkspace")}
        </p>
      </div>
      {sections.map((section, index) => (
        <AdminNavSectionBlock
          key={section.id}
          section={section}
          pendingCount={pendingCount}
          openGroupIds={openGroupIds}
          onToggleGroup={toggleGroup}
          isFirst={index === 0}
        />
      ))}
      <div className="mt-auto space-y-0.5 border-t border-[var(--admin-border)] px-1 pt-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
        >
          <FolderOpen className="size-3.5" aria-hidden />
          {t("admin.viewSite")}
        </Link>
      </div>
    </aside>
  );
}
```

This will not build yet — `AdminNavSectionBlock` still expects the old `openGroupId`/no-`isFirst` props. That's fixed in Task 6, which happens right after this task; there's no separate commit checkpoint between them where the app needs to run.

- [ ] **Step 6: Type-check what's checkable so far**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "adminNav"`
Expected: PASS (the pure-function tests don't touch `AdminSidebar.tsx`, so they're green independent of the component wiring)

`yarn build` is expected to fail at this point (prop mismatch with `AdminNavSectionBlock`, fixed in Task 6) — do not run it as a gate here; Task 6's Step covers the full-build check once both sides match.

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/lib/adminNav.ts src/features/admin/lib/adminNav.test.ts src/features/admin/components/AdminSidebar.tsx
git commit -m "$(cat <<'EOF'
feat(admin): move sidebar expand state to a Set of open group ids

findActiveAdminNavGroupId (singular, one match) becomes
findActiveAdminNavGroupIds (plural, Set) so a doubly-nested active
page opens both its group and sub-group at once. AdminSidebar now
tracks openGroupIds as a Set instead of a single accordion slot, and
passes isFirst per section for the next task's section-divider work.

Note: this leaves AdminNavSectionBlock's props temporarily
mismatched — resolved in the very next task, no intermediate
deployable state expected here.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: New IA data (`adminNavSections` regroup)

**Files:**
- Modify: `src/features/admin/lib/adminNav.ts:196-282` (the `adminNavSections` array)
- Test: `src/features/admin/lib/adminNav.test.ts`

**Interfaces:**
- Consumes: the recursive `AdminNavGroup.items: AdminNavSectionEntry[]` type and `icon?: LucideIcon` field (Task 2), the i18n keys from Task 1, `flattenAdminNavItems`/`isAdminNavGroup` (Task 2/3) for the regression tests below.
- Produces: the actual new tree — this is what Task 6/7's renderers display and what the manual smoke test (Task 8) walks through.

`adminRailItems` (lines 80-194) is **not** touched by this task — the icon rail stays exactly as it is today, per the spec's non-goal, except that its "messaging" entry's displayed label changes automatically because Task 1 retitled the shared `admin.nav.messagingGroup` key.

- [ ] **Step 1: Write failing regression tests against the real data**

These describe the target shape and will fail against today's flat/lightly-grouped `adminNavSections` — that's the point; Step 3 makes them pass.

Add to `src/features/admin/lib/adminNav.test.ts`:

```ts
import {
  adminNavSections,
  isAdminNavGroup,
  type AdminNavGroup,
  type AdminNavSectionEntry,
} from "./adminNav";

describe("adminNavSections (new IA)", () => {
  it("Clinic section entries are ordered: Overview, Bookings, Patients & Billing, Inventory, Communications", () => {
    const clinic = adminNavSections.find((s) => s.id === "clinic")!;
    const ids = (clinic.entries as AdminNavSectionEntry[]).map((e) =>
      isAdminNavGroup(e) ? e.id : e.href,
    );
    assert.deepEqual(ids, [
      "/admin",
      "bookings",
      "patients-billing",
      "inventory",
      "messaging",
    ]);
  });

  it("Settings is now 5 sub-groups, not 11 flat items", () => {
    const site = adminNavSections.find((s) => s.id === "site")!;
    const settings = (site.entries as AdminNavSectionEntry[]).find(
      (e) => isAdminNavGroup(e) && e.id === "settings",
    ) as AdminNavGroup;
    assert.equal(settings.items.length, 5);
    for (const sub of settings.items) {
      assert.ok(isAdminNavGroup(sub), `expected ${JSON.stringify(sub)} to be a sub-group`);
    }
    assert.deepEqual(
      settings.items.map((sub) => (sub as AdminNavGroup).id),
      [
        "settings-clinic",
        "settings-communications",
        "settings-billing",
        "settings-site",
        "settings-staff-access",
      ],
    );
  });

  it("every settings leaf href from before the regroup is still reachable", () => {
    const hrefs = new Set(
      flattenAdminNavItems()
        .filter((item) => item.href.startsWith("/admin/settings/"))
        .map((item) => item.href),
    );
    assert.deepEqual(
      hrefs,
      new Set([
        "/admin/settings/clinic-hours",
        "/admin/settings/clinic-prices",
        "/admin/settings/doctors",
        "/admin/settings/whatsapp-ai",
        "/admin/settings/patient-notifications",
        "/admin/settings/templates",
        "/admin/settings/deposits",
        "/admin/settings/theme",
        "/admin/settings/site",
        "/admin/settings/accounts",
        "/admin/settings/roles",
      ]),
    );
  });

  it("Bookings, Patients & Billing, and Communications default open; Insights and the two Site groups don't", () => {
    const clinic = adminNavSections.find((s) => s.id === "clinic")!;
    const site = adminNavSections.find((s) => s.id === "site")!;
    const byId = (id: string) =>
      [...(clinic.entries ?? []), ...(site.entries ?? [])].find(
        (e) => isAdminNavGroup(e) && e.id === id,
      ) as AdminNavGroup;
    assert.equal(byId("bookings").defaultOpen, true);
    assert.equal(byId("patients-billing").defaultOpen, true);
    assert.equal(byId("messaging").defaultOpen, true);
    assert.notEqual(byId("insights").defaultOpen, true);
    assert.notEqual(byId("settings").defaultOpen, true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "new IA"`
Expected: FAIL on all 4 — today's Clinic entries are `["/admin", "reservations", "/admin/patients", "/admin/billing", "inventory", "/admin/support", "messaging"]` (different order/shape) and Settings still has 11 flat items, not 5 sub-groups.

- [ ] **Step 3: Replace `adminNavSections` with the new tree**

Re-read `src/features/admin/lib/adminNav.ts` fresh first (shared, high-traffic file). Replace the full `adminNavSections` block (currently lines 196-282, `export const adminNavSections: AdminNavSection[] = [ ... ];`) with:

```ts
export const adminNavSections: AdminNavSection[] = [
  {
    id: "clinic",
    titleKey: "admin.nav.clinic",
    entries: [
      { href: "/admin", labelKey: "admin.nav.overview", icon: Home, exact: true },
      {
        id: "bookings",
        labelKey: "admin.nav.bookingsGroup",
        icon: CalendarDays,
        defaultOpen: true,
        items: [
          { href: "/admin/reservations", labelKey: "admin.nav.reservations", permission: "reservations.view" },
          { href: "/admin/waitlist", labelKey: "admin.nav.waitlist", permission: "waitlist.view" },
          // A deposit belongs to a booking, and the page gates on the same
          // permission the reservations list does.
          { href: "/admin/deposits", labelKey: "admin.nav.deposits", permission: "reservations.view" },
        ],
      },
      {
        id: "patients-billing",
        labelKey: "admin.nav.patientsBillingGroup",
        icon: Users,
        defaultOpen: true,
        items: [
          { href: "/admin/patients", labelKey: "admin.nav.patients", permission: "patients.view" },
          { href: "/admin/billing", labelKey: "admin.nav.billing", permission: "patients.view" },
        ],
      },
      {
        id: "inventory",
        labelKey: "admin.nav.inventory",
        href: "/admin/inventory",
        icon: Package,
        permission: "inventory.view",
        items: [
          { href: "/admin/inventory/reports", labelKey: "admin.nav.inventoryReports", permission: "inventory.reports.view" },
        ],
      },
      {
        id: "messaging",
        labelKey: "admin.nav.messagingGroup",
        icon: Inbox,
        defaultOpen: true,
        items: [
          { href: "/admin/support", labelKey: "admin.nav.support", permission: "support.view" },
          { href: "/admin/quick-replies", labelKey: "admin.nav.quickReplies", permission: "quick-replies.view" },
          { href: "/admin/knowledge", labelKey: "admin.nav.knowledge", permission: "knowledge.view" },
          { href: "/admin/assistant-review", labelKey: "admin.nav.assistantReview", permission: "assistant-review.view" },
          { href: "/admin/outbox", labelKey: "admin.nav.outbox", permission: "outbox.view" },
        ],
      },
    ],
  },
  {
    id: "site",
    titleKey: "admin.nav.site",
    entries: [
      { href: "/admin/customize", labelKey: "admin.nav.customize", icon: LayoutGrid, permission: "customize.view" },
      {
        id: "insights",
        labelKey: "admin.nav.insightsGroup",
        icon: Gauge,
        items: [
          { href: "/admin/usage", labelKey: "admin.nav.usage", permission: "usage.view" },
          { href: "/admin/assist-analytics", labelKey: "admin.nav.assistAnalytics", permission: "assist-analytics.view" },
        ],
      },
      {
        id: "logs",
        labelKey: "admin.nav.logs",
        icon: History,
        defaultOpen: false,
        items: [
          { href: "/admin/system-log", labelKey: "admin.nav.systemLog", permission: "system-log.view" },
          { href: "/admin/ai-actions", labelKey: "admin.nav.aiActions", permission: "ai-actions.view" },
        ],
      },
      {
        // No href on purpose: Settings is a container, and clicking it
        // should open the group rather than navigate.
        id: "settings",
        labelKey: "admin.nav.settings",
        icon: Settings,
        defaultOpen: false,
        items: [
          {
            id: "settings-clinic",
            labelKey: "admin.settings.groupClinic",
            items: [
              { href: "/admin/settings/clinic-hours", labelKey: "admin.settings.hours", permission: "settings.view" },
              { href: "/admin/settings/clinic-prices", labelKey: "admin.settings.clinic", permission: "settings.view" },
              { href: "/admin/settings/doctors", labelKey: "admin.settings.doctors", permission: "settings.view" },
            ],
          },
          {
            id: "settings-communications",
            labelKey: "admin.settings.groupCommunications",
            items: [
              { href: "/admin/settings/whatsapp-ai", labelKey: "admin.settings.whatsappAi", permission: "settings.view" },
              { href: "/admin/settings/patient-notifications", labelKey: "admin.settings.notifications", permission: "settings.view" },
              { href: "/admin/settings/templates", labelKey: "admin.settings.templates", permission: "settings.view" },
            ],
          },
          {
            id: "settings-billing",
            labelKey: "admin.settings.groupBilling",
            items: [
              { href: "/admin/settings/deposits", labelKey: "admin.settings.deposits", permission: "settings.view" },
            ],
          },
          {
            id: "settings-site",
            labelKey: "admin.settings.groupSite",
            items: [
              { href: "/admin/settings/theme", labelKey: "admin.settings.theme", permission: "settings.view" },
              { href: "/admin/settings/site", labelKey: "admin.settings.brand", permission: "settings.view" },
            ],
          },
          {
            id: "settings-staff-access",
            labelKey: "admin.settings.groupStaffAccess",
            items: [
              { href: "/admin/settings/accounts", labelKey: "admin.nav.accounts", permission: "accounts.view" },
              { href: "/admin/settings/roles", labelKey: "admin.nav.roles", permission: "roles.view" },
            ],
          },
        ],
      },
    ],
  },
];
```

Note: `/admin/settings/inventory` stays absent from this list, matching today's actual sidebar data exactly (it exists only in `adminRailItems`'s Settings flyout and `adminPagePermissions`, a pre-existing gap unrelated to this plan — don't fix it here).

- [ ] **Step 4: Run tests to verify they pass**

Run: `GITHUB_TOKEN=x yarn test 2>&1 | grep -A5 "new IA"`
Expected: PASS (all 4)

- [ ] **Step 5: Type-check and lint**

Run: `GITHUB_TOKEN=x yarn build && GITHUB_TOKEN=x yarn lint`
Expected: both succeed — `yarn build` is expected to still fail here only on `AdminNavSectionBlock`'s prop mismatch from Task 4 (unrelated to this task's data change), not on anything in this task. If `yarn build`'s only errors are in `AdminNavSectionBlock.tsx`/`AdminSidebar.tsx` about `openGroupId`/`openGroupIds`/`isFirst`, that's expected and resolved by Task 6 next; if there are any errors referencing `adminNav.ts` itself, they're real and must be fixed here before moving on.

- [ ] **Step 6: Commit**

```bash
git add src/features/admin/lib/adminNav.ts src/features/admin/lib/adminNav.test.ts
git commit -m "$(cat <<'EOF'
feat(admin): regroup the sidebar nav into the new tree

Clinic gains Bookings (Reservations/Waitlist/Deposits) and
Patients & Billing groups; Support moves into the renamed
Communications group; Site gains an Insights group; Settings' 11 flat
items become 5 named sub-groups (Clinic, Communications, Billing,
Site, Staff & Access). Every href/permission is unchanged from today
— purely a regroup.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Recursive renderer (`AdminNavSectionBlock.tsx`)

**Files:**
- Modify: `src/features/admin/components/AdminNavSectionBlock.tsx` (full file, 169 lines)

**Interfaces:**
- Consumes: `openGroupIds: Set<string>`, `onToggleGroup: (groupId: string) => void`, `isFirst: boolean` (from Task 4's `AdminSidebar.tsx`); `AdminNavSectionEntry`, `AdminNavGroup.icon`/`items: AdminNavSectionEntry[]` (from Task 2/5); `AdminNavTreeList`/`AdminNavTreeRow` (unchanged interfaces, Task 7 only changes what's inside `AdminNavTreeList`, not its props shape used here).
- Produces: no new exports — `AdminNavSectionBlock`'s external prop contract changes (see Props type below), which is what `AdminSidebar.tsx` (Task 4) already assumes.

This task has no unit test — this repo has no test infrastructure for React nav components (confirmed: none of the other 5 nav-related files or any other `admin/components/*.tsx` file has a test), and every other UI-only component built this session (e.g. `ProposeServicesForm.tsx`, `PendingProposalsList.tsx`) followed the same pattern of build+lint+manual-smoke-test verification instead of component tests. Task 8 covers that manual verification for this and Task 7 together.

- [ ] **Step 1: Replace the file**

Re-read `src/features/admin/components/AdminNavSectionBlock.tsx` fresh first. Replace the full file with:

```tsx
"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  isAdminNavGroup,
  type AdminNavGroup,
  type AdminNavItem,
  type AdminNavSection,
  type AdminNavSectionEntry,
} from "@/features/admin/lib/adminNav";
import { useTranslations } from "@/lib/i18n";
import { AdminNavLink } from "./AdminNavLink";
import { AdminNavTreeList, AdminNavTreeRow } from "./AdminNavTreeList";
import { cn } from "@/lib/utils";

type Props = {
  section: AdminNavSection;
  pendingCount?: number;
  /** Every group/sub-group currently expanded, across every depth. */
  openGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  /** The very first rendered section skips the top divider. */
  isFirst: boolean;
};

function NavGroup({
  group,
  depth,
  isLast,
  isOpen,
  onToggle,
  onToggleGroup,
  openGroupIds,
  pendingCount,
}: {
  group: AdminNavGroup;
  depth: number;
  isLast: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onToggleGroup: (groupId: string) => void;
  openGroupIds: Set<string>;
  pendingCount?: number;
}) {
  const t = useTranslations();
  const label = t(group.labelKey);
  const Icon = depth === 0 ? group.icon : undefined;

  return (
    <>
      <AdminNavTreeRow isLast={isLast && !isOpen} depth={depth}>
        <div className="flex w-full items-center gap-1">
          {group.href ? (
            <AdminNavLink
              href={group.href}
              label={label}
              icon={Icon}
              className="flex-1"
              activeStyle={depth > 0 ? "text" : "pill"}
            />
          ) : (
            <button
              type="button"
              className={cn(
                "flex flex-1 items-center gap-1.5 truncate px-2 py-1 text-start",
                depth === 0
                  ? "text-[13px] text-[var(--admin-text)]"
                  : "text-[12px] font-normal text-[var(--admin-muted)]",
              )}
              onClick={onToggle}
            >
              {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
              <span className="truncate">{label}</span>
            </button>
          )}
          <button
            type="button"
            aria-label={label}
            aria-expanded={isOpen}
            onClick={onToggle}
            className="flex size-6 shrink-0 items-center justify-center rounded text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                isOpen ? "rotate-180" : "",
              )}
              aria-hidden
            />
          </button>
        </div>
      </AdminNavTreeRow>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1.5">
              <AdminNavEntryList
                entries={group.items}
                depth={depth + 1}
                openGroupIds={openGroupIds}
                onToggleGroup={onToggleGroup}
                pendingCount={pendingCount}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function AdminNavEntryList({
  entries,
  depth,
  openGroupIds,
  onToggleGroup,
  pendingCount,
}: {
  entries: AdminNavSectionEntry[];
  depth: number;
  openGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  pendingCount?: number;
}) {
  const blocks: ReactNode[] = [];
  let run: AdminNavItem[] = [];
  const flushRun = (key: string) => {
    if (run.length === 0) return;
    blocks.push(
      <AdminNavTreeList
        key={key}
        items={run}
        depth={depth}
        pendingCount={pendingCount}
      />,
    );
    run = [];
  };
  entries.forEach((entry, index) => {
    if (isAdminNavGroup(entry)) {
      flushRun(`run-${index}`);
      blocks.push(
        <NavGroup
          key={entry.id}
          group={entry}
          depth={depth}
          isLast={index === entries.length - 1}
          isOpen={openGroupIds.has(entry.id)}
          onToggle={() => onToggleGroup(entry.id)}
          onToggleGroup={onToggleGroup}
          openGroupIds={openGroupIds}
          pendingCount={pendingCount}
        />,
      );
    } else {
      run.push(entry);
    }
  });
  flushRun("run-end");
  return <>{blocks}</>;
}

export function AdminNavSectionBlock({
  section,
  pendingCount = 0,
  openGroupIds,
  onToggleGroup,
  isFirst,
}: Props) {
  const t = useTranslations();
  const title = t(section.titleKey);
  const entries: AdminNavSectionEntry[] =
    section.entries ?? [...(section.items ?? []), ...(section.groups ?? [])];

  return (
    <section
      className={cn(
        "mb-6",
        !isFirst && "border-t border-[var(--admin-border)] pt-4",
      )}
    >
      <div className="mb-1 px-2">
        <h2 className="text-[11px] font-medium tracking-wide text-[var(--admin-muted)]">
          {title}
        </h2>
      </div>
      <AdminNavEntryList
        entries={entries}
        depth={0}
        openGroupIds={openGroupIds}
        onToggleGroup={onToggleGroup}
        pendingCount={pendingCount}
      />
    </section>
  );
}
```

This is the actual recursion: `AdminNavEntryList` renders a `NavGroup` for each group entry, and `NavGroup`'s expanded content calls `AdminNavEntryList` again at `depth + 1` — so a sub-group's own children get the identical treatment its parent group got, one level deeper.

- [ ] **Step 2: Type-check**

Run: `GITHUB_TOKEN=x yarn build`
Expected: succeeds now that both `AdminSidebar.tsx` (Task 4) and `AdminNavSectionBlock.tsx` agree on `openGroupIds`/`onToggleGroup`/`isFirst`. `AdminNavTreeList`'s `items` prop still expects `AdminNavItem[]` and this file only ever passes it a `run: AdminNavItem[]` (plain items collected between groups), so no type error there. If `AdminNavLink`'s `icon` prop doesn't exist yet, this is expected to fail — Task 7 adds it; if that's the only remaining error, continue to Task 7 before re-running the full build gate.

- [ ] **Step 3: Lint**

Run: `GITHUB_TOKEN=x yarn lint`
Expected: succeeds (or the same `icon` prop error as above if Task 7 hasn't landed yet — otherwise fix)

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/AdminNavSectionBlock.tsx
git commit -m "$(cat <<'EOF'
feat(admin): make the sidebar tree renderer recursive

NavGroup's expanded content now renders another AdminNavEntryList one
depth deeper instead of assuming its children are always leaves, so
sub-groups get the same chevron/collapse/tree-line treatment as
top-level groups. Also threads depth-0-only icons through group
headers, gives sub-group headers a visually lighter style than
top-level group headers, and adds a top divider between sections
(skipped on the first one) via the new isFirst prop.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Leaf-row icons + stronger nested active-state (`AdminNavTreeList.tsx`, `AdminNavLink.tsx`)

**Files:**
- Modify: `src/features/admin/components/AdminNavTreeList.tsx:82-88`
- Modify: `src/features/admin/components/AdminNavLink.tsx` (full file, 56 lines)

**Interfaces:**
- Consumes: `AdminNavItem.icon` (Task 2), `depth` (existing prop, unchanged).
- Produces: `AdminNavLink` gains `icon?: LucideIcon`; its active+`"text"` style (used at depth > 0) changes from invisible-background to a real, lighter-than-pill background. No other component in the repo calls `AdminNavLink` outside these nav files (confirmed by the earlier research pass), so this is a safe, local change.

Same testing note as Task 6: no component test infra exists for this file; verified via build/lint + Task 8's manual smoke test.

- [ ] **Step 1: Pass `icon` through `AdminNavTreeList`**

Re-read `src/features/admin/components/AdminNavTreeList.tsx` fresh first. Replace lines 82-88:

```tsx
            <AdminNavLink
              href={item.href}
              label={t(item.labelKey)}
              exact={item.exact}
              badge={badge}
              activeStyle={depth > 0 ? "text" : "pill"}
            />
```

with:

```tsx
            <AdminNavLink
              href={item.href}
              label={t(item.labelKey)}
              exact={item.exact}
              badge={badge}
              icon={depth === 0 ? item.icon : undefined}
              activeStyle={depth > 0 ? "text" : "pill"}
            />
```

- [ ] **Step 2: Add the `icon` prop and fix the nested active style in `AdminNavLink.tsx`**

Re-read `src/features/admin/components/AdminNavLink.tsx` fresh first. Replace the full file with:

```tsx
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
```

- [ ] **Step 3: Type-check and lint (full build now expected clean)**

Run: `GITHUB_TOKEN=x yarn build && GITHUB_TOKEN=x yarn lint`
Expected: both succeed — this is the first point since Task 4 where the whole call chain (`AdminSidebar` → `AdminNavSectionBlock` → `AdminNavTreeList`/`AdminNavLink`) is consistent end to end.

- [ ] **Step 4: Run the full test suite**

Run: `GITHUB_TOKEN=x yarn test`
Expected: all tests pass, including every test added in Tasks 2-5

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/AdminNavTreeList.tsx src/features/admin/components/AdminNavLink.tsx
git commit -m "$(cat <<'EOF'
feat(admin): show icons on top-level nav rows, strengthen nested active state

Depth-0 leaf items now render their icon next to the label, matching
the icon rail. Active rows at depth > 0 (previously bold text with no
background — too subtle once Settings has a 3-level tree) now get a
real, visually lighter background than the top-level active pill.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full automated verification**

```bash
GITHUB_TOKEN=x yarn build
GITHUB_TOKEN=x yarn lint
GITHUB_TOKEN=x yarn test
```

Expected: all three succeed, with every new test from Tasks 2-5 present and passing.

- [ ] **Step 2: Sync the local Supabase instance**

```bash
supabase migration up
```

Expected: succeeds or reports already up to date (this plan makes no schema changes; this only picks up any concurrent migrations that landed since the local DB was last synced, matching every prior feature's verification step this session).

- [ ] **Step 3: Start the dev server against the local instance**

```bash
GITHUB_TOKEN=x env $(cat .env.e2e | grep -v '^#' | xargs) yarn dev
```

Run in the background; confirm it's serving on `http://localhost:3000` before continuing.

- [ ] **Step 4: Playwright smoke test**

Write a script to the scratchpad directory (adjust the two path constants to this session's actual scratchpad path), then `cp` it to the repo root to run so `node_modules` resolves, then `rm` the copy:

```js
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const shots = "<scratchpad-dir>"; // this session's actual scratchpad directory

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
});

await page.goto(`${BASE}/admin/login`);
await page.fill('input[type="email"], input[name="email"]', "admin@dentallounge.local");
await page.fill('input[type="password"], input[name="password"]', "DentalLounge2026!");
await page.click('button[type="submit"]');
await page.waitForURL(/\/admin(\/)?$/, { timeout: 15000 }).catch(() => {});

// 1. Full sidebar, default state — confirm the new groups/icons render.
await page.goto(`${BASE}/admin`);
await page.waitForTimeout(800);
await page.screenshot({ path: `${shots}/sidebar-01-overview.png`, fullPage: true });

// 2. Expand Settings, then expand one of its 5 sub-groups — both must
//    stay open at once (the actual point of the Set-based state).
await page.getByRole("button", { name: /settings/i }).first().click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /clinic/i }).first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${shots}/sidebar-02-settings-and-subgroup-open.png`, fullPage: true });

// 3. Direct navigation to a doubly-nested settings page must auto-expand
//    both Settings and its Clinic sub-group.
await page.goto(`${BASE}/admin/settings/clinic-hours`);
await page.waitForTimeout(800);
await page.screenshot({ path: `${shots}/sidebar-03-deep-link-auto-expand.png`, fullPage: true });

// 4. Confirm the collapsed icon rail still works, unchanged.
const collapseBtn = page.locator('button[aria-label*="ollapse" i], button[aria-label*="idebar" i]').first();
if (await collapseBtn.count()) {
  await collapseBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${shots}/sidebar-04-icon-rail.png`, fullPage: true });
}

console.log("console/page errors:", errors.length ? errors.join("\n") : "none");
await browser.close();
```

Run it, then inspect the four screenshots and the printed error list:
- `sidebar-01-overview.png`: Overview/Bookings/Patients & Billing/Inventory/Communications visible in Clinic with icons; Customize/Insights/Logs/Settings visible in Site; a visible divider between Clinic and Site.
- `sidebar-02-settings-and-subgroup-open.png`: both Settings and its Clinic sub-group expanded simultaneously, sub-group header visually lighter than Settings' own header.
- `sidebar-03-deep-link-auto-expand.png`: landing directly on `/admin/settings/clinic-hours` shows Settings and Clinic sub-group already open, with Clinic Hours shown as the active (filled) row.
- `sidebar-04-icon-rail.png`: collapsed rail unchanged from before this plan.
- Error list: `none`.

- [ ] **Step 5: Confirm permission-based filtering still collapses empty groups at every depth**

Using the same running server, log in (or reuse the admin session) and check a role with restricted permissions still hides items/collapses empty groups correctly — either by using an existing restricted-role test account if one exists in `.env.e2e`'s seed data, or by noting in the report that this was covered by Task 2's automated recursive-filtering tests (fixture-based, already verifying 2-level collapse) if no restricted account is readily available. Prefer the live check if a restricted account exists; don't create a new role/account solely for this if none does.

- [ ] **Step 6: Clean up**

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
```

Remove any copied `.mjs` script left in the repo root (not the scratchpad copy).

- [ ] **Step 7: Report**

Summarize: automated verification results, the 4 screenshots' observations, any console/page errors found (and whether they're pre-existing/unrelated vs. caused by this work), and the outcome of the permission-filtering check.

---

## Self-Review

**Spec coverage:**
- Groups can contain sub-groups → Task 2 (types), Task 6 (renderer). ✓
- Reorganized tree (Bookings, Patients & Billing, Communications, Insights, 5 Settings sub-groups) → Task 5. ✓
- Multiple groups open at once (Set-based state) → Task 4. ✓
- Icons on expanded rows (depth-0 only) → Task 2 (icon field), Task 5 (data), Task 6 (group icons), Task 7 (leaf icons). ✓
- Stronger active-state at every depth → Task 7. ✓
- Sub-groups visually lighter than top-level groups → Task 6 (depth-aware button classes). ✓
- More breathing room between sections → Task 6 (`mb-6` + top divider via `isFirst`). ✓
- Icon rail stays untouched structurally → confirmed not modified in any task; only its shared i18n label changes via Task 1, which is the spec's own described mechanism for keeping the two in sync on a rename, not a rail code change. ✓
- No arbitrary depth beyond one more level → data in Task 5 never nests a group inside a group inside a group; types in Task 2 don't prevent deeper nesting programmatically, but nothing in this plan produces it. ✓
- "Group" naming preserved, no "Collection" — confirmed no such renaming anywhere in this plan. ✓
- Inventory placement (the gap flagged going into this plan) → Task 5 places it as its own unchanged top-level group between Patients & Billing and Communications, tested explicitly in Task 5's first regression test. ✓

**Placeholder scan:** no TBD/TODO, every step has literal code, every test has real assertions, no "similar to Task N" references.

**Type consistency:** `AdminNavSectionEntry` (Task 2) is the type every later task's `items`/`entries` fields use; `findActiveAdminNavGroupIds` (Task 4) returns `Set<string>`, exactly what `AdminSidebar.tsx`'s `openGroupIds` state and `AdminNavSectionBlock`'s `Props.openGroupIds` (Task 6) both expect; `AdminNavLink`'s `icon?: LucideIcon` (Task 7) matches `AdminNavItem.icon`/`AdminNavGroup.icon` (Task 2) exactly; `onToggleGroup: (groupId: string) => void` is the same signature from Task 4 through Task 6.

**Known intentional build-red window:** Task 4 leaves `yarn build` failing between its own commit and Task 6's commit (prop mismatch between `AdminSidebar.tsx` and `AdminNavSectionBlock.tsx`, both touched by the same "Set-based expand state" feature but necessarily landing as producer/consumer across two tasks). This is flagged explicitly in both tasks' steps so whoever executes this doesn't mistake it for a regression; Task 8's full verification only runs once Task 7 is also done, when everything is green together.
