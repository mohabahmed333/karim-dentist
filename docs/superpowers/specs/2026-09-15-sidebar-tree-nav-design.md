# Sidebar tree navigation: one more level of grouping

- **Date:** 2026-09-15
- **Status:** proposed
- **Area:** `src/features/admin/lib/adminNav.ts` (data model), `AdminSidebar.tsx` / `AdminNavSectionBlock.tsx` / `AdminNavTreeList.tsx` (rendering). Icon rail (`AdminIconRail.tsx`, `adminRailItems`) explicitly untouched.

## Problem

The admin sidebar's full-width nav is capped at exactly two levels — section → (group → item) or section → item — everywhere, in both the data model (`AdminNavGroup.items: AdminNavItem[]`, never nested) and the renderer. As the admin panel has grown, this shows up as clutter: `Settings` alone is 11 flat items in one list, and several related top-level items (Reservations/Waitlist/Deposits, Patients/Billing, Support alongside the Messaging group) sit as separate flat entries in `Clinic` with no grouping tying them together, even though they're conceptually related. The user wants one more level of nesting generally, not just in one spot.

## Goals

1. Groups can contain sub-groups (one extra level beyond what exists today), each independently expandable/collapsible.
2. Reorganize the current flat/lightly-grouped items into a more scannable tree — Settings' 11 items split into named sub-groups; related top-level Clinic items folded into new groups.
3. Multiple groups (including a group and its sub-group) can be open at the same time — today's single-group-open accordion can't represent that.
4. Fix the visual gaps that would make a deeper tree harder to use rather than easier: icons on expanded rows, a clearer active-state, visually distinct sub-group headers, and clearer separation between top-level sections (see "UX polish" below).

## Non-goals

- **The icon rail stays flat.** `adminRailItems`'s flyouts keep today's one-level `children` list — a 3-level tree doesn't fit a compact hover/click dropdown well, and the user confirmed the rail doesn't need to match. Rail flyouts for regrouped items (e.g. Settings) show the same flat item list as before, just without the new sub-group headers.
- **No arbitrary depth.** One more level, not a general-purpose unbounded tree — confirmed with the user as the actual need, not a bigger IA system.
- **Not renaming "group" to "Collection" or anything else.** Confirmed with the user: keep calling it a group, matching the existing `AdminNavGroup` type name — avoids colliding in vocabulary with the unrelated `CollectionTable` component already used throughout the admin for tabular data (Clients, Services, Patients lists, etc.).

## Decisions

- **`AdminNavGroup.items` becomes `(AdminNavItem | AdminNavGroup)[]`.** A group's children can now be a mix of plain items and sub-groups, discriminated the same way `AdminNavSectionEntry` already discriminates item vs. group today (`"items" in entry`). This reuses an existing pattern in the file rather than inventing a new discriminant.
- **Expand state moves from a single `openGroupId: string` to `openGroupIds: Set<string>`.** Today's `AdminSidebar.tsx` has exactly one group open at a time (opening a new one closes whatever was open) — that can't represent "Settings is open AND its Clinic sub-group is open" at once, which is the normal state once nesting exists. The `findActiveAdminNavGroupId` logic (which auto-opens whichever group contains the current page) needs to become `findActiveAdminNavGroupIds` returning every group *and sub-group* on the path to the active page, so navigating straight to a settings sub-page auto-expands both levels.
- **The renderer becomes recursive.** `AdminNavSectionBlock`'s local `NavGroup` component currently renders exactly one flat `AdminNavTreeList` of items at a fixed `depth`. It needs to check each child: plain item → render as today; sub-group → render another `NavGroup` at `depth + 1`, reusing the same chevron/collapse treatment. `AdminNavTreeList`/`AdminNavTreeRow` already take a `depth` prop for indentation, so the visual/indentation side mostly falls out for free — the change is really about `NavGroup` calling itself instead of assuming its children are always leaves.
- **Filtering (`filterAdminNavGroup`) becomes recursive too**, so a sub-group with zero permitted items (or a sub-group whose only child is a permission-gated item the current role can't see) collapses away the same way an empty top-level group already does today, at every level.

## New tree structure

**Clinic** section:
- Overview *(top-level item, unchanged)*
- **Bookings** *(new group)* → Reservations, Waitlist, Deposits
- **Patients** *(new group)* → Patients, Billing
- **Communications** *(renamed/expanded from today's Messaging group)* → Support, Quick Replies, Knowledge, Assistant Review, Outbox

**Site** section:
- Customize *(top-level item, unchanged — the main CMS editor, keeps its prominence)*
- **Insights** *(new group)* → Usage, Assist Analytics
- Logs *(unchanged — System Log, AI Actions; only 2 items, already scannable, not worth sub-dividing)*
- **Settings** *(same group as today, now with sub-groups instead of 11 flat items)*:
  - **Clinic** *(sub-group)* → Clinic Hours, Clinic Prices, Doctors
  - **Communications** *(sub-group)* → WhatsApp AI, Patient Notifications, Templates
  - **Billing** *(sub-group)* → Deposits
  - **Site** *(sub-group)* → Theme, Site/Brand
  - **Staff & Access** *(sub-group)* → Accounts, Roles

Every `href`/`permission` on every existing leaf item stays exactly as it is today — this is purely a regrouping of existing entries, not a change to any route, permission key, or page.

## Rendering / interaction details

- A sub-group gets the identical `NavGroup` treatment as a top-level group (chevron button, `framer-motion` `AnimatePresence` collapse, tree-line indentation via the existing `depth` prop on `AdminNavTreeList`) — just nested one level deeper, so `depth` reaches 2 for a leaf item under a sub-group (section implicit at depth -1, group at 0, sub-group at 1, item at 2 — exact numeric depths to be finalized against `AdminNavTreeList`'s current depth handling during implementation, not asserted here as gospel).
- Auto-expand on navigation: landing on `/admin/settings/clinic-hours` must open both `Settings` and its `Clinic` sub-group, not just one level — this is what `findActiveAdminNavGroupIds` (plural, Set-returning) covers.
- Manually toggling a group/sub-group closed no longer force-closes sibling or parent groups (that's the point of the state moving from scalar to Set). On every route change, the open-Set is still fully recomputed from `findActiveAdminNavGroupIds(sections, pathname)` — the same reset-on-navigation behavior `openGroupId` has today, just producing a Set instead of one id. Manual toggles apply on top of that until the next navigation, exactly matching today's override semantics. Deliberately not accumulate-forever (never auto-closing a group once visited) — that would leave every previously-visited group's disclosure permanently open and defeat the decluttering goal.

## UX polish (folded in alongside the regrouping)

Four visual/interaction gaps, confirmed with the user from a live screenshot of the current sidebar, worth fixing at the same time since they directly affect how usable the new, deeper tree actually is:

- **Icons on expanded-sidebar rows.** Today only the collapsed icon rail has icons (`adminRailItems[].icon`) — the full labeled sidebar is plain text. Every top-level item/group that has a rail equivalent reuses that same `LucideIcon` in the expanded view (e.g. `Overview` → `Home`, `Patients` group → `Users`). New groups introduced by this spec with no existing rail counterpart (`Bookings`, `Communications`, `Insights`, and the five `Settings` sub-groups) get a sensibly-matched icon chosen during implementation — not enumerated here, since picking the exact glyph is a cosmetic implementation detail, not a product decision. Sub-group items (one level deeper than today) do **not** get their own icons — only top-level items/groups within a section, and top-level groups directly under a section, carry one; going icon-per-leaf at the deepest level would add visual noise rather than remove it.
- **Stronger active-state.** The current page's row gets a filled background pill (matching the existing `"pill"` active style `AdminNavLink.tsx` already applies at depth 0) at **every** depth, not just the top level — today's `"text"` style for anything under a group (bold/colored text only, no background) is too subtle once there's a 3-level tree to orient in.
- **Sub-groups read as visually one level lighter than top-level groups** — smaller label size and/or muted color for a sub-group's own header row, so the eye can tell "Clinic" (a Settings sub-group) apart from "Settings" (the group containing it) without relying on indentation alone.
- **More breathing room between the two top-level sections** (`Clinic` / `Site`) — a bit more vertical gap and/or a subtle divider above each section's title, so they read as clearly separate zones rather than one continuous list broken only by a small gray label.

## Icon rail

No data-model change. `adminRailItems`'s `children` stays flat. Where a rail item's flyout previously mirrored a now-regrouped sidebar section (chiefly `settings`), the flyout keeps listing the same flat set of destination links it does today — sub-group headers are a full-sidebar-only affordance, not reproduced in the compact flyout.
