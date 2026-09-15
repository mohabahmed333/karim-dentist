# Dashboard Widget Framework + Inventory Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development (recommended) or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalize Overview's customizable-widget system into a reusable, catalog-agnostic framework, then build a new Inventory Analytics page on top of it.

**Architecture:** The generic layout engine (drag/resize/stack math, undo/redo, event bridge) moves to `src/features/admin/lib/dashboardWidgets/` and `src/features/admin/components/dashboardWidgets/`, using plain `string` widget ids (not a TypeScript generic parameter — the engine treats ids opaquely, so this is simpler and equally safe). Overview gets a thin per-page "bound wrapper" (`src/features/admin/lib/overview/`) that re-exports the same function names it already imports, so its own call sites barely change. Inventory Analytics is a new, parallel per-page module set, plus a new `dashboard_layouts` table for its (and future pages') persistence — Overview keeps its existing `site_settings.dashboard_layout` storage untouched.

**Tech Stack:** Next.js server components + Supabase; `node --test` for unit tests (`bash scripts/test.sh`); `nuqs` for URL-backed filter state.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-09-15-dashboard-widget-framework-and-inventory-analytics-design.md`.
- Test runner: `bash scripts/test.sh` (all tests) or `node --experimental-strip-types --import ./scripts/test-loader.mjs --test <file>` (one file). Imports (relative and `@/`) are written **without** a file extension.
- Typecheck: `GITHUB_TOKEN=x yarn typecheck` before considering any task done.
- **This repo has multiple concurrent sessions committing to `main` right now.** Before every `git add`, run `git status --short -- <exact files>` first and stage only the files this task touched — never a broad `git add -A`/`git add .`. Commit immediately after staging (don't leave staged-but-uncommitted files sitting around) to minimize the window where another session's `git commit` could sweep them up.
- Widget ids are plain `string` throughout the generic engine — no `<TId extends string>` generic parameter. Each page's own catalog/render-switch narrows with its own union type at its own boundary (one `as <PageWidgetId>` cast, exactly where that page reads `placement.id` to decide what to render).
- The generic engine's UI copy keeps reusing the **existing** `admin.overview.customize.*` i18n keys verbatim (Customize layout, Add widget, size labels, etc.) — no i18n renaming. This is deliberate: the user asked for identical UX/copy across pages, and renaming shared keys would be unrelated churn.
- Overview's storage (`site_settings.dashboard_layout`) is untouched. New pages use a new `dashboard_layouts(page_key, layout, updated_at)` table.
- Applying the new migration (`supabase db push --linked`) touches the shared/production Supabase project — **confirm with the user before running it**, per this session's standing rule on risky/shared-infrastructure actions.
- Inventory Analytics view permission: `inventory.view` (reused). Layout-edit permission: `settings.edit` (reused) — enforced the same way Overview already enforces it: the edit UI is available to anyone who can reach the page, and the actual save call is server-side gated. No new permission rows.
- Inventory Analytics date range: two presets only, "Last 30 days" / "Last 90 days" — no custom range.

---

### Task 1: Move the zero-change layout-engine files

**Files:**
- Create: `src/features/admin/lib/dashboardWidgets/dashboardWidgetHeight.ts`, `src/features/admin/lib/dashboardWidgets/dashboardWidgetHeight.test.ts`
- Create: `src/features/admin/lib/dashboardWidgets/dashboardLayoutMotion.ts`
- Create: `src/features/admin/lib/dashboardWidgets/dashboardDragScroll.ts`, `src/features/admin/lib/dashboardWidgets/dashboardDragScroll.test.ts`
- Delete: `src/features/admin/lib/dashboardWidgetHeight.ts`, `src/features/admin/lib/dashboardWidgetHeight.test.ts`, `src/features/admin/lib/dashboardLayoutMotion.ts`, `src/features/admin/lib/dashboardDragScroll.ts`, `src/features/admin/lib/dashboardDragScroll.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: identical exports to today (`DASHBOARD_WIDGET_HEIGHT_MIN/DEFAULT/ABS_MAX/MAX`, `viewportWidgetHeightMax`, `clampDashboardWidgetHeight`, `nextDashboardWidgetHeightFromDrag`, `parseDashboardWidgetHeight`, `dashboardLayoutTransition`, `dashboardEditChromeTransition`, `dashboardEditChromeVariants`, `dashboardEditSlotVariants`, `scrollDeltaForDragEdge`, `findVerticalScrollParent`, `createDragAutoScroll`) at new import paths. Consumed by Tasks 3, 6, 7, 8, 20.

These three files have zero references to any widget-id type today (confirmed by reading each in full) — this is a pure file move, byte-for-byte content, at a new path.

- [ ] **Step 1: Move the files with their exact current content**

Create `src/features/admin/lib/dashboardWidgets/dashboardWidgetHeight.ts` with this exact content (identical to today's `src/features/admin/lib/dashboardWidgetHeight.ts`):

```ts
export const DASHBOARD_WIDGET_HEIGHT_MIN = 120;
/** Soft default used before viewport measurement. */
export const DASHBOARD_WIDGET_HEIGHT_DEFAULT = 280;
/** Absolute ceiling for persisted values (large monitors / multi-display). */
export const DASHBOARD_WIDGET_HEIGHT_ABS_MAX = 5000;

/** @deprecated Prefer viewportWidgetHeightMax — kept for aria fallbacks. */
export const DASHBOARD_WIDGET_HEIGHT_MAX = DASHBOARD_WIDGET_HEIGHT_ABS_MAX;

export function viewportWidgetHeightMax(
  viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
): number {
  // Nearly full viewport so a widget can fill the visible screen.
  return Math.max(
    DASHBOARD_WIDGET_HEIGHT_MIN,
    Math.round(viewportHeight - 16),
  );
}

export function clampDashboardWidgetHeight(
  value: number,
  max = DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
): number {
  const ceiling = Math.max(DASHBOARD_WIDGET_HEIGHT_MIN, max);
  return Math.min(
    ceiling,
    Math.max(DASHBOARD_WIDGET_HEIGHT_MIN, Math.round(value)),
  );
}

export function nextDashboardWidgetHeightFromDrag(
  startHeight: number,
  startY: number,
  clientY: number,
  max = DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
): number {
  return clampDashboardWidgetHeight(
    startHeight + (clientY - startY),
    max,
  );
}

export function parseDashboardWidgetHeight(
  raw: unknown,
): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return clampDashboardWidgetHeight(raw);
}
```

Create `src/features/admin/lib/dashboardWidgets/dashboardLayoutMotion.ts` with this exact content (identical to today's `src/features/admin/lib/dashboardLayoutMotion.ts`):

```ts
import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/** Shared tween for widget reposition / col-span layout. */
export function dashboardLayoutTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0 };
  return { duration: 0.28, ease };
}

/** Toolbar / dashed slots when entering Customize. */
export function dashboardEditChromeTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0 };
  return { duration: 0.22, ease };
}

export function dashboardEditChromeVariants(
  reduced: boolean | null,
): Variants {
  if (reduced) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
    };
  }
  return {
    initial: { opacity: 0, y: -6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  };
}

export function dashboardEditSlotVariants(
  reduced: boolean | null,
): Variants {
  if (reduced) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  };
}
```

Create `src/features/admin/lib/dashboardWidgets/dashboardDragScroll.ts` with this exact content (identical to today's `src/features/admin/lib/dashboardDragScroll.ts`):

```ts
/** Pointer near top/bottom of a scrollport → scroll delta (px this frame). */
export function scrollDeltaForDragEdge(
  clientY: number,
  containerTop: number,
  containerBottom: number,
  edgePx = 72,
  maxSpeed = 28,
): number {
  const height = containerBottom - containerTop;
  if (height <= 0 || edgePx <= 0 || maxSpeed <= 0) return 0;
  const zone = Math.min(edgePx, height / 2);

  if (clientY < containerTop + zone) {
    const t = (containerTop + zone - clientY) / zone;
    return -Math.ceil(maxSpeed * Math.min(1, Math.max(0, t)));
  }
  if (clientY > containerBottom - zone) {
    const t = (clientY - (containerBottom - zone)) / zone;
    return Math.ceil(maxSpeed * Math.min(1, Math.max(0, t)));
  }
  return 0;
}

/** Nearest ancestor that can scroll vertically (or the scrolling documentElement). */
export function findVerticalScrollParent(
  start: Element | null,
): HTMLElement | null {
  let node: Element | null = start;
  while (node && node instanceof HTMLElement) {
    const { overflowY } = getComputedStyle(node);
    const canScroll =
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1;
    if (canScroll) return node;
    node = node.parentElement;
  }
  const root = document.scrollingElement;
  return root instanceof HTMLElement ? root : null;
}

/** rAF loop: hold pointer near the scrollport edge to keep scrolling while dragging. */
export function createDragAutoScroll() {
  let scroller: HTMLElement | null = null;
  let lastY = 0;
  let raf = 0;
  let active = false;

  function tick() {
    if (!active || !scroller) return;
    const rect = scroller.getBoundingClientRect();
    const delta = scrollDeltaForDragEdge(lastY, rect.top, rect.bottom);
    if (delta !== 0) scroller.scrollTop += delta;
    raf = requestAnimationFrame(tick);
  }

  function onDocDragOver(event: globalThis.DragEvent) {
    lastY = event.clientY;
  }

  return {
    notePointer(clientY: number) {
      lastY = clientY;
    },
    start(fromEl: Element | null) {
      scroller = findVerticalScrollParent(fromEl);
      if (!scroller || active) return;
      active = true;
      document.addEventListener("dragover", onDocDragOver);
      raf = requestAnimationFrame(tick);
    },
    stop() {
      if (!active) return;
      active = false;
      document.removeEventListener("dragover", onDocDragOver);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      scroller = null;
    },
  };
}
```

Move the two existing test files verbatim (same content, new path):
`src/features/admin/lib/dashboardWidgetHeight.test.ts` → `src/features/admin/lib/dashboardWidgets/dashboardWidgetHeight.test.ts` (its `from "./dashboardWidgetHeight"` import stays correct since the file moves alongside it).
`src/features/admin/lib/dashboardDragScroll.test.ts` → `src/features/admin/lib/dashboardWidgets/dashboardDragScroll.test.ts` (same reasoning).

- [ ] **Step 2: Delete the old files**

```bash
rm src/features/admin/lib/dashboardWidgetHeight.ts src/features/admin/lib/dashboardWidgetHeight.test.ts src/features/admin/lib/dashboardLayoutMotion.ts src/features/admin/lib/dashboardDragScroll.ts src/features/admin/lib/dashboardDragScroll.test.ts
```

- [ ] **Step 3: Run the moved tests to confirm they still pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardWidgets/dashboardWidgetHeight.test.ts src/features/admin/lib/dashboardWidgets/dashboardDragScroll.test.ts`
Expected: PASS (all tests, unchanged from before the move)

Note: this step will not fully succeed on its own yet — `dashboardLayout.ts` and other files still importing the OLD paths (`./dashboardWidgetHeight`, `./dashboardLayoutMotion`, `./dashboardDragScroll`) will now fail to resolve, since those files were just deleted. That breakage is expected and gets fixed in Tasks 3–7 as each importer moves. Do not attempt to fix those other files in this task — just confirm the two moved test files themselves pass in isolation (they have no cross-file imports besides their own sibling).

- [ ] **Step 4: Commit**

```bash
git status --short -- src/features/admin/lib/dashboardWidgetHeight.ts src/features/admin/lib/dashboardWidgetHeight.test.ts src/features/admin/lib/dashboardLayoutMotion.ts src/features/admin/lib/dashboardDragScroll.ts src/features/admin/lib/dashboardDragScroll.test.ts src/features/admin/lib/dashboardWidgets/
git add src/features/admin/lib/dashboardWidgetHeight.ts src/features/admin/lib/dashboardWidgetHeight.test.ts src/features/admin/lib/dashboardLayoutMotion.ts src/features/admin/lib/dashboardDragScroll.ts src/features/admin/lib/dashboardDragScroll.test.ts src/features/admin/lib/dashboardWidgets/dashboardWidgetHeight.ts src/features/admin/lib/dashboardWidgets/dashboardWidgetHeight.test.ts src/features/admin/lib/dashboardWidgets/dashboardLayoutMotion.ts src/features/admin/lib/dashboardWidgets/dashboardDragScroll.ts src/features/admin/lib/dashboardWidgets/dashboardDragScroll.test.ts
git commit -m "refactor(dashboard-widgets): move zero-change layout-engine files to the generic dashboardWidgets/ home"
```

---

### Task 2: Create the generic catalog types module

**Files:**
- Create: `src/features/admin/lib/dashboardWidgets/dashboardCatalog.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `DASHBOARD_COL_SPANS`, `DashboardColSpan`, `DashboardWidgetPlacement` (`id: string`), `DashboardLayout`, `DashboardWidgetMeta` (`id: string`), `DashboardCatalog` (`{ ids: readonly string[]; meta: (id: string) => DashboardWidgetMeta; defaultLayout: DashboardLayout }`), `colSpanClass`, `colSpanLabelKey`. Consumed by every remaining task in Part 1 and Part 2.

- [ ] **Step 1: Write the file**

Create `src/features/admin/lib/dashboardWidgets/dashboardCatalog.ts`:

```ts
import type { AnyMessageKey } from "@/lib/i18n";

export const DASHBOARD_COL_SPANS = [3, 4, 6, 8, 9, 12] as const;
export type DashboardColSpan = (typeof DASHBOARD_COL_SPANS)[number];

export type DashboardWidgetPlacement = {
  id: string;
  colSpan: DashboardColSpan;
  /** Widgets with the same stackId render in one vertical column. */
  stackId?: string;
  /**
   * Widgets sharing a rowId stay on the same grid row.
   * Shrinking leaves gap on that row instead of pulling the next row up.
   */
  rowId?: string;
  /** Reserved grid width while resizing — legacy; stripped on write. */
  slotSpan?: DashboardColSpan;
  /** Optional fixed viewport height (px); content scrolls inside. */
  heightPx?: number;
};

export type DashboardLayout = DashboardWidgetPlacement[];

export type DashboardWidgetMeta = {
  id: string;
  labelKey: AnyMessageKey;
  defaultColSpan: DashboardColSpan;
  allowedColSpans: readonly DashboardColSpan[];
};

/** Everything a page supplies to the generic layout engine for its own widgets. */
export type DashboardCatalog = {
  ids: readonly string[];
  meta: (id: string) => DashboardWidgetMeta;
  defaultLayout: DashboardLayout;
};

export function colSpanLabelKey(colSpan: DashboardColSpan): AnyMessageKey {
  switch (colSpan) {
    case 3:
      return "admin.overview.customize.sizeQuarter";
    case 4:
      return "admin.overview.customize.sizeThird";
    case 6:
      return "admin.overview.customize.sizeHalf";
    case 8:
      return "admin.overview.customize.sizeTwoThirds";
    case 9:
      return "admin.overview.customize.sizeThreeQuarters";
    case 12:
      return "admin.overview.customize.sizeFull";
  }
}

export function colSpanClass(colSpan: DashboardColSpan): string {
  switch (colSpan) {
    case 3:
      return "col-span-12 sm:col-span-3";
    case 4:
      return "col-span-12 sm:col-span-4";
    case 6:
      return "col-span-12 sm:col-span-6";
    case 8:
      return "col-span-12 sm:col-span-8";
    case 9:
      return "col-span-12 sm:col-span-9";
    case 12:
      return "col-span-12";
  }
}
```

(`colSpanLabelKey`/`colSpanClass` are moved verbatim from today's `dashboardLayoutCatalog.ts`, only the return type of `colSpanLabelKey` changes from the Overview-specific `AdminMessageKey` to the broader `AnyMessageKey` — both types already accept the exact same `admin.overview.customize.*` string literals, so this is a widening, not a behavior change.)

- [ ] **Step 2: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no new errors from this file (it has no dependents yet, so nothing else can break from adding it).

- [ ] **Step 3: Commit**

```bash
git status --short -- src/features/admin/lib/dashboardWidgets/dashboardCatalog.ts
git add src/features/admin/lib/dashboardWidgets/dashboardCatalog.ts
git commit -m "feat(dashboard-widgets): add the generic catalog types module"
```

---

### Task 3: Move `dashboardDrop.ts` (import path only)

**Files:**
- Create: `src/features/admin/lib/dashboardWidgets/dashboardDrop.ts`
- Delete: `src/features/admin/lib/dashboardDrop.ts`

**Interfaces:**
- Consumes: `DASHBOARD_COL_SPANS`, `DashboardColSpan` (Task 2).
- Produces: `DashboardDropEdge`, `exactRowPartners`, `compatibleRowSpans`, `resolveRowPairSpans`, `dropEdgeFromRatios` — identical exports to today. Consumed by Tasks 4, 6, 7, 8.

- [ ] **Step 1: Write the file**

Create `src/features/admin/lib/dashboardWidgets/dashboardDrop.ts` (identical to today's `dashboardDrop.ts`, only the import line changes):

```ts
import {
  DASHBOARD_COL_SPANS,
  type DashboardColSpan,
} from "./dashboardCatalog";

export type DashboardDropEdge = "above" | "below" | "left" | "right";

/**
 * Exact two-across pairs that fill a 12-col row:
 * 3+9, 4+8, 6+6, 8+4, 9+3.
 */
export function exactRowPartners(
  span: DashboardColSpan,
): DashboardColSpan[] {
  return DASHBOARD_COL_SPANS.filter((other) => other + span === 12);
}

/** Spans that can share a row with `span` (sum ≤ 12). */
export function compatibleRowSpans(
  span: DashboardColSpan,
): DashboardColSpan[] {
  return DASHBOARD_COL_SPANS.filter((other) => other + span <= 12);
}

/**
 * Pick left/right widths for a shared row.
 * Prefers keeping sizes when they fit; else exact pairs 9+3 / 8+4 / 6+6.
 */
export function resolveRowPairSpans(
  left: DashboardColSpan,
  right: DashboardColSpan,
): { left: DashboardColSpan; right: DashboardColSpan } {
  if (left + right <= 12) return { left, right };

  if (left === 3 || right === 3 || left === 9 || right === 9) {
    return left === 3 || right === 9
      ? { left: 3, right: 9 }
      : { left: 9, right: 3 };
  }
  if (left === 4 || right === 4 || left === 8 || right === 8) {
    return left === 4 || right === 8
      ? { left: 4, right: 8 }
      : { left: 8, right: 4 };
  }
  return { left: 6, right: 6 };
}

/**
 * Drop zone bands: top/bottom strips stack; middle is left/right.
 * Short cards (KPIs) use taller bands so stack drops are easy to hit.
 * Same-row neighbors prefer a thinner vertical band so left/right swap is easy.
 */
export function dropEdgeFromRatios(
  xRatio: number,
  yRatio: number,
  aspectHeightOverWidth = 1,
  preferHorizontal = false,
): DashboardDropEdge {
  const x = Math.min(1, Math.max(0, xRatio));
  const y = Math.min(1, Math.max(0, yRatio));
  if (preferHorizontal) {
    const band = 0.18;
    if (y <= band) return "above";
    if (y >= 1 - band) return "below";
    return x < 0.5 ? "left" : "right";
  }
  const shortCard = aspectHeightOverWidth < 0.75;
  const band = shortCard ? 0.5 : 0.33;
  if (y <= band) return "above";
  if (y >= 1 - band) return "below";
  return x < 0.5 ? "left" : "right";
}
```

- [ ] **Step 2: Delete the old file**

```bash
rm src/features/admin/lib/dashboardDrop.ts
```

- [ ] **Step 3: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only from files still importing the now-deleted `./dashboardDrop` (dashboardStacks.ts, dashboardLayoutBridge.ts, DashboardWidgetFrame.tsx) — all fixed in Tasks 4–7. No error from the new file itself.

- [ ] **Step 4: Commit**

```bash
git status --short -- src/features/admin/lib/dashboardDrop.ts src/features/admin/lib/dashboardWidgets/dashboardDrop.ts
git add src/features/admin/lib/dashboardDrop.ts src/features/admin/lib/dashboardWidgets/dashboardDrop.ts
git commit -m "refactor(dashboard-widgets): move dashboardDrop.ts to the generic dashboardWidgets/ home"
```

---

### Task 4: Move and de-specialize `dashboardStacks.ts`

**Files:**
- Create: `src/features/admin/lib/dashboardWidgets/dashboardStacks.ts`
- Delete: `src/features/admin/lib/dashboardStacks.ts`

**Interfaces:**
- Consumes: `DashboardColSpan`, `DashboardLayout`, `DashboardWidgetPlacement`, `DASHBOARD_COL_SPANS` (Task 2); `resolveRowPairSpans`, `DashboardDropEdge` (Task 3).
- Produces: `DashboardStack`, `DashboardStackRow`, `ensureDashboardRowIds`, `groupDashboardStacks`, `placeDashboardWidget`, `placeDashboardWidgetBeside`, `appendToDashboardStack`, `moveToNewDashboardStack`, `packDashboardStackRows`, `rowGapColSpan`, `placeInDashboardRowGap`, `maxDashboardStackColSpan`, `resizeDashboardStack` — same names/arity as today, with every `DashboardWidgetId` parameter/return widened to `string`. Consumed by Tasks 5, 7, 8, 20.

Every function body is unchanged from today's `dashboardStacks.ts` — only the type import source changes (`DashboardWidgetId` from `dashboardLayoutCatalog` → removed; replaced inline with `string`) and the `dashboardDrop` import path changes.

- [ ] **Step 1: Write the file**

Create `src/features/admin/lib/dashboardWidgets/dashboardStacks.ts`:

```ts
import type {
  DashboardColSpan,
  DashboardLayout,
  DashboardWidgetPlacement,
} from "./dashboardCatalog";
import { DASHBOARD_COL_SPANS } from "./dashboardCatalog";
import {
  resolveRowPairSpans,
  type DashboardDropEdge,
} from "./dashboardDrop";

export type DashboardStack = {
  id: string;
  colSpan: DashboardColSpan;
  rowId: string;
  widgets: DashboardWidgetPlacement[];
};

export type DashboardStackRow = {
  stacks: DashboardStack[];
  gap: number;
  afterStackId: string | null;
  rowId: string;
};

function stackKey(widget: DashboardWidgetPlacement): string {
  return widget.stackId ?? `widget:${widget.id}`;
}

function newRowId(seed: string): string {
  return `row:${seed}`;
}

function stackRowId(widgets: DashboardWidgetPlacement[], stackId: string): string {
  const existing = widgets.find((w) => w.rowId)?.rowId;
  return existing || newRowId(stackId);
}

function omitLegacy(item: DashboardWidgetPlacement): DashboardWidgetPlacement {
  const next = { ...item };
  delete next.slotSpan;
  return next;
}

/** Greedy 12-col pack used only to seed missing rowIds. */
function packGreedyRows(stacks: DashboardStack[]): DashboardStackRow[] {
  const rows: DashboardStackRow[] = [];
  let current: DashboardStack[] = [];
  let used = 0;
  for (const stack of stacks) {
    if (used > 0 && used + stack.colSpan > 12) {
      rows.push({
        stacks: current,
        gap: 12 - used,
        afterStackId: current[current.length - 1]?.id ?? null,
        rowId: current[0]?.rowId ?? newRowId(`greedy-${rows.length}`),
      });
      current = [];
      used = 0;
    }
    current.push(stack);
    used += stack.colSpan;
  }
  if (current.length) {
    rows.push({
      stacks: current,
      gap: 12 - used,
      afterStackId: current[current.length - 1]?.id ?? null,
      rowId: current[0]?.rowId ?? newRowId(`greedy-${rows.length}`),
    });
  }
  return rows;
}

/**
 * Ensure every placement has a rowId. Existing ids are kept so shrink/gap
 * stays stable; missing ids are seeded from a one-time greedy pack.
 */
export function ensureDashboardRowIds(
  layout: DashboardLayout,
): DashboardLayout {
  if (layout.length === 0) return layout;
  if (layout.every((w) => typeof w.rowId === "string" && w.rowId.length > 0)) {
    return layout.map(omitLegacy);
  }

  const stacks = groupDashboardStacksRaw(layout);
  const seeded = packGreedyRows(stacks);
  const rowByWidgetId = new Map<string, string>();
  seeded.forEach((row, index) => {
    const rowId = `row-${index}`;
    for (const stack of row.stacks) {
      for (const widget of stack.widgets) {
        rowByWidgetId.set(widget.id, widget.rowId || rowId);
      }
    }
  });

  return layout.map((widget) => {
    const next = omitLegacy(widget);
    return {
      ...next,
      rowId:
        (typeof widget.rowId === "string" && widget.rowId) ||
        rowByWidgetId.get(widget.id) ||
        newRowId(widget.id),
    };
  });
}

function groupDashboardStacksRaw(
  layout: DashboardLayout,
): DashboardStack[] {
  const stacks = new Map<string, DashboardStack>();
  for (const widget of layout) {
    const id = stackKey(widget);
    const current = stacks.get(id);
    if (current) {
      current.widgets.push(widget);
      if (widget.colSpan > current.colSpan) current.colSpan = widget.colSpan;
      if (!current.rowId && widget.rowId) current.rowId = widget.rowId;
      continue;
    }
    stacks.set(id, {
      id,
      colSpan: widget.colSpan,
      rowId: stackRowId([widget], id),
      widgets: [widget],
    });
  }
  return [...stacks.values()];
}

export function groupDashboardStacks(
  layout: DashboardLayout,
): DashboardStack[] {
  return groupDashboardStacksRaw(ensureDashboardRowIds(layout));
}

function stackMembers(
  layout: DashboardLayout,
  widget: DashboardWidgetPlacement,
): string[] {
  const key = stackKey(widget);
  return layout.filter((item) => stackKey(item) === key).map((item) => item.id);
}

function setStackWidth(
  layout: DashboardLayout,
  ids: string[],
  colSpan: DashboardColSpan,
): DashboardLayout {
  const idSet = new Set(ids);
  return layout.map((item) =>
    idSet.has(item.id) ? { ...omitLegacy(item), colSpan } : omitLegacy(item),
  );
}

function insertInStack(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
  edge: "above" | "below",
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const dragged = base[fromIndex]!;
  const target = base[targetIndex]!;
  const targetStackId = target.stackId ?? `stack:${target.id}`;
  const rowId = target.rowId ?? newRowId(targetStackId);
  const without = base.filter((_, index) => index !== fromIndex);
  const targetAt = without.findIndex((item) => item.id === target.id);
  if (targetAt < 0) return layout;
  const insertAt = edge === "above" ? targetAt : targetAt + 1;
  const next = without.map((item) =>
    item.id === target.id ||
    (target.stackId != null && item.stackId === target.stackId)
      ? {
          ...omitLegacy(item),
          stackId: targetStackId,
          colSpan: target.colSpan,
          rowId,
        }
      : omitLegacy(item),
  );
  next.splice(insertAt, 0, {
    id: dragged.id,
    stackId: targetStackId,
    colSpan: target.colSpan,
    rowId,
    ...(dragged.heightPx != null ? { heightPx: dragged.heightPx } : {}),
  });
  return next;
}

function insertBesideStack(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
  edge: "left" | "right",
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const dragged = base[fromIndex]!;
  const target = base[targetIndex]!;
  if (stackKey(dragged) === stackKey(target)) return layout;

  const draggedIds = stackMembers(base, dragged);
  const targetIds = stackMembers(base, target);
  const draggedSet = new Set(draggedIds);
  const targetSet = new Set(targetIds);
  const rowId = target.rowId ?? newRowId(target.id);
  const sameRow =
    typeof dragged.rowId === "string" &&
    dragged.rowId.length > 0 &&
    dragged.rowId === target.rowId;

  const draggedBlock = base
    .filter((item) => draggedSet.has(item.id))
    .map((item) => omitLegacy(item));
  const without = base
    .filter((item) => !draggedSet.has(item.id))
    .map(omitLegacy);

  const targetPositions = targetIds
    .map((id) => without.findIndex((item) => item.id === id))
    .filter((index) => index >= 0);
  if (!targetPositions.length) return layout;

  const pair =
    edge === "left"
      ? resolveRowPairSpans(dragged.colSpan, target.colSpan)
      : resolveRowPairSpans(target.colSpan, dragged.colSpan);
  const targetWidth = sameRow
    ? target.colSpan
    : edge === "left"
      ? pair.right
      : pair.left;
  const draggedWidth = sameRow
    ? dragged.colSpan
    : edge === "left"
      ? pair.left
      : pair.right;

  const resized = setStackWidth(without, targetIds, targetWidth).map((item) =>
    targetSet.has(item.id) ? { ...item, rowId } : item,
  );
  const insertAt =
    edge === "left"
      ? Math.min(...targetPositions)
      : Math.max(...targetPositions) + 1;
  const moving = draggedBlock.map((item) => ({
    ...item,
    colSpan: draggedWidth,
    rowId,
  }));
  resized.splice(insertAt, 0, ...moving);
  return resized;
}

export function placeDashboardWidget(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
  edge: DashboardDropEdge,
): DashboardLayout {
  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    fromIndex >= layout.length ||
    targetIndex >= layout.length ||
    fromIndex === targetIndex
  ) {
    return layout;
  }
  return edge === "above" || edge === "below"
    ? insertInStack(layout, fromIndex, targetIndex, edge)
    : insertBesideStack(layout, fromIndex, targetIndex, edge);
}

export function placeDashboardWidgetBeside(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
): DashboardLayout {
  return placeDashboardWidget(layout, fromIndex, targetIndex, "left");
}

/** Drop into a stack's empty footer — append under the last widget. */
export function appendToDashboardStack(
  layout: DashboardLayout,
  fromId: string,
  stackId: string,
): DashboardLayout {
  const stack = groupDashboardStacks(layout).find((s) => s.id === stackId);
  const last = stack?.widgets[stack.widgets.length - 1];
  if (!last || last.id === fromId) return layout;
  const from = layout.findIndex((w) => w.id === fromId);
  const to = layout.findIndex((w) => w.id === last.id);
  if (from < 0 || to < 0) return layout;
  return placeDashboardWidget(layout, from, to, "below");
}

/** Drop into blank grid space — start a new solo stack on its own row. */
export function moveToNewDashboardStack(
  layout: DashboardLayout,
  fromId: string,
  colSpan: DashboardColSpan = 12,
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const from = base.findIndex((w) => w.id === fromId);
  if (from < 0) return layout;
  const dragged = base[from]!;
  const without = base.filter((_, i) => i !== from).map(omitLegacy);
  return [
    ...without,
    {
      id: dragged.id,
      colSpan,
      rowId: newRowId(`end-${dragged.id}`),
      ...(dragged.heightPx != null ? { heightPx: dragged.heightPx } : {}),
    },
  ];
}

/**
 * Pack stacks into rows by stable rowId.
 * Shrinking a widget leaves gap on its row — later rows never auto-fill it.
 */
export function packDashboardStackRows(
  stacks: DashboardStack[],
): DashboardStackRow[] {
  const rowOrder: string[] = [];
  const byRow = new Map<string, DashboardStack[]>();
  for (const stack of stacks) {
    const rowId = stack.rowId || newRowId(stack.id);
    if (!byRow.has(rowId)) {
      byRow.set(rowId, []);
      rowOrder.push(rowId);
    }
    byRow.get(rowId)!.push(stack);
  }

  return rowOrder.map((rowId) => {
    const rowStacks = byRow.get(rowId) ?? [];
    const used = rowStacks.reduce((sum, stack) => sum + stack.colSpan, 0);
    return {
      stacks: rowStacks,
      gap: Math.max(0, 12 - used),
      afterStackId: rowStacks[rowStacks.length - 1]?.id ?? null,
      rowId,
    };
  });
}

/** Largest allowed col span that fits in leftover row space (never 12). */
export function rowGapColSpan(gap: number): DashboardColSpan | null {
  if (gap < 3) return null;
  if (gap >= 9) return 9;
  if (gap >= 8) return 8;
  if (gap >= 6) return 6;
  if (gap >= 4) return 4;
  return 3;
}

/** Drop into leftover columns after a stack on the same row. */
export function placeInDashboardRowGap(
  layout: DashboardLayout,
  fromId: string,
  afterStackId: string,
  colSpan: DashboardColSpan,
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const stacks = groupDashboardStacks(base);
  const after = stacks.find((s) => s.id === afterStackId);
  const last = after?.widgets[after.widgets.length - 1];
  if (!last) return layout;
  const rowId = after.rowId;
  const from = base.findIndex((w) => w.id === fromId);
  if (from < 0) return layout;
  if (fromId === last.id && after.widgets.length === 1) {
    return base.map((item) =>
      item.id === fromId
        ? { ...omitLegacy(item), id: fromId, colSpan, rowId }
        : omitLegacy(item),
    );
  }
  const dragged = base[from]!;
  const without = base.filter((_, i) => i !== from).map(omitLegacy);
  const lastAt = without.findIndex((w) => w.id === last.id);
  if (lastAt < 0) return layout;
  without.splice(lastAt + 1, 0, {
    id: dragged.id,
    colSpan,
    rowId,
    ...(dragged.heightPx != null ? { heightPx: dragged.heightPx } : {}),
  });
  return without;
}

/**
 * Largest col span this widget's stack can take on its row without
 * pushing same-row neighbors (grow into that row's gap only).
 */
export function maxDashboardStackColSpan(
  layout: DashboardLayout,
  id: string,
): DashboardColSpan {
  const stacks = groupDashboardStacks(layout);
  const stack = stacks.find((s) => s.widgets.some((w) => w.id === id));
  if (!stack) return 12;
  const row = packDashboardStackRows(stacks).find((r) =>
    r.stacks.some((s) => s.id === stack.id),
  );
  if (!row) return 12;
  const others = row.stacks
    .filter((s) => s.id !== stack.id)
    .reduce((sum, s) => sum + s.colSpan, 0);
  const available = Math.max(stack.colSpan, 12 - others);
  return (
    [...DASHBOARD_COL_SPANS].reverse().find((span) => span <= available) ??
    stack.colSpan
  );
}

/** Resize a whole stack column; same-row neighbors stay put, gap can grow. */
export function resizeDashboardStack(
  layout: DashboardLayout,
  id: string,
  colSpan: DashboardColSpan,
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const widget = base.find((item) => item.id === id);
  if (!widget) return layout;
  const members = new Set(stackMembers(base, widget));
  const maxSpan = maxDashboardStackColSpan(base, id);
  const nextSpan = colSpan <= maxSpan ? colSpan : maxSpan;
  return base.map((item) => {
    const rest = omitLegacy(item);
    if (!members.has(item.id)) return rest;
    return { ...rest, colSpan: nextSpan };
  });
}
```

- [ ] **Step 2: Delete the old file**

```bash
rm src/features/admin/lib/dashboardStacks.ts
```

- [ ] **Step 3: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only from files still importing the old `./dashboardStacks`/`./dashboardLayoutCatalog` paths (fixed in later tasks). No error from the new file itself.

- [ ] **Step 4: Commit**

```bash
git status --short -- src/features/admin/lib/dashboardStacks.ts src/features/admin/lib/dashboardWidgets/dashboardStacks.ts
git add src/features/admin/lib/dashboardStacks.ts src/features/admin/lib/dashboardWidgets/dashboardStacks.ts
git commit -m "refactor(dashboard-widgets): move dashboardStacks.ts, widen widget ids to string"
```

---

### Task 5: Create the generic layout engine + move `dashboardLayoutHistory.ts`

**Files:**
- Create: `src/features/admin/lib/dashboardWidgets/dashboardLayout.ts`
- Create: `src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.ts`
- Test: `src/features/admin/lib/dashboardWidgets/dashboardLayout.test.ts` (new — tests the catalog-parameterized behavior directly, with a tiny stub catalog)
- Delete: `src/features/admin/lib/dashboardLayoutHistory.ts` (the old `dashboardLayout.ts` is deleted in Task 8, once Overview's bound wrapper exists to replace it — do not delete it yet)

**Interfaces:**
- Consumes: everything from Tasks 2–4 (`dashboardCatalog.ts`, `dashboardDrop.ts`, `dashboardStacks.ts`).
- Produces: `normalizeDashboardLayout(raw, catalog)`, `missingDashboardWidgets(layout, catalog, hidden?)`, `addDashboardWidget(layout, id, catalog)`, `removeDashboardWidget(layout, id)`, `resizeDashboardWidget(layout, id, colSpan, catalog)`, `resizeDashboardWidgetHeight(layout, id, heightPx)`, `moveDashboardWidget(layout, from, to)`, `cloneDashboardLayout(layout)`, `resolveBesideSpans(dragged, target)`; `LayoutHistory`, `emptyLayoutHistory`, `pushLayoutHistory`, `undoLayout`, `redoLayout`, `layoutsEqual`, `layoutHeightsEqual`. Consumed by Tasks 6, 7, 8, 20.

- [ ] **Step 1: Write the failing test for catalog-parameterized behavior**

Create `src/features/admin/lib/dashboardWidgets/dashboardLayout.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDashboardWidget,
  missingDashboardWidgets,
  normalizeDashboardLayout,
} from "./dashboardLayout";
import type { DashboardCatalog, DashboardWidgetMeta } from "./dashboardCatalog";

const STUB_META: Record<string, DashboardWidgetMeta> = {
  a: { id: "a", labelKey: "admin.overview.customize.sizeFull", defaultColSpan: 6, allowedColSpans: [3, 6, 12] },
  b: { id: "b", labelKey: "admin.overview.customize.sizeFull", defaultColSpan: 3, allowedColSpans: [3, 6, 12] },
};

const STUB_CATALOG: DashboardCatalog = {
  ids: ["a", "b"],
  meta: (id) => STUB_META[id]!,
  defaultLayout: [{ id: "a", colSpan: 6 }],
};

describe("normalizeDashboardLayout", () => {
  it("falls back to the catalog's default layout for invalid input", () => {
    const layout = normalizeDashboardLayout(null, STUB_CATALOG);
    assert.deepEqual(layout.map((w) => w.id), ["a"]);
  });

  it("drops ids not in the catalog", () => {
    const layout = normalizeDashboardLayout(
      [{ id: "a", colSpan: 6 }, { id: "unknown-widget", colSpan: 3 }],
      STUB_CATALOG,
    );
    assert.deepEqual(layout.map((w) => w.id), ["a"]);
  });

  it("clamps colSpan to the widget's allowed spans", () => {
    const layout = normalizeDashboardLayout(
      [{ id: "b", colSpan: 4 }],
      STUB_CATALOG,
    );
    assert.equal(layout[0]!.colSpan, 3);
  });
});

describe("missingDashboardWidgets", () => {
  it("lists catalog ids not present in the layout", () => {
    const missing = missingDashboardWidgets([{ id: "a", colSpan: 6 }], STUB_CATALOG);
    assert.deepEqual(missing, ["b"]);
  });

  it("excludes hidden ids", () => {
    const missing = missingDashboardWidgets([], STUB_CATALOG, ["b"]);
    assert.deepEqual(missing, ["a"]);
  });
});

describe("addDashboardWidget", () => {
  it("appends the widget at its catalog default colSpan", () => {
    const layout = addDashboardWidget([], "b", STUB_CATALOG);
    assert.equal(layout.length, 1);
    assert.equal(layout[0]!.id, "b");
    assert.equal(layout[0]!.colSpan, 3);
  });

  it("is a no-op if the widget is already present", () => {
    const layout = addDashboardWidget([{ id: "a", colSpan: 6, rowId: "r" }], "a", STUB_CATALOG);
    assert.equal(layout.length, 1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardWidgets/dashboardLayout.test.ts`
Expected: FAIL — `./dashboardLayout` does not exist yet in this directory.

- [ ] **Step 3: Write the generic layout engine**

Create `src/features/admin/lib/dashboardWidgets/dashboardLayout.ts`:

```ts
import {
  DASHBOARD_COL_SPANS,
  type DashboardCatalog,
  type DashboardColSpan,
  type DashboardLayout,
  type DashboardWidgetPlacement,
} from "./dashboardCatalog";
import { resolveRowPairSpans } from "./dashboardDrop";
import {
  ensureDashboardRowIds,
  resizeDashboardStack,
} from "./dashboardStacks";
import {
  parseDashboardWidgetHeight,
  clampDashboardWidgetHeight,
} from "./dashboardWidgetHeight";

export type { DashboardCatalog, DashboardColSpan, DashboardLayout, DashboardWidgetPlacement } from "./dashboardCatalog";
export { DASHBOARD_COL_SPANS, colSpanClass, colSpanLabelKey } from "./dashboardCatalog";
export type { DashboardDropEdge } from "./dashboardDrop";
export {
  compatibleRowSpans,
  dropEdgeFromRatios,
  exactRowPartners,
  resolveRowPairSpans,
} from "./dashboardDrop";
export {
  appendToDashboardStack,
  ensureDashboardRowIds,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  moveToNewDashboardStack,
  packDashboardStackRows,
  placeDashboardWidget,
  placeDashboardWidgetBeside,
  placeInDashboardRowGap,
  resizeDashboardStack,
  rowGapColSpan,
  type DashboardStack,
  type DashboardStackRow,
} from "./dashboardStacks";
export {
  clampDashboardWidgetHeight,
  DASHBOARD_WIDGET_HEIGHT_DEFAULT,
  DASHBOARD_WIDGET_HEIGHT_MAX,
  DASHBOARD_WIDGET_HEIGHT_MIN,
  nextDashboardWidgetHeightFromDrag,
  parseDashboardWidgetHeight,
} from "./dashboardWidgetHeight";

export function resolveBesideSpans(
  dragged: DashboardColSpan,
  target: DashboardColSpan,
): { dragged: DashboardColSpan; target: DashboardColSpan } {
  const row = resolveRowPairSpans(dragged, target);
  return { dragged: row.left, target: row.right };
}

const SPAN_SET = new Set<number>(DASHBOARD_COL_SPANS);

function clampColSpan(
  id: string,
  raw: unknown,
  catalog: DashboardCatalog,
): DashboardColSpan {
  const meta = catalog.meta(id);
  const n = typeof raw === "number" ? raw : meta.defaultColSpan;
  if (meta.allowedColSpans.includes(n as DashboardColSpan)) {
    return n as DashboardColSpan;
  }
  if (SPAN_SET.has(n)) {
    const closest = [...meta.allowedColSpans].sort(
      (a, b) => Math.abs(a - n) - Math.abs(b - n),
    )[0]!;
    return closest;
  }
  return meta.defaultColSpan;
}

/** Shallow-clone each placement so callers never mutate a stored default. */
export function cloneDashboardLayout(layout: DashboardLayout): DashboardLayout {
  return layout.map((w) => ({ ...w }));
}

/** Coerce unknown JSON into a valid, catalog-recognized, ordered layout. */
export function normalizeDashboardLayout(
  raw: unknown,
  catalog: DashboardCatalog,
): DashboardLayout {
  if (!Array.isArray(raw) || raw.length === 0) {
    return cloneDashboardLayout(catalog.defaultLayout);
  }
  const idSet = new Set(catalog.ids);
  const seen = new Set<string>();
  const out: DashboardLayout = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string" || !idSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    const colSpan = clampColSpan(id, (row as { colSpan?: unknown }).colSpan, catalog);
    const rawStackId = (row as { stackId?: unknown }).stackId;
    const rawRowId = (row as { rowId?: unknown }).rowId;
    const heightPx = parseDashboardWidgetHeight((row as { heightPx?: unknown }).heightPx);
    out.push({
      id,
      colSpan,
      ...(typeof rawStackId === "string" && rawStackId ? { stackId: rawStackId } : {}),
      ...(typeof rawRowId === "string" && rawRowId ? { rowId: rawRowId } : {}),
      ...(heightPx != null ? { heightPx } : {}),
    });
  }
  return ensureDashboardRowIds(
    out.length > 0 ? out : cloneDashboardLayout(catalog.defaultLayout),
  );
}

export function moveDashboardWidget(
  layout: DashboardLayout,
  fromIndex: number,
  toIndex: number,
): DashboardLayout {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= layout.length ||
    toIndex >= layout.length ||
    fromIndex === toIndex
  ) {
    return layout;
  }
  const next = [...layout];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return layout;
  next.splice(toIndex, 0, item);
  return next;
}

export function addDashboardWidget(
  layout: DashboardLayout,
  id: string,
  catalog: DashboardCatalog,
): DashboardLayout {
  if (layout.some((w) => w.id === id)) return layout;
  const meta = catalog.meta(id);
  return ensureDashboardRowIds([
    ...layout,
    { id, colSpan: meta.defaultColSpan, rowId: `row:new-${id}` },
  ]);
}

export function removeDashboardWidget(
  layout: DashboardLayout,
  id: string,
): DashboardLayout {
  return layout.filter((w) => w.id !== id);
}

export function resizeDashboardWidget(
  layout: DashboardLayout,
  id: string,
  colSpan: DashboardColSpan,
  catalog: DashboardCatalog,
): DashboardLayout {
  return resizeDashboardStack(layout, id, clampColSpan(id, colSpan, catalog));
}

export function resizeDashboardWidgetHeight(
  layout: DashboardLayout,
  id: string,
  heightPx: number,
): DashboardLayout {
  const next = clampDashboardWidgetHeight(heightPx);
  return layout.map((w) => (w.id === id ? { ...w, heightPx: next } : w));
}

export function missingDashboardWidgets(
  layout: DashboardLayout,
  catalog: DashboardCatalog,
  hiddenWidgetIds: readonly string[] = [],
): string[] {
  const present = new Set(layout.map((w) => w.id));
  const hidden = new Set(hiddenWidgetIds);
  return catalog.ids.filter((id) => !present.has(id) && !hidden.has(id));
}
```

Note: `normalizeDashboardLayout` intentionally drops the old file's legacy-bundle-expansion (`LEGACY_DASHBOARD_WIDGET_EXPAND`) and the short-lived `colStart` migration path — those were one-time data migrations for rows saved before this app's current layout format existed, not something a brand-new `dashboard_layouts` table or the generic engine needs to carry forward. Overview's OWN normalize function (Task 8) still applies that legacy expansion — it's Overview-specific data massaging that happens on top of the generic function, not inside it.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardWidgets/dashboardLayout.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Move `dashboardLayoutHistory.ts`**

Create `src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.ts` (identical to today's file, only the import path changes):

```ts
import {
  cloneDashboardLayout,
  type DashboardLayout,
} from "./dashboardLayout";

const HISTORY_LIMIT = 50;

export type LayoutHistory = {
  past: DashboardLayout[];
  future: DashboardLayout[];
};

export function emptyLayoutHistory(): LayoutHistory {
  return { past: [], future: [] };
}

export function pushLayoutHistory(
  history: LayoutHistory,
  current: DashboardLayout,
): LayoutHistory {
  return {
    past: [...history.past, cloneDashboardLayout(current)].slice(
      -HISTORY_LIMIT,
    ),
    future: [],
  };
}

export function undoLayout(
  history: LayoutHistory,
  current: DashboardLayout,
): { history: LayoutHistory; layout: DashboardLayout } | null {
  const prev = history.past[history.past.length - 1];
  if (!prev) return null;
  return {
    layout: cloneDashboardLayout(prev),
    history: {
      past: history.past.slice(0, -1),
      future: [cloneDashboardLayout(current), ...history.future].slice(
        0,
        HISTORY_LIMIT,
      ),
    },
  };
}

export function redoLayout(
  history: LayoutHistory,
  current: DashboardLayout,
): { history: LayoutHistory; layout: DashboardLayout } | null {
  const next = history.future[0];
  if (!next) return null;
  return {
    layout: cloneDashboardLayout(next),
    history: {
      past: [...history.past, cloneDashboardLayout(current)].slice(
        -HISTORY_LIMIT,
      ),
      future: history.future.slice(1),
    },
  };
}

export function layoutsEqual(a: DashboardLayout, b: DashboardLayout): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Compare widget ids + heightPx only (ignore colSpan/rowId drift from DB echo). */
export function layoutHeightsEqual(
  a: DashboardLayout,
  b: DashboardLayout,
): boolean {
  if (a.length !== b.length) return false;
  return a.every((widget, index) => {
    const other = b[index];
    return (
      !!other &&
      widget.id === other.id &&
      widget.heightPx === other.heightPx
    );
  });
}
```

Move the existing test file verbatim: `src/features/admin/lib/dashboardLayoutHistory.test.ts` → `src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.test.ts` (its import (`from "@/features/admin/lib/dashboardLayout"` or similar) needs updating to `from "@/features/admin/lib/dashboardWidgets/dashboardLayout"` — check the moved file's actual import line and fix it to the new path; the test bodies themselves stay unchanged).

- [ ] **Step 6: Delete the old history file, run the moved test**

```bash
rm src/features/admin/lib/dashboardLayoutHistory.ts
node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.test.ts
```
Expected: PASS (all tests, unchanged behavior)

- [ ] **Step 7: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only from files still importing old paths (`dashboardLayoutCatalog`, old `dashboardLayout`, old `dashboardLayoutHistory`) — fixed in Tasks 6–8.

- [ ] **Step 8: Commit**

```bash
git status --short -- src/features/admin/lib/dashboardLayoutHistory.ts src/features/admin/lib/dashboardLayoutHistory.test.ts src/features/admin/lib/dashboardWidgets/dashboardLayout.ts src/features/admin/lib/dashboardWidgets/dashboardLayout.test.ts src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.ts src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.test.ts
git add src/features/admin/lib/dashboardLayoutHistory.ts src/features/admin/lib/dashboardLayoutHistory.test.ts src/features/admin/lib/dashboardWidgets/dashboardLayout.ts src/features/admin/lib/dashboardWidgets/dashboardLayout.test.ts src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.ts src/features/admin/lib/dashboardWidgets/dashboardLayoutHistory.test.ts
git commit -m "feat(dashboard-widgets): add the catalog-parameterized generic layout engine"
```

---

### Task 6: Move and genericize `dashboardLayoutBridge.ts`

**Files:**
- Create: `src/features/admin/lib/dashboardWidgets/dashboardLayoutBridge.ts`
- Delete: `src/features/admin/lib/dashboardLayoutBridge.ts`

**Interfaces:**
- Consumes: `DashboardDropEdge` (Task 3).
- Produces: `DASHBOARD_LAYOUT_STATE_EVENT`, `DASHBOARD_LAYOUT_ACTION_EVENT`, `DashboardLayoutUiState` (now `missing: { id: string; labelKey: AnyMessageKey }[]`), `DashboardLayoutAction` (now `id`/`fromId`/`targetId: string`), `INACTIVE_DASHBOARD_LAYOUT_STATE`, `publishDashboardLayoutState`, `dispatchDashboardLayoutAction`. Consumed by Tasks 7, 8, 20. This is the one behavior change in the bridge (per the design: `missing` now carries labels, since the topbar can no longer import any specific page's catalog).

- [ ] **Step 1: Write the file**

Create `src/features/admin/lib/dashboardWidgets/dashboardLayoutBridge.ts`:

```ts
import type { AnyMessageKey } from "@/lib/i18n";
import type { DashboardDropEdge } from "./dashboardDrop";

export const DASHBOARD_LAYOUT_STATE_EVENT = "admin-dashboard-layout-state";
export const DASHBOARD_LAYOUT_ACTION_EVENT = "admin-dashboard-layout-action";

export type DashboardLayoutUiState = {
  active: boolean;
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  catalogOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  missing: { id: string; labelKey: AnyMessageKey }[];
};

export type DashboardLayoutAction =
  | { type: "toggleEdit" }
  | { type: "cancelEdit" }
  | { type: "save" }
  | { type: "reset" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "toggleCatalog" }
  | { type: "closeCatalog" }
  | { type: "add"; id: string }
  | {
      type: "move";
      fromId: string;
      targetId: string;
      edge: DashboardDropEdge;
    };

export const INACTIVE_DASHBOARD_LAYOUT_STATE: DashboardLayoutUiState = {
  active: false,
  editing: false,
  dirty: false,
  saving: false,
  catalogOpen: false,
  canUndo: false,
  canRedo: false,
  missing: [],
};

export function publishDashboardLayoutState(
  state: DashboardLayoutUiState,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_LAYOUT_STATE_EVENT, { detail: state }),
  );
}

export function dispatchDashboardLayoutAction(
  action: DashboardLayoutAction,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_LAYOUT_ACTION_EVENT, { detail: action }),
  );
}
```

- [ ] **Step 2: Delete the old file**

```bash
rm src/features/admin/lib/dashboardLayoutBridge.ts
```

- [ ] **Step 3: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only from files still importing the old path or still passing raw ids into `missing` (fixed in Tasks 7–8).

- [ ] **Step 4: Commit**

```bash
git status --short -- src/features/admin/lib/dashboardLayoutBridge.ts src/features/admin/lib/dashboardWidgets/dashboardLayoutBridge.ts
git add src/features/admin/lib/dashboardLayoutBridge.ts src/features/admin/lib/dashboardWidgets/dashboardLayoutBridge.ts
git commit -m "refactor(dashboard-widgets): move dashboardLayoutBridge.ts, carry widget labels in the missing list"
```

---

### Task 7: Move and genericize the UI components

**Files:**
- Create: `src/features/admin/components/dashboardWidgets/DashboardDropPlaceholder.tsx`
- Create: `src/features/admin/components/dashboardWidgets/DashboardWidgetHeightHandle.tsx`
- Create: `src/features/admin/components/dashboardWidgets/DashboardWidgetChrome.tsx`
- Create: `src/features/admin/components/dashboardWidgets/DashboardWidgetFrame.tsx`
- Create: `src/features/admin/components/dashboardWidgets/DashboardWidgetCatalog.tsx`
- Create: `src/features/admin/components/dashboardWidgets/DashboardLayoutTopbarControls.tsx`
- Delete: the six equivalents under `src/features/admin/components/overview/`

**Interfaces:**
- Consumes: `DashboardCatalog`, `DashboardWidgetMeta`, `DashboardColSpan`, `DashboardWidgetPlacement` (Task 2); `DashboardDropEdge` (Task 3); `dashboardEditChromeTransition` etc. (Task 1); the bridge (Task 6).
- Produces: same component names as today, with two behavior changes: `DashboardWidgetFrame`/`DashboardWidgetChrome` now take a `meta: DashboardWidgetMeta` prop instead of importing `widgetMeta`/looking it up themselves (the caller — each page's grid-rendering code — already has its own catalog in scope, so it passes `meta={catalog.meta(placement.id)}` down); `DashboardWidgetCatalog` renders `missing: { id: string; labelKey: AnyMessageKey }[]` directly, importing no catalog at all. Consumed by Tasks 8, 20, and by `AdminTopbar.tsx` (Task 9).

- [ ] **Step 1: Move `DashboardDropPlaceholder.tsx` and `DashboardWidgetHeightHandle.tsx` (no behavior change)**

Create `src/features/admin/components/dashboardWidgets/DashboardDropPlaceholder.tsx` (identical to today's file):

```tsx
"use client";

import { cn } from "@/lib/utils";

type Props = { className?: string; compact?: boolean };

export function DashboardDropPlaceholder({ className, compact }: Props) {
  return (
    <div
      className={cn(
        "rounded-md border-2 border-dashed border-[var(--admin-primary)]/40 bg-[var(--admin-primary)]/5",
        compact ? "min-h-8" : "min-h-16",
        className,
      )}
    />
  );
}
```

If the actual current file's JSX differs from the snippet above in any way, use the **actual current content** of `src/features/admin/components/overview/DashboardDropPlaceholder.tsx` verbatim instead — this file has no widget-id or catalog dependency, so it is a pure copy regardless of its exact markup.

Create `src/features/admin/components/dashboardWidgets/DashboardWidgetHeightHandle.tsx` with the exact current content of `src/features/admin/components/overview/DashboardWidgetHeightHandle.tsx`, changing only its three import paths:
- `from "@/features/admin/lib/dashboardWidgetHeight"` → `from "@/features/admin/lib/dashboardWidgets/dashboardWidgetHeight"`
- `from "@/features/admin/lib/dashboardDragScroll"` → `from "@/features/admin/lib/dashboardWidgets/dashboardDragScroll"`
- any other import stays as-is (it has no widget-id dependency — confirmed earlier: operates only on `heightPx: number` and callbacks).

- [ ] **Step 2: Move `DashboardWidgetChrome.tsx`, adding the `meta` prop**

Create `src/features/admin/components/dashboardWidgets/DashboardWidgetChrome.tsx`:

```tsx
"use client";

import type { CSSProperties, DragEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type {
  DashboardColSpan,
  DashboardWidgetMeta,
  DashboardWidgetPlacement,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import {
  dashboardEditChromeTransition,
  dashboardEditChromeVariants,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayoutMotion";
import { cn } from "@/lib/utils";

type Props = {
  placement: DashboardWidgetPlacement;
  meta: DashboardWidgetMeta;
  editing: boolean;
  dragging: boolean;
  maxColSpan: DashboardColSpan;
  onDragStart: (id: string, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onResize: (id: string, colSpan: DashboardColSpan) => void;
  onRemove: (id: string) => void;
  children: ReactNode;
};

const SIZE_CHIPS: { span: DashboardColSpan; label: string }[] = [
  { span: 3, label: "3" },
  { span: 4, label: "4" },
  { span: 6, label: "6" },
  { span: 8, label: "8" },
  { span: 9, label: "9" },
  { span: 12, label: "12" },
];

export function DashboardWidgetChrome({
  placement,
  meta,
  editing,
  dragging,
  maxColSpan,
  onDragStart,
  onDragEnd,
  onResize,
  onRemove,
  children,
}: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const transition = dashboardEditChromeTransition(reduced);
  const variants = dashboardEditChromeVariants(reduced);

  return (
    <div
      role={editing ? "listitem" : undefined}
      aria-label={editing ? t(meta.labelKey) : undefined}
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-md",
        editing && "ring-1 ring-[var(--admin-border)]",
        dragging && "opacity-30",
      )}
    >
      <AnimatePresence initial={false}>
        {editing ? (
          <motion.div
            key="toolbar"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="relative z-20 flex shrink-0 items-center gap-1 border-b border-[var(--admin-border)] bg-[var(--admin-panel)]/95 px-2 py-1 backdrop-blur-sm"
          >
            <div
              draggable
              data-dash-widget-drag-surface
              aria-label={t("admin.overview.customize.dragHandle")}
              className={cn(
                "rounded p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
                dragging ? "cursor-grabbing" : "cursor-grab",
              )}
              style={{ WebkitUserDrag: "element" } as CSSProperties}
              onDragStart={(e) => onDragStart(placement.id, e)}
              onDragEnd={onDragEnd}
            >
              <GripVertical className="size-4" aria-hidden />
            </div>
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--admin-text)]">
              {t(meta.labelKey)}
            </span>
            <div
              data-no-widget-drag
              role="group"
              aria-label={t("admin.overview.customize.size")}
              title={t("admin.overview.customize.sizeHint")}
              className="flex shrink-0 overflow-hidden rounded border border-[var(--admin-border)]"
            >
              {SIZE_CHIPS.filter((chip) =>
                meta.allowedColSpans.includes(chip.span),
              ).map((chip) => {
                const tooWide = chip.span > maxColSpan;
                return (
                  <button
                    key={chip.span}
                    type="button"
                    disabled={tooWide}
                    className={cn(
                      "min-w-7 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      tooWide
                        ? "cursor-not-allowed bg-[var(--admin-panel)] text-[var(--admin-muted)] opacity-40"
                        : "cursor-pointer",
                      !tooWide &&
                        (placement.colSpan === chip.span
                          ? "bg-[var(--admin-primary)] text-white"
                          : "bg-[var(--admin-panel)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"),
                    )}
                    onClick={() => onResize(placement.id, chip.span)}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              data-no-widget-drag
              aria-label={t("admin.overview.customize.remove")}
              className="cursor-pointer rounded p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-red-600"
              onClick={() => onRemove(placement.id)}
            >
              <Trash2 className="size-3.5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {editing ? (
          <div
            draggable
            data-dash-widget-drag-surface
            aria-hidden
            className={cn(
              "absolute inset-0 z-10",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
            style={{ WebkitUserDrag: "element" } as CSSProperties}
            onDragStart={(e) => onDragStart(placement.id, e)}
            onDragEnd={onDragEnd}
          />
        ) : null}
        <div
          className={cn(
            "relative z-0 flex min-h-0 flex-1 flex-col *:h-full *:min-h-0",
            editing && "pointer-events-none opacity-90",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
```

(Only changes from today's file: the `widgetMeta` import and call are removed; `meta` arrives as a prop instead; all `DashboardWidgetId` types become `string`.)

- [ ] **Step 3: Move `DashboardWidgetFrame.tsx`, threading the `meta` prop through**

Create `src/features/admin/components/dashboardWidgets/DashboardWidgetFrame.tsx`:

```tsx
"use client";

import { useRef, type DragEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type {
  DashboardColSpan,
  DashboardWidgetMeta,
  DashboardWidgetPlacement,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import type { DashboardDropEdge } from "@/features/admin/lib/dashboardWidgets/dashboardDrop";
import {
  dashboardEditChromeTransition,
  dashboardLayoutTransition,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayoutMotion";
import { DashboardDropPlaceholder } from "./DashboardDropPlaceholder";
import { DashboardWidgetChrome } from "./DashboardWidgetChrome";
import { DashboardWidgetHeightHandle } from "./DashboardWidgetHeightHandle";

type Props = {
  placement: DashboardWidgetPlacement;
  meta: DashboardWidgetMeta;
  editing: boolean;
  dragOver: boolean;
  dropEdge: DashboardDropEdge | null;
  dragging: boolean;
  maxColSpan?: DashboardColSpan;
  onDragStart: (id: string, event: DragEvent<HTMLElement>) => void;
  onDragOver: (id: string, event: DragEvent<HTMLElement>) => void;
  onDrop: (id: string, event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onResize: (id: string, colSpan: DashboardColSpan) => void;
  onRemove: (id: string) => void;
  onHeightChange: (id: string, heightPx: number) => void;
  onHeightCommit: () => void;
  children: ReactNode;
};

export function DashboardWidgetFrame({
  placement,
  meta,
  editing,
  dragOver,
  dropEdge,
  dragging,
  maxColSpan = 12,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResize,
  onRemove,
  onHeightChange,
  onHeightCommit,
  children,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const layoutTransition = dashboardLayoutTransition(reduced);
  const chromeTransition = dashboardEditChromeTransition(reduced);
  const heightPx = placement.heightPx;
  const showPlace = editing && dragOver && !dragging && dropEdge != null;
  const showAbove = showPlace && dropEdge === "above";
  const showBelow = showPlace && dropEdge === "below";
  const showLeft = showPlace && dropEdge === "left";
  const showRight = showPlace && dropEdge === "right";

  return (
    <motion.div
      layout={!dragging && !reduced}
      transition={layoutTransition}
      data-dash-widget-id={placement.id}
      className="flex h-full w-full min-w-0 flex-col [overflow-anchor:none]"
      onDragOver={
        editing
          ? (e) => {
              e.preventDefault();
              onDragOver(placement.id, e);
            }
          : undefined
      }
      onDrop={
        editing
          ? (e) => {
              e.preventDefault();
              onDrop(placement.id, e);
            }
          : undefined
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {showAbove ? <DashboardDropPlaceholder /> : null}
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-2">
          {showLeft ? (
            <DashboardDropPlaceholder className="min-w-[30%] flex-1" />
          ) : null}
          <div
            ref={bodyRef}
            data-dash-widget-body
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden [overflow-anchor:none] *:h-full *:min-h-0"
            style={heightPx != null ? { height: heightPx } : undefined}
          >
            <DashboardWidgetChrome
              placement={placement}
              meta={meta}
              editing={editing}
              dragging={dragging}
              maxColSpan={maxColSpan}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onResize={onResize}
              onRemove={onRemove}
            >
              {children}
            </DashboardWidgetChrome>
          </div>
          {showRight ? (
            <DashboardDropPlaceholder className="min-w-[30%] flex-1" />
          ) : null}
        </div>
        {showBelow ? <DashboardDropPlaceholder /> : null}
      </div>
      <AnimatePresence initial={false}>
        {editing ? (
          <motion.div
            key="height-handle"
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={chromeTransition}
          >
            <DashboardWidgetHeightHandle
              heightPx={heightPx}
              measureRef={bodyRef}
              onHeightChange={(h) => onHeightChange(placement.id, h)}
              onHeightCommit={onHeightCommit}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
```

- [ ] **Step 4: Move `DashboardWidgetCatalog.tsx`, dropping the catalog import**

Create `src/features/admin/components/dashboardWidgets/DashboardWidgetCatalog.tsx`:

```tsx
"use client";

import { Plus, X } from "lucide-react";
import type { AnyMessageKey } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n";

type MissingWidget = { id: string; labelKey: AnyMessageKey };

type CatalogProps = {
  missing: MissingWidget[];
  onAdd: (id: string) => void;
  onClose: () => void;
};

export function DashboardWidgetCatalog({
  missing,
  onAdd,
  onClose,
}: CatalogProps) {
  const t = useTranslations();
  return (
    <div className="absolute end-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-3 py-2">
        <p className="text-[12px] font-semibold text-[var(--admin-text)]">
          {t("admin.overview.customize.catalog")}
        </p>
        <button
          type="button"
          aria-label={t("admin.close")}
          className="rounded p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </button>
      </div>
      {missing.length === 0 ? (
        <p className="px-3 py-4 text-[12px] text-[var(--admin-muted)]">
          {t("admin.overview.customize.catalogEmpty")}
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto p-1">
          {missing.map((widget) => (
            <li key={widget.id}>
              <button
                type="button"
                data-dash-widget-catalog-item={widget.id}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-start text-[12px] text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
                onClick={() => onAdd(widget.id)}
              >
                <Plus className="size-3.5 shrink-0 text-[var(--admin-muted)]" />
                {t(widget.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Move `DashboardLayoutTopbarControls.tsx` (import path only, no logic change)**

Create `src/features/admin/components/dashboardWidgets/DashboardLayoutTopbarControls.tsx` with the exact current content of `src/features/admin/components/overview/DashboardLayoutTopbarControls.tsx`, changing only the two import paths:
- `from "@/features/admin/lib/dashboardLayoutBridge"` → `from "@/features/admin/lib/dashboardWidgets/dashboardLayoutBridge"`
- `from "@/features/admin/lib/dashboardLayoutMotion"` → `from "@/features/admin/lib/dashboardWidgets/dashboardLayoutMotion"`
- `from "./DashboardWidgetCatalog"` stays as `from "./DashboardWidgetCatalog"` (still a sibling in the new folder)

This component already just forwards `state.missing` straight into `<DashboardWidgetCatalog missing={state.missing} .../>` without inspecting its shape — since Task 6 changed `missing`'s type on the bridge, and Step 4 above changed `DashboardWidgetCatalog`'s prop type to match, this file needs **zero** logic changes, only the import-path fix.

- [ ] **Step 6: Delete the six old files**

```bash
rm src/features/admin/components/overview/DashboardDropPlaceholder.tsx src/features/admin/components/overview/DashboardWidgetHeightHandle.tsx src/features/admin/components/overview/DashboardWidgetChrome.tsx src/features/admin/components/overview/DashboardWidgetFrame.tsx src/features/admin/components/overview/DashboardWidgetCatalog.tsx src/features/admin/components/overview/DashboardLayoutTopbarControls.tsx
```

- [ ] **Step 7: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only in `ClinicDashboard.tsx` (doesn't yet pass `meta`, still imports old paths) and `AdminTopbar.tsx` (still imports the old `DashboardLayoutTopbarControls` path) — both fixed in Task 9.

- [ ] **Step 8: Commit**

```bash
git status --short -- src/features/admin/components/overview/DashboardDropPlaceholder.tsx src/features/admin/components/overview/DashboardWidgetHeightHandle.tsx src/features/admin/components/overview/DashboardWidgetChrome.tsx src/features/admin/components/overview/DashboardWidgetFrame.tsx src/features/admin/components/overview/DashboardWidgetCatalog.tsx src/features/admin/components/overview/DashboardLayoutTopbarControls.tsx src/features/admin/components/dashboardWidgets/
git add src/features/admin/components/overview/DashboardDropPlaceholder.tsx src/features/admin/components/overview/DashboardWidgetHeightHandle.tsx src/features/admin/components/overview/DashboardWidgetChrome.tsx src/features/admin/components/overview/DashboardWidgetFrame.tsx src/features/admin/components/overview/DashboardWidgetCatalog.tsx src/features/admin/components/overview/DashboardLayoutTopbarControls.tsx src/features/admin/components/dashboardWidgets/DashboardDropPlaceholder.tsx src/features/admin/components/dashboardWidgets/DashboardWidgetHeightHandle.tsx src/features/admin/components/dashboardWidgets/DashboardWidgetChrome.tsx src/features/admin/components/dashboardWidgets/DashboardWidgetFrame.tsx src/features/admin/components/dashboardWidgets/DashboardWidgetCatalog.tsx src/features/admin/components/dashboardWidgets/DashboardLayoutTopbarControls.tsx
git commit -m "refactor(dashboard-widgets): move the generic UI components, pass widget meta as a prop"
```

---

### Task 8: Genericize `useDashboardLayoutEditor`

**Files:**
- Modify: `src/features/admin/hooks/useDashboardLayoutEditor.ts`

**Interfaces:**
- Consumes: `DashboardCatalog`, `DashboardColSpan`, `DashboardLayout` (Task 2); every function from `dashboardWidgets/dashboardLayout.ts` (Task 5); `dashboardWidgets/dashboardLayoutHistory.ts` (Task 5); `dashboardWidgets/dashboardDragScroll.ts` (Task 1); `dashboardWidgets/dashboardLayoutBridge.ts` (Task 6).
- Produces: `useDashboardLayoutEditor(catalog: DashboardCatalog, initialLayout: DashboardLayout, save: (layout: DashboardLayout) => Promise<DashboardLayout>, hiddenWidgetIds: string[] = [])` — same return shape as today (`editing`, `catalogOpen`, `saving`, `dirty`, `layout`, `draft`, `canUndo`, `canRedo`, drag/drop handlers, `add`, `remove`, `resize`, `resizeHeight`, `commitHeight`, `undo`, `redo`, `reset`, `save`, `missing`), minus the `SiteSettings`-specific bits which move out to the caller. Consumed by Task 9 (`ClinicDashboard.tsx`) and Task 20 (`InventoryAnalyticsDashboard.tsx`).

The three real behavior changes here (per the design): (1) `initialSettings`/`settings` state and the direct `upsertSettings` call are removed — replaced by the injected `save` function and a `catalog` parameter; (2) every `missingDashboardWidgets(...)` call now passes `catalog` and maps the returned ids through `catalog.meta(id)` before publishing to the bridge (so `missing` carries labels); (3) `DashboardWidgetId` is `string` throughout. Everything else (undo/redo, drag state machine, height-resize gesture tracking) is unchanged.

- [ ] **Step 1: Rewrite the hook**

Replace the full contents of `src/features/admin/hooks/useDashboardLayoutEditor.ts`:

```ts
"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import {
  addDashboardWidget,
  appendToDashboardStack,
  cloneDashboardLayout,
  dropEdgeFromRatios,
  missingDashboardWidgets,
  moveToNewDashboardStack,
  normalizeDashboardLayout,
  placeDashboardWidget,
  placeInDashboardRowGap,
  removeDashboardWidget,
  resizeDashboardWidget,
  resizeDashboardWidgetHeight,
  type DashboardCatalog,
  type DashboardColSpan,
  type DashboardDropEdge,
  type DashboardLayout,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
import { createDragAutoScroll } from "@/features/admin/lib/dashboardWidgets/dashboardDragScroll";
import {
  emptyLayoutHistory,
  layoutsEqual,
  layoutHeightsEqual,
  pushLayoutHistory,
  redoLayout,
  undoLayout,
  type LayoutHistory,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayoutHistory";
import {
  DASHBOARD_LAYOUT_ACTION_EVENT,
  publishDashboardLayoutState,
  type DashboardLayoutAction,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayoutBridge";

type DropTarget =
  | { kind: "widget"; id: string; edge: DashboardDropEdge }
  | { kind: "stack"; stackId: string }
  | { kind: "gap"; afterStackId: string; colSpan: DashboardColSpan }
  | { kind: "end" };

export function useDashboardLayoutEditor(
  catalog: DashboardCatalog,
  initialLayout: DashboardLayout,
  save: (layout: DashboardLayout) => Promise<DashboardLayout>,
  hiddenWidgetIds: string[] = [],
) {
  const t = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedLayout, setSavedLayout] = useState(initialLayout);
  const [draft, setDraft] = useState(initialLayout);
  const [historyEpoch, setHistoryEpoch] = useState(0);
  const historyRef = useRef<LayoutHistory>(emptyLayoutHistory());
  const heightGestureRef = useRef(false);
  const skipInitialLayoutSyncRef = useRef(false);
  const dragFromRef = useRef<string | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const autoScrollRef = useRef(createDragAutoScroll());
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const [dragFromId, setDragFromId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropEdge, setDropEdge] = useState<DashboardDropEdge | null>(null);
  const [dragOverStackId, setDragOverStackId] = useState<string | null>(null);
  const [dragOverGapId, setDragOverGapId] = useState<string | null>(null);
  const [dragOverEnd, setDragOverEnd] = useState(false);

  const dirty = !layoutsEqual(draft, savedLayout);
  const layout = editing ? draft : savedLayout;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedLayoutRef = useRef(savedLayout);
  savedLayoutRef.current = savedLayout;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  void historyEpoch;

  function missingWithLabels(current: DashboardLayout) {
    return missingDashboardWidgets(current, catalog, hiddenWidgetIds).map(
      (id) => ({ id, labelKey: catalog.meta(id).labelKey }),
    );
  }

  useEffect(() => {
    // After Save/persist we already applied the upsert response. A follow-up
    // router.refresh() can briefly return a stale RSC layout and wipe heightPx
    // (and other just-saved fields) if we sync blindly.
    if (skipInitialLayoutSyncRef.current) {
      skipInitialLayoutSyncRef.current = false;
      return;
    }
    setSavedLayout(initialLayout);
    if (!editingRef.current) setDraft(initialLayout);
    historyRef.current = emptyLayoutHistory();
    setHistoryEpoch((n) => n + 1);
  }, [initialLayout]);

  useEffect(() => {
    const autoScroll = autoScrollRef.current;
    return () => autoScroll.stop();
  }, []);

  function clearHistory() {
    historyRef.current = emptyLayoutHistory();
    heightGestureRef.current = false;
    setHistoryEpoch((n) => n + 1);
  }

  function mutateDraft(
    recipe: (current: DashboardLayout) => DashboardLayout,
  ) {
    const current = draftRef.current;
    const next = recipe(current);
    if (layoutsEqual(next, current)) return;
    historyRef.current = pushLayoutHistory(historyRef.current, current);
    draftRef.current = next;
    setDraft(next);
    setHistoryEpoch((n) => n + 1);
  }

  function startEdit() {
    setDraft(cloneDashboardLayout(savedLayoutRef.current));
    draftRef.current = cloneDashboardLayout(savedLayoutRef.current);
    clearHistory();
    setEditing(true);
  }

  function cancelEdit() {
    if (
      dirtyRef.current &&
      !window.confirm(t("admin.overview.customize.discardConfirm"))
    ) {
      return;
    }
    setDraft(cloneDashboardLayout(savedLayoutRef.current));
    draftRef.current = cloneDashboardLayout(savedLayoutRef.current);
    clearHistory();
    setEditing(false);
    setCatalogOpen(false);
  }

  function toggleEdit() {
    if (editingRef.current) cancelEdit();
    else startEdit();
  }

  async function persist(next: DashboardLayout): Promise<DashboardLayout> {
    const toSave = normalizeDashboardLayout(next, catalog);
    const fromDb = normalizeDashboardLayout(await save(toSave), catalog);
    // Keep the client save if the echo is missing heights we just wrote.
    return layoutHeightsEqual(fromDb, toSave) ? fromDb : toSave;
  }

  async function saveEdit() {
    setSaving(true);
    try {
      heightGestureRef.current = false;
      const toSave = normalizeDashboardLayout(draftRef.current, catalog);
      draftRef.current = toSave;
      setDraft(toSave);
      const next = await persist(toSave);
      setSavedLayout(next);
      savedLayoutRef.current = next;
      setDraft(next);
      draftRef.current = next;
      clearHistory();
      setEditing(false);
      setCatalogOpen(false);
      toast.success(t("admin.overview.customize.saved"));
      skipInitialLayoutSyncRef.current = true;
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("admin.overview.customize.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  function undo() {
    const current = editingRef.current
      ? draftRef.current
      : savedLayoutRef.current;
    const result = undoLayout(historyRef.current, current);
    if (!result) return;
    historyRef.current = result.history;
    draftRef.current = result.layout;
    setDraft(result.layout);
    if (!editingRef.current) {
      savedLayoutRef.current = result.layout;
      setSavedLayout(result.layout);
      void persistInBackground(result.layout);
    }
    setHistoryEpoch((n) => n + 1);
  }

  function redo() {
    const current = editingRef.current
      ? draftRef.current
      : savedLayoutRef.current;
    const result = redoLayout(historyRef.current, current);
    if (!result) return;
    historyRef.current = result.history;
    draftRef.current = result.layout;
    setDraft(result.layout);
    if (!editingRef.current) {
      savedLayoutRef.current = result.layout;
      setSavedLayout(result.layout);
      void persistInBackground(result.layout);
    }
    setHistoryEpoch((n) => n + 1);
  }

  async function persistInBackground(next: DashboardLayout) {
    try {
      const normalized = await persist(next);
      setSavedLayout(normalized);
      savedLayoutRef.current = normalized;
      setDraft(normalized);
      draftRef.current = normalized;
      skipInitialLayoutSyncRef.current = true;
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("admin.overview.customize.saveFailed"),
      );
    }
  }

  function clearDragUi() {
    autoScrollRef.current.stop();
    dragFromRef.current = null;
    dropTargetRef.current = null;
    setDragFromId(null);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverStackId(null);
    setDragOverGapId(null);
    setDragOverEnd(false);
  }

  function sameRowNeighbor(fromId: string, toId: string): boolean {
    const layout = editingRef.current
      ? draftRef.current
      : savedLayoutRef.current;
    const from = layout.find((w) => w.id === fromId);
    const to = layout.find((w) => w.id === toId);
    if (!from?.rowId || !to?.rowId || from.rowId !== to.rowId) return false;
    const fromKey = from.stackId ?? `widget:${from.id}`;
    const toKey = to.stackId ?? `widget:${to.id}`;
    return fromKey !== toKey;
  }

  function edgeForWidgetDrop(
    fromId: string,
    toId: string,
    event: DragEvent<HTMLElement>,
  ): DashboardDropEdge {
    const host = event.currentTarget.closest("[data-dash-widget-id]");
    const body =
      host?.querySelector("[data-dash-widget-body]") ?? event.currentTarget;
    const rect = body.getBoundingClientRect();
    return dropEdgeFromRatios(
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
      rect.height / Math.max(rect.width, 1),
      sameRowNeighbor(fromId, toId),
    );
  }

  function setWidgetTarget(id: string, edge: DashboardDropEdge) {
    dropTargetRef.current = { kind: "widget", id, edge };
    setDragOverId(id);
    setDropEdge(edge);
    setDragOverStackId(null);
    setDragOverGapId(null);
    setDragOverEnd(false);
  }

  function setStackTarget(stackId: string) {
    dropTargetRef.current = { kind: "stack", stackId };
    setDragOverStackId(stackId);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverGapId(null);
    setDragOverEnd(false);
  }

  function setGapTarget(afterStackId: string, colSpan: DashboardColSpan) {
    dropTargetRef.current = { kind: "gap", afterStackId, colSpan };
    setDragOverGapId(afterStackId);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverStackId(null);
    setDragOverEnd(false);
  }

  function setEndTarget() {
    dropTargetRef.current = { kind: "end" };
    setDragOverEnd(true);
    setDragOverId(null);
    setDropEdge(null);
    setDragOverStackId(null);
    setDragOverGapId(null);
  }

  function commitDrop() {
    const fromId = dragFromRef.current;
    const target = dropTargetRef.current;
    if (!fromId || !target) {
      clearDragUi();
      return;
    }
    mutateDraft((d) => {
      if (target.kind === "stack") {
        return appendToDashboardStack(d, fromId, target.stackId);
      }
      if (target.kind === "gap") {
        return placeInDashboardRowGap(
          d,
          fromId,
          target.afterStackId,
          target.colSpan,
        );
      }
      if (target.kind === "end") {
        return moveToNewDashboardStack(d, fromId, 12);
      }
      return moveWidgetById(d, fromId, target.id, target.edge);
    });
    clearDragUi();
  }

  function moveWidgetById(
    d: DashboardLayout,
    fromId: string,
    targetId: string,
    edge: DashboardDropEdge,
  ): DashboardLayout {
    if (fromId === targetId) return d;
    const from = d.findIndex((w) => w.id === fromId);
    const to = d.findIndex((w) => w.id === targetId);
    if (from < 0 || to < 0 || from === to) return d;
    return placeDashboardWidget(d, from, to, edge);
  }

  function handleAction(action: DashboardLayoutAction) {
    switch (action.type) {
      case "toggleEdit":
        toggleEdit();
        break;
      case "cancelEdit":
        cancelEdit();
        break;
      case "save":
        void saveEdit();
        break;
      case "reset":
        mutateDraft(() => cloneDashboardLayout(catalog.defaultLayout));
        break;
      case "undo":
        undo();
        break;
      case "redo":
        redo();
        break;
      case "toggleCatalog":
        setCatalogOpen((v) => !v);
        break;
      case "closeCatalog":
        setCatalogOpen(false);
        break;
      case "move":
        mutateDraft((d) =>
          moveWidgetById(d, action.fromId, action.targetId, action.edge),
        );
        break;
      case "add":
        mutateDraft((d) => addDashboardWidget(d, action.id, catalog));
        setCatalogOpen(false);
        break;
    }
  }

  const handleActionRef = useRef(handleAction);
  handleActionRef.current = handleAction;

  useEffect(() => {
    publishDashboardLayoutState({
      active: true,
      editing,
      dirty,
      saving,
      catalogOpen,
      canUndo,
      canRedo,
      missing: missingWithLabels(draft),
    });
  }, [
    editing,
    dirty,
    saving,
    catalogOpen,
    canUndo,
    canRedo,
    draft,
    historyEpoch,
    hiddenWidgetIds,
  ]);

  useEffect(() => {
    function onAction(event: Event) {
      const detail = (event as CustomEvent<DashboardLayoutAction>).detail;
      if (detail) handleActionRef.current(detail);
    }
    window.addEventListener(DASHBOARD_LAYOUT_ACTION_EVENT, onAction);
    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_ACTION_EVENT, onAction);
      publishDashboardLayoutState({
        active: false,
        editing: false,
        dirty: false,
        saving: false,
        catalogOpen: false,
        canUndo: false,
        canRedo: false,
        missing: [],
      });
    };
  }, []);

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redoRef.current();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undoRef.current();
        return;
      }
      if (key === "y" && event.ctrlKey) {
        event.preventDefault();
        redoRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    editing,
    catalogOpen,
    saving,
    dirty,
    layout,
    draft,
    canUndo,
    canRedo,
    dragOverId,
    dropEdge,
    dragFromId,
    dragOverStackId,
    dragOverGapId,
    dragOverEnd,
    missing: missingWithLabels(draft),
    startEdit,
    cancelEdit,
    save: saveEdit,
    undo,
    redo,
    reset: () =>
      mutateDraft(() => cloneDashboardLayout(catalog.defaultLayout)),
    toggleCatalog: () => setCatalogOpen((v) => !v),
    closeCatalog: () => setCatalogOpen(false),
    add: (id: string) =>
      mutateDraft((d) => addDashboardWidget(d, id, catalog)),
    resize: (id: string, colSpan: DashboardColSpan) =>
      mutateDraft((d) => resizeDashboardWidget(d, id, colSpan, catalog)),
    resizeHeight: (id: string, heightPx: number) => {
      if (!editingRef.current) {
        const current = savedLayoutRef.current;
        if (!heightGestureRef.current) {
          historyRef.current = pushLayoutHistory(historyRef.current, current);
          heightGestureRef.current = true;
          setHistoryEpoch((n) => n + 1);
        }
        const next = resizeDashboardWidgetHeight(current, id, heightPx);
        savedLayoutRef.current = next;
        draftRef.current = next;
        setSavedLayout(next);
        setDraft(next);
        return;
      }
      if (!heightGestureRef.current) {
        heightGestureRef.current = true;
        mutateDraft((d) => resizeDashboardWidgetHeight(d, id, heightPx));
        return;
      }
      const next = resizeDashboardWidgetHeight(draftRef.current, id, heightPx);
      draftRef.current = next;
      setDraft(next);
    },
    commitHeight: () => {
      heightGestureRef.current = false;
      if (editingRef.current) return;
      void persistInBackground(savedLayoutRef.current);
    },
    remove: (id: string) =>
      mutateDraft((d) => removeDashboardWidget(d, id)),
    onDragStart: (id: string, event: DragEvent<HTMLElement>) => {
      const target = event.target as Element;
      if (target.closest("[data-no-widget-drag]")) {
        event.preventDefault();
        return;
      }
      dragFromRef.current = id;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      // Prefer the real card for the ghost — drag surfaces are empty overlays.
      const ghost =
        event.currentTarget
          .closest("[data-dash-widget-id]")
          ?.querySelector("[data-dash-widget-body]") ??
        event.currentTarget.closest("[data-dash-widget-id]") ??
        event.currentTarget;
      event.dataTransfer.setDragImage(ghost as Element, 24, 24);
      setDragFromId(id);
      dropTargetRef.current = null;
      setDragOverId(null);
      setDropEdge(null);
      setDragOverStackId(null);
      setDragOverGapId(null);
      setDragOverEnd(false);
      autoScrollRef.current.notePointer(event.clientY);
      autoScrollRef.current.start(event.currentTarget);
    },
    onDragOver: (id: string, event: DragEvent<HTMLElement>) => {
      const fromId = dragFromRef.current;
      if (!fromId || fromId === id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setWidgetTarget(id, edgeForWidgetDrop(fromId, id, event));
    },
    onDrop: (id: string, event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId = dragFromRef.current ?? event.dataTransfer.getData("text/plain");
      if (!fromId || fromId === id) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setWidgetTarget(id, edgeForWidgetDrop(fromId, id, event));
      commitDrop();
    },
    onStackDragOver: (stackId: string, event: DragEvent<HTMLElement>) => {
      if (!dragFromRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setStackTarget(stackId);
    },
    onStackDrop: (stackId: string, event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId = dragFromRef.current ?? event.dataTransfer.getData("text/plain");
      if (!fromId) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setStackTarget(stackId);
      commitDrop();
    },
    onGapDragOver: (
      afterStackId: string,
      colSpan: DashboardColSpan,
      event: DragEvent<HTMLElement>,
    ) => {
      if (!dragFromRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setGapTarget(afterStackId, colSpan);
    },
    onGapDrop: (
      afterStackId: string,
      colSpan: DashboardColSpan,
      event: DragEvent<HTMLElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId = dragFromRef.current ?? event.dataTransfer.getData("text/plain");
      if (!fromId) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setGapTarget(afterStackId, colSpan);
      commitDrop();
    },
    onEndDragOver: (event: DragEvent<HTMLElement>) => {
      if (!dragFromRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      autoScrollRef.current.notePointer(event.clientY);
      setEndTarget();
    },
    onEndDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const fromId = dragFromRef.current ?? event.dataTransfer.getData("text/plain");
      if (!fromId) {
        clearDragUi();
        return;
      }
      dragFromRef.current = fromId;
      setEndTarget();
      commitDrop();
    },
    onDragEnd: commitDrop,
  };
}
```

(Renamed the internal `save`/`persistLayout` functions to `saveEdit`/`persistInBackground`/`persist` to avoid clashing with the injected `save` parameter — the returned object's `save` key stays named `save` for the caller, matching today's API.)

- [ ] **Step 2: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only in `ClinicDashboard.tsx` (still calling the hook with the old 3-argument, settings-based signature) — fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git status --short -- src/features/admin/hooks/useDashboardLayoutEditor.ts
git add src/features/admin/hooks/useDashboardLayoutEditor.ts
git commit -m "feat(dashboard-widgets): genericize useDashboardLayoutEditor over a catalog + injected save"
```

---

### Task 9: Create the Overview bound layer

**Files:**
- Create: `src/features/admin/lib/overview/overviewDashboardCatalog.ts`
- Create: `src/features/admin/lib/overview/overviewDashboardLayout.ts`
- Delete: `src/features/admin/lib/dashboardLayoutCatalog.ts`, `src/features/admin/lib/dashboardLayout.ts`

**Interfaces:**
- Consumes: everything from `dashboardWidgets/` (Tasks 2–6).
- Produces: `OVERVIEW_WIDGET_IDS`, `OverviewWidgetId`, `OVERVIEW_WIDGET_CATALOG`, `OVERVIEW_CATALOG` (a `DashboardCatalog`), `DEFAULT_OVERVIEW_LAYOUT`, `overviewWidgetMeta`, plus the exact same function names Overview's call sites already import today (`normalizeDashboardLayout`, `missingDashboardWidgets`, `addDashboardWidget`, `removeDashboardWidget`, `resizeDashboardWidget`, `resizeDashboardWidgetHeight`, `moveDashboardWidget`, `cloneDashboardLayout`, `colSpanClass`, `colSpanLabelKey`, `groupDashboardStacks`, `packDashboardStackRows`, `maxDashboardStackColSpan`, the drop helpers) but each already bound to Overview's own catalog. Consumed by Task 10 (`ClinicDashboard.tsx`, `renderDashboardWidget.tsx`, `DashboardWidgetHost.tsx`).

- [ ] **Step 1: Write the catalog module**

Create `src/features/admin/lib/overview/overviewDashboardCatalog.ts` (identical widget ids/meta/default-layout data to today's `dashboardLayoutCatalog.ts`, restructured onto the generic `DashboardWidgetMeta`/`DashboardCatalog` types):

```ts
import type {
  DashboardCatalog,
  DashboardLayout,
  DashboardWidgetMeta,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import { DASHBOARD_COL_SPANS } from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";

export const OVERVIEW_WIDGET_IDS = [
  "attentionPending",
  "attentionToday",
  "attentionCancelled",
  "attentionNoShow",
  "kpiTodayVisits",
  "kpiPending",
  "kpiConfirmedWeek",
  "kpiServices",
  "kpiCancelled",
  "kpiNoShow",
  "kpiCompleted",
  "kpiTomorrow",
  "kpiWeekTotal",
  "kpiUnreadChats",
  "daySchedule",
  "bookings",
  "recent",
  "schedule",
  "messages",
  "listPending",
  "listToday",
  "listTopServices",
  "listNextAppointment",
  "chartVisitsWeek",
  "chartBookingMix",
  "chartStatus",
  "chartBusyHours",
  "chartDayTrend",
  "chartWeekCompare",
  "chartCancelRate",
  "chartServiceRank",
  "myProductionWeek",
  "chartBillingRevenue",
  "chartBillingMethodMix",
  "kpiOutstandingBalance",
  "kpiPendingPayments",
  "chartInventoryStockValue",
  "chartInventoryConsumption",
  "kpiLowStock",
  "kpiPendingApprovals",
] as const;

export type OverviewWidgetId = (typeof OVERVIEW_WIDGET_IDS)[number];

/** Old combined widgets → individual cards (normalize expands these). */
export const LEGACY_OVERVIEW_WIDGET_EXPAND: Record<
  string,
  readonly OverviewWidgetId[]
> = {
  attention: ["attentionPending", "attentionToday"],
  kpis: ["kpiTodayVisits", "kpiPending", "kpiConfirmedWeek", "kpiServices"],
  charts: [
    "chartVisitsWeek",
    "chartBookingMix",
    "chartStatus",
    "chartBusyHours",
    "chartDayTrend",
  ],
};

const ALL_SPANS = DASHBOARD_COL_SPANS;
const CARD = { defaultColSpan: 3 as const, allowedColSpans: ALL_SPANS };
const CHART = { defaultColSpan: 6 as const, allowedColSpans: ALL_SPANS };

export const OVERVIEW_WIDGET_CATALOG: readonly DashboardWidgetMeta[] = [
  { id: "attentionPending", labelKey: "admin.overview.widget.attentionPending", ...CARD },
  { id: "attentionToday", labelKey: "admin.overview.widget.attentionToday", ...CARD },
  { id: "attentionCancelled", labelKey: "admin.overview.widget.attentionCancelled", ...CARD },
  { id: "attentionNoShow", labelKey: "admin.overview.widget.attentionNoShow", ...CARD },
  { id: "kpiTodayVisits", labelKey: "admin.overview.widget.kpiTodayVisits", ...CARD },
  { id: "kpiPending", labelKey: "admin.overview.widget.kpiPending", ...CARD },
  { id: "kpiConfirmedWeek", labelKey: "admin.overview.widget.kpiConfirmedWeek", ...CARD },
  { id: "kpiServices", labelKey: "admin.overview.widget.kpiServices", ...CARD },
  { id: "kpiCancelled", labelKey: "admin.overview.widget.kpiCancelled", ...CARD },
  { id: "kpiNoShow", labelKey: "admin.overview.widget.kpiNoShow", ...CARD },
  { id: "kpiCompleted", labelKey: "admin.overview.widget.kpiCompleted", ...CARD },
  { id: "kpiTomorrow", labelKey: "admin.overview.widget.kpiTomorrow", ...CARD },
  { id: "kpiWeekTotal", labelKey: "admin.overview.widget.kpiWeekTotal", ...CARD },
  { id: "kpiUnreadChats", labelKey: "admin.overview.widget.kpiUnreadChats", ...CARD },
  { id: "daySchedule", labelKey: "admin.overview.widget.daySchedule", defaultColSpan: 12, allowedColSpans: ALL_SPANS },
  { id: "bookings", labelKey: "admin.overview.widget.bookings", ...CARD },
  { id: "recent", labelKey: "admin.overview.widget.recent", ...CARD },
  { id: "schedule", labelKey: "admin.overview.widget.schedule", ...CARD },
  { id: "messages", labelKey: "admin.overview.widget.messages", ...CARD },
  { id: "listPending", labelKey: "admin.overview.widget.listPending", ...CARD },
  { id: "listToday", labelKey: "admin.overview.widget.listToday", ...CARD },
  { id: "listTopServices", labelKey: "admin.overview.widget.listTopServices", ...CARD },
  { id: "listNextAppointment", labelKey: "admin.overview.widget.listNextAppointment", ...CARD },
  { id: "chartVisitsWeek", labelKey: "admin.overview.widget.chartVisitsWeek", ...CHART },
  { id: "chartBookingMix", labelKey: "admin.overview.widget.chartBookingMix", ...CHART },
  { id: "chartStatus", labelKey: "admin.overview.widget.chartStatus", ...CHART },
  { id: "chartBusyHours", labelKey: "admin.overview.widget.chartBusyHours", ...CHART },
  { id: "chartDayTrend", labelKey: "admin.overview.widget.chartDayTrend", defaultColSpan: 12, allowedColSpans: ALL_SPANS },
  { id: "chartWeekCompare", labelKey: "admin.overview.widget.chartWeekCompare", ...CHART },
  { id: "chartCancelRate", labelKey: "admin.overview.widget.chartCancelRate", ...CHART },
  { id: "chartServiceRank", labelKey: "admin.overview.widget.chartServiceRank", ...CHART },
  { id: "myProductionWeek", labelKey: "admin.overview.widget.myProductionWeek", ...CARD },
  { id: "chartBillingRevenue", labelKey: "admin.overview.widget.chartBillingRevenue", ...CHART },
  { id: "chartBillingMethodMix", labelKey: "admin.overview.widget.chartBillingMethodMix", ...CHART },
  { id: "kpiOutstandingBalance", labelKey: "admin.overview.widget.kpiOutstandingBalance", ...CARD },
  { id: "kpiPendingPayments", labelKey: "admin.overview.widget.kpiPendingPayments", ...CARD },
  { id: "chartInventoryStockValue", labelKey: "admin.overview.widget.chartInventoryStockValue", ...CHART },
  { id: "chartInventoryConsumption", labelKey: "admin.overview.widget.chartInventoryConsumption", ...CHART },
  { id: "kpiLowStock", labelKey: "admin.overview.widget.kpiLowStock", ...CARD },
  { id: "kpiPendingApprovals", labelKey: "admin.overview.widget.kpiPendingApprovals", ...CARD },
];

export function overviewWidgetMeta(id: string): DashboardWidgetMeta {
  return OVERVIEW_WIDGET_CATALOG.find((w) => w.id === id)!;
}

export const DEFAULT_OVERVIEW_LAYOUT: DashboardLayout = [
  { id: "attentionPending", colSpan: 3 },
  { id: "attentionToday", colSpan: 3 },
  { id: "kpiTodayVisits", colSpan: 3 },
  { id: "kpiPending", colSpan: 3 },
  { id: "kpiConfirmedWeek", colSpan: 3 },
  { id: "kpiServices", colSpan: 3 },
  { id: "daySchedule", colSpan: 12 },
  { id: "bookings", colSpan: 3 },
  { id: "recent", colSpan: 3 },
  { id: "schedule", colSpan: 3 },
  { id: "messages", colSpan: 3 },
  { id: "chartVisitsWeek", colSpan: 6 },
  { id: "chartBookingMix", colSpan: 6 },
  { id: "chartStatus", colSpan: 6 },
  { id: "chartBusyHours", colSpan: 6 },
  { id: "chartDayTrend", colSpan: 12 },
];

export const OVERVIEW_CATALOG: DashboardCatalog = {
  ids: OVERVIEW_WIDGET_IDS,
  meta: overviewWidgetMeta,
  defaultLayout: DEFAULT_OVERVIEW_LAYOUT,
};
```

- [ ] **Step 2: Write the bound-wrapper module**

Create `src/features/admin/lib/overview/overviewDashboardLayout.ts`:

```ts
import * as generic from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
import { ensureDashboardRowIds } from "@/features/admin/lib/dashboardWidgets/dashboardStacks";
import { parseDashboardWidgetHeight } from "@/features/admin/lib/dashboardWidgets/dashboardWidgetHeight";
import type {
  DashboardColSpan,
  DashboardLayout,
  DashboardWidgetPlacement,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import {
  DASHBOARD_COL_SPANS,
  DEFAULT_OVERVIEW_LAYOUT,
  LEGACY_OVERVIEW_WIDGET_EXPAND,
  OVERVIEW_CATALOG,
  OVERVIEW_WIDGET_CATALOG,
  OVERVIEW_WIDGET_IDS,
  overviewWidgetMeta,
  type OverviewWidgetId,
} from "./overviewDashboardCatalog";

export {
  DASHBOARD_COL_SPANS,
  DEFAULT_OVERVIEW_LAYOUT,
  DEFAULT_OVERVIEW_LAYOUT as DEFAULT_DASHBOARD_LAYOUT,
  OVERVIEW_CATALOG,
  OVERVIEW_WIDGET_CATALOG,
  OVERVIEW_WIDGET_CATALOG as DASHBOARD_WIDGET_CATALOG,
  OVERVIEW_WIDGET_IDS,
  OVERVIEW_WIDGET_IDS as DASHBOARD_WIDGET_IDS,
  overviewWidgetMeta,
  overviewWidgetMeta as widgetMeta,
  type OverviewWidgetId,
  type OverviewWidgetId as DashboardWidgetId,
};
export type { DashboardColSpan, DashboardLayout, DashboardWidgetPlacement, DashboardWidgetMeta } from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
export { colSpanClass, colSpanLabelKey, resolveBesideSpans } from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
export type { DashboardDropEdge } from "@/features/admin/lib/dashboardWidgets/dashboardDrop";
export { compatibleRowSpans, dropEdgeFromRatios, exactRowPartners, resolveRowPairSpans } from "@/features/admin/lib/dashboardWidgets/dashboardDrop";
export {
  appendToDashboardStack,
  ensureDashboardRowIds,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  moveToNewDashboardStack,
  packDashboardStackRows,
  placeDashboardWidget,
  placeDashboardWidgetBeside,
  placeInDashboardRowGap,
  resizeDashboardStack,
  rowGapColSpan,
  type DashboardStack,
  type DashboardStackRow,
} from "@/features/admin/lib/dashboardWidgets/dashboardStacks";

const ID_SET = new Set<string>(OVERVIEW_WIDGET_IDS);
const SPAN_SET = new Set<number>(DASHBOARD_COL_SPANS);

function isWidgetId(value: unknown): value is OverviewWidgetId {
  return typeof value === "string" && ID_SET.has(value);
}

function clampColSpan(id: OverviewWidgetId, raw: unknown): DashboardColSpan {
  const meta = overviewWidgetMeta(id);
  const n = typeof raw === "number" ? raw : meta.defaultColSpan;
  if (meta.allowedColSpans.includes(n as DashboardColSpan)) {
    return n as DashboardColSpan;
  }
  if (SPAN_SET.has(n)) {
    const closest = [...meta.allowedColSpans].sort(
      (a, b) => Math.abs(a - n) - Math.abs(b - n),
    )[0]!;
    return closest;
  }
  return meta.defaultColSpan;
}

function expandLegacyId(id: string): OverviewWidgetId[] {
  const expanded = LEGACY_OVERVIEW_WIDGET_EXPAND[id];
  if (expanded) return [...expanded];
  return isWidgetId(id) ? [id] : [];
}

export function cloneDashboardLayout(layout: DashboardLayout): DashboardLayout {
  return generic.cloneDashboardLayout(layout);
}

/**
 * Overview's own normalize keeps the legacy-bundle-expansion and colStart
 * migration the generic engine deliberately drops (those were one-time data
 * migrations for rows saved before the current layout format existed — not
 * something a brand-new page's storage needs to carry). Unchanged algorithm
 * from before this refactor, just resolved against OVERVIEW_WIDGET_CATALOG.
 */
export function normalizeDashboardLayout(raw: unknown): DashboardLayout {
  if (!Array.isArray(raw) || raw.length === 0) {
    return cloneDashboardLayout(DEFAULT_OVERVIEW_LAYOUT);
  }
  const seen = new Set<OverviewWidgetId>();
  const out: DashboardLayout = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string") continue;
    const colRaw = (row as { colSpan?: unknown }).colSpan;
    const legacyBundle = Object.prototype.hasOwnProperty.call(
      LEGACY_OVERVIEW_WIDGET_EXPAND,
      id,
    );
    for (const nextId of expandLegacyId(id)) {
      if (seen.has(nextId)) continue;
      seen.add(nextId);
      const colSpan = clampColSpan(
        nextId,
        legacyBundle ? overviewWidgetMeta(nextId).defaultColSpan : colRaw,
      );
      const rawStackId = (row as { stackId?: unknown }).stackId;
      const rawRowId = (row as { rowId?: unknown }).rowId;
      const heightPx = parseDashboardWidgetHeight(
        (row as { heightPx?: unknown }).heightPx,
      );
      const placement: DashboardWidgetPlacement = {
        id: nextId,
        colSpan,
        ...(typeof rawStackId === "string" && rawStackId ? { stackId: rawStackId } : {}),
        ...(typeof rawRowId === "string" && rawRowId ? { rowId: rawRowId } : {}),
        ...(heightPx != null ? { heightPx } : {}),
      };

      // Migrate the short-lived colStart format into a two-item stack.
      const oldColStart = (row as { colStart?: unknown }).colStart;
      if (
        placement.stackId == null &&
        typeof oldColStart === "number" &&
        Number.isFinite(oldColStart)
      ) {
        const anchor = [...out].reverse().find((item) => item.colSpan === colSpan);
        if (anchor) {
          const stackId = anchor.stackId ?? `stack:${anchor.id}`;
          anchor.stackId = stackId;
          placement.stackId = stackId;
        }
      }
      out.push(placement);
    }
  }
  return ensureDashboardRowIds(
    out.length > 0 ? out : cloneDashboardLayout(DEFAULT_OVERVIEW_LAYOUT),
  );
}

export function moveDashboardWidget(
  layout: DashboardLayout,
  fromIndex: number,
  toIndex: number,
): DashboardLayout {
  return generic.moveDashboardWidget(layout, fromIndex, toIndex);
}

export function addDashboardWidget(
  layout: DashboardLayout,
  id: OverviewWidgetId,
): DashboardLayout {
  return generic.addDashboardWidget(layout, id, OVERVIEW_CATALOG);
}

export function removeDashboardWidget(
  layout: DashboardLayout,
  id: OverviewWidgetId,
): DashboardLayout {
  return generic.removeDashboardWidget(layout, id);
}

export function resizeDashboardWidget(
  layout: DashboardLayout,
  id: OverviewWidgetId,
  colSpan: DashboardColSpan,
): DashboardLayout {
  return generic.resizeDashboardWidget(layout, id, colSpan, OVERVIEW_CATALOG);
}

export function resizeDashboardWidgetHeight(
  layout: DashboardLayout,
  id: OverviewWidgetId,
  heightPx: number,
): DashboardLayout {
  return generic.resizeDashboardWidgetHeight(layout, id, heightPx);
}

export function missingDashboardWidgets(
  layout: DashboardLayout,
  hiddenWidgetIds: readonly OverviewWidgetId[] = [],
): OverviewWidgetId[] {
  return generic.missingDashboardWidgets(
    layout,
    OVERVIEW_CATALOG,
    hiddenWidgetIds,
  ) as OverviewWidgetId[];
}
```

- [ ] **Step 3: Delete the old catalog/layout files**

```bash
rm src/features/admin/lib/dashboardLayoutCatalog.ts src/features/admin/lib/dashboardLayout.ts
```

- [ ] **Step 4: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only in `ClinicDashboard.tsx`, `renderDashboardWidget.tsx`, `DashboardWidgetHost.tsx`, `AdminTopbar.tsx`, and the old `dashboardLayout.test.ts` (all still importing the now-deleted `dashboardLayout`/`dashboardLayoutCatalog` paths) — fixed in Task 10.

- [ ] **Step 5: Commit**

```bash
git status --short -- src/features/admin/lib/dashboardLayoutCatalog.ts src/features/admin/lib/dashboardLayout.ts src/features/admin/lib/overview/
git add src/features/admin/lib/dashboardLayoutCatalog.ts src/features/admin/lib/dashboardLayout.ts src/features/admin/lib/overview/overviewDashboardCatalog.ts src/features/admin/lib/overview/overviewDashboardLayout.ts
git commit -m "feat(overview): add the Overview-bound wrapper over the generic dashboard-widget engine"
```

---

### Task 10: Migrate `ClinicDashboard.tsx` and its neighbors onto the bound layer

**Files:**
- Modify: `src/features/admin/components/overview/ClinicDashboard.tsx`
- Modify: `src/features/admin/components/overview/renderDashboardWidget.tsx`
- Modify: `src/features/admin/components/overview/DashboardWidgetHost.tsx`
- Modify: `src/features/admin/components/AdminTopbar.tsx`
- Move+adapt: `src/features/admin/lib/dashboardLayout.test.ts` → `src/features/admin/lib/overview/overviewDashboardLayout.test.ts`

**Interfaces:**
- Consumes: `OVERVIEW_CATALOG` and the bound wrapper (Task 9); `DashboardWidgetFrame`/`DashboardDropPlaceholder`/`DashboardLayoutTopbarControls` (Task 7); the genericized hook (Task 8).
- Produces: Overview's own dashboard rendering, fully migrated, behavior-preserving.

Read the **current, live content** of `ClinicDashboard.tsx` before editing (another session may have added fields to it since this plan was written — the design's Global Constraints section requires checking `git status`/re-reading before editing files other sessions touch). Apply the following changes on top of whatever is currently there; do not remove any props/fields you don't recognize — only change what's described below.

- [ ] **Step 1: Update imports**

Change the import block (locate by the `"use client";` line and the block of `@/features/admin/lib/dashboardLayout` /-`dashboardLayoutMotion` imports that follows it):

Old (imports relevant to this task; other imports in the file stay untouched):
```tsx
import { useMemo, useState } from "react";
...
import { useDashboardLayoutEditor } from "@/features/admin/hooks/useDashboardLayoutEditor";
import {
  colSpanClass,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  packDashboardStackRows,
  rowGapColSpan,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/features/admin/lib/dashboardLayout";
import {
  dashboardEditChromeTransition,
  dashboardEditSlotVariants,
  dashboardLayoutTransition,
} from "@/features/admin/lib/dashboardLayoutMotion";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardPageSkeleton } from "./DashboardPageSkeleton";
import { HomePatientClinicDrawer } from "./HomePatientClinicDrawer";
import { DashboardDropPlaceholder } from "./DashboardDropPlaceholder";
import { DashboardWidgetFrame } from "./DashboardWidgetFrame";
import { DashboardWidgetHost } from "./DashboardWidgetHost";
```

New:
```tsx
import { useMemo, useState, useEffect } from "react";
...
import { upsertSettings } from "@/services/site_settings";
import { useDashboardLayoutEditor } from "@/features/admin/hooks/useDashboardLayoutEditor";
import {
  colSpanClass,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  packDashboardStackRows,
  rowGapColSpan,
  OVERVIEW_CATALOG,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/features/admin/lib/overview/overviewDashboardLayout";
import {
  dashboardEditChromeTransition,
  dashboardEditSlotVariants,
  dashboardLayoutTransition,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayoutMotion";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardPageSkeleton } from "./DashboardPageSkeleton";
import { HomePatientClinicDrawer } from "./HomePatientClinicDrawer";
import { DashboardDropPlaceholder } from "@/features/admin/components/dashboardWidgets/DashboardDropPlaceholder";
import { DashboardWidgetFrame } from "@/features/admin/components/dashboardWidgets/DashboardWidgetFrame";
import { DashboardWidgetHost } from "./DashboardWidgetHost";
```

(`...` marks the other, unrelated imports already in the file — leave them exactly as they are; only the lines shown above change.)

- [ ] **Step 2: Extract settings state out of the hook and into the component**

Find the destructured props (where `settings,` and `initialLayout,` are destructured) and the block right after it that builds `hiddenWidgetIds`/`visibleInitialLayout`/calls `useDashboardLayoutEditor`. Change the prop destructuring's `settings,` to `settings: initialSettings,` (rename just this one destructured field — every other prop name in the destructuring list stays exactly as it already is, concurrent additions included), then change:

Old:
```tsx
  const hiddenWidgetIds = useMemo<DashboardWidgetId[]>(() => {
    const hidden: DashboardWidgetId[] = [];
    if (!canViewBilling) {
      hidden.push(
        "chartBillingRevenue",
        "chartBillingMethodMix",
        "kpiOutstandingBalance",
        "kpiPendingPayments",
      );
    }
    if (!canViewInventory) {
      hidden.push(
        "chartInventoryStockValue",
        "chartInventoryConsumption",
        "kpiLowStock",
        "kpiPendingApprovals",
      );
    }
    return hidden;
  }, [canViewBilling, canViewInventory]);
  const visibleInitialLayout = useMemo(
    () => initialLayout.filter((w) => !hiddenWidgetIds.includes(w.id)),
    [initialLayout, hiddenWidgetIds],
  );
  const editor = useDashboardLayoutEditor(
    settings,
    visibleInitialLayout,
    hiddenWidgetIds,
  );
```

New:
```tsx
  const [settings, setSettings] = useState(initialSettings);
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);
  const hiddenWidgetIds = useMemo<DashboardWidgetId[]>(() => {
    const hidden: DashboardWidgetId[] = [];
    if (!canViewBilling) {
      hidden.push(
        "chartBillingRevenue",
        "chartBillingMethodMix",
        "kpiOutstandingBalance",
        "kpiPendingPayments",
      );
    }
    if (!canViewInventory) {
      hidden.push(
        "chartInventoryStockValue",
        "chartInventoryConsumption",
        "kpiLowStock",
        "kpiPendingApprovals",
      );
    }
    return hidden;
  }, [canViewBilling, canViewInventory]);
  const visibleInitialLayout = useMemo(
    () => initialLayout.filter((w) => !hiddenWidgetIds.includes(w.id)),
    [initialLayout, hiddenWidgetIds],
  );
  async function saveOverviewLayout(
    layout: DashboardLayout,
  ): Promise<DashboardLayout> {
    const row = await upsertSettings(settings, { dashboard_layout: layout });
    setSettings(row);
    return (row.dashboard_layout ?? []) as DashboardLayout;
  }
  const editor = useDashboardLayoutEditor(
    OVERVIEW_CATALOG,
    visibleInitialLayout,
    saveOverviewLayout,
    hiddenWidgetIds,
  );
```

- [ ] **Step 3: Pass `meta` into `DashboardWidgetFrame`**

Find the `<DashboardWidgetFrame>` call inside the `stack.widgets.map((placement) => (...))` block and add one prop:

Old:
```tsx
                            <DashboardWidgetFrame
                              key={placement.id}
                              placement={placement}
                              editing={editor.editing}
```

New:
```tsx
                            <DashboardWidgetFrame
                              key={placement.id}
                              placement={placement}
                              meta={OVERVIEW_CATALOG.meta(placement.id)}
                              editing={editor.editing}
```

- [ ] **Step 4: Update `renderDashboardWidget.tsx` and `DashboardWidgetHost.tsx` import paths**

In `src/features/admin/components/overview/renderDashboardWidget.tsx`, find every import from `"@/features/admin/lib/dashboardLayout"` (there is exactly one, providing `type DashboardWidgetId`) and change it to `"@/features/admin/lib/overview/overviewDashboardLayout"`. No other change in this file — the switch statement, ctx type, and every case are untouched.

In `src/features/admin/components/overview/DashboardWidgetHost.tsx`, check for any import from `"@/features/admin/lib/dashboardLayout"` and update it the same way if present. If this file only imports `type DashboardWidgetId` from `"@/features/admin/lib/dashboardLayout"`, change that one import path to `"@/features/admin/lib/overview/overviewDashboardLayout"`.

- [ ] **Step 5: Update `AdminTopbar.tsx`**

Change:
```tsx
import { DashboardLayoutTopbarControls } from "./overview/DashboardLayoutTopbarControls";
```
to:
```tsx
import { DashboardLayoutTopbarControls } from "@/features/admin/components/dashboardWidgets/DashboardLayoutTopbarControls";
```
The `<DashboardLayoutTopbarControls />` usage elsewhere in the file is unchanged (no props).

- [ ] **Step 6: Move and adapt the layout test suite**

Move `src/features/admin/lib/dashboardLayout.test.ts` to `src/features/admin/lib/overview/overviewDashboardLayout.test.ts`. Change only its import line from:
```ts
import {
  DEFAULT_DASHBOARD_LAYOUT,
  ... (the rest of the imported names, unchanged)
} from "./dashboardLayout";
```
to:
```ts
import {
  DEFAULT_DASHBOARD_LAYOUT,
  ... (the same imported names, unchanged)
} from "./overviewDashboardLayout";
```
Every test body in the file stays byte-for-byte identical — this file already tests entirely through Overview-specific widget ids (`"kpiPending"`, `"listPending"`, `"chartWeekCompare"`, etc.), so it's already testing exactly what `overviewDashboardLayout.ts` now provides under the same names.

- [ ] **Step 7: Run the moved test suite**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/overview/overviewDashboardLayout.test.ts`
Expected: PASS (every test, unchanged) — this is the proof that the refactor preserved Overview's behavior exactly.

- [ ] **Step 8: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean. If anything still references a deleted path, fix that import — by this point every file in the codebase should be resolved.

- [ ] **Step 9: Commit**

```bash
git status --short -- src/features/admin/components/overview/ClinicDashboard.tsx src/features/admin/components/overview/renderDashboardWidget.tsx src/features/admin/components/overview/DashboardWidgetHost.tsx src/features/admin/components/AdminTopbar.tsx src/features/admin/lib/dashboardLayout.test.ts src/features/admin/lib/overview/overviewDashboardLayout.test.ts
git add src/features/admin/components/overview/ClinicDashboard.tsx src/features/admin/components/overview/renderDashboardWidget.tsx src/features/admin/components/overview/DashboardWidgetHost.tsx src/features/admin/components/AdminTopbar.tsx src/features/admin/lib/dashboardLayout.test.ts src/features/admin/lib/overview/overviewDashboardLayout.test.ts
git commit -m "refactor(overview): migrate ClinicDashboard and neighbors onto the generic dashboard-widget framework"
```

---

### Task 11: Part 1 checkpoint — full verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `bash scripts/test.sh`
Expected: every test passes, including all moved/adapted suites from Tasks 1–10.

- [ ] **Step 2: Full typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean.

- [ ] **Step 3: Manual browser regression check on Overview**

Start the dev server, sign in, open `/admin`. Confirm: existing widgets render exactly as before; "Customize layout" → "Add widget" still offers the same catalog (including the billing/inventory widgets from the prior feature); drag/resize/remove/undo/redo/save all still work; saved layout persists across a reload. This is a pure refactor — anything that looks different here is a regression to fix before moving to Part 2.

- [ ] **Step 4: Clean up any remaining dead files**

```bash
find src/features/admin/lib src/features/admin/components/overview -maxdepth 1 -iname "dashboardDrop*" -o -iname "dashboardStacks*" -o -iname "dashboardWidgetHeight*" -o -iname "dashboardLayoutMotion*" -o -iname "dashboardDragScroll*" -o -iname "dashboardLayoutBridge*" -o -iname "dashboardLayoutCatalog*" -o -iname "dashboardLayoutHistory*"
```
Expected: no output (everything under those old names was already deleted task-by-task; this is a final sweep). If anything is listed, it's a leftover from an earlier task — delete it, re-run typecheck/tests, and commit the cleanup.

---

## Part 2: Inventory Analytics page

### Task 12: `dashboard_layouts` migration + generated-type stub

**Files:**
- Create: `supabase/migrations/20260915260000_dashboard_layouts.sql`
- Modify: `src/lib/supabase/database.types.ts:1878-1879`

**Interfaces:**
- Produces: a `dashboard_layouts` table (`page_key text primary key, layout jsonb, updated_at timestamptz`) and a matching `Database["public"]["Tables"]["dashboard_layouts"]` entry so `.from("dashboard_layouts")` typechecks. Consumed by Task 13.

**This migration is not applied to the shared/production Supabase project in this task — writing the SQL file is safe and local. Applying it (Step 3, `supabase db push --linked`) modifies the live shared database and must be confirmed with the user before running.**

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260915260000_dashboard_layouts.sql`:

```sql
-- Per-page saved widget layouts for the generic customizable-dashboard
-- framework (see docs/superpowers/specs/2026-09-15-dashboard-widget-framework...).
-- Overview keeps its own storage (site_settings.dashboard_layout, unchanged);
-- every other page (starting with Inventory Analytics) gets one row here,
-- keyed by page_key, so adding a future page never needs another migration.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.dashboard_layouts;

CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  page_key   text PRIMARY KEY,
  layout     jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dashboard_layouts_admin_all ON public.dashboard_layouts;
CREATE POLICY dashboard_layouts_admin_all
  ON public.dashboard_layouts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

- [ ] **Step 2: Add the generated-type stub**

In `src/lib/supabase/database.types.ts`, find the `suppliers` table entry's closing brace followed immediately by the `notification_feature_switches` entry (search for the exact text `      notification_feature_switches: {` — the line right before it is the `suppliers` entry's closing `      }`). Insert a new entry between them:

Old:
```ts
        Relationships: []
      }
      notification_feature_switches: {
```

New:
```ts
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          layout: Json
          page_key: string
          updated_at: string
        }
        Insert: {
          layout?: Json
          page_key: string
          updated_at?: string
        }
        Update: {
          layout?: Json
          page_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_feature_switches: {
```

(This is a hand-written stub matching the exact shape convention every other entry in this generated file already uses. Once the migration is applied via `supabase db push --linked`, regenerate this file for real with `supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts` to replace this stub with the actual generator output — the shapes should match exactly, but the real regeneration is authoritative.)

- [ ] **Step 3: Confirm with the user, then apply the migration**

**Stop and ask the user before running this** — it modifies the shared/production Supabase project this app's `.env.local` points at:

```bash
supabase link --project-ref puibdsyokgjdvkkousil
supabase db push --linked
```

- [ ] **Step 4: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean (nothing references `dashboard_layouts` yet, so this just confirms the stub itself is syntactically valid).

- [ ] **Step 5: Commit**

```bash
git status --short -- supabase/migrations/20260915260000_dashboard_layouts.sql src/lib/supabase/database.types.ts
git add supabase/migrations/20260915260000_dashboard_layouts.sql src/lib/supabase/database.types.ts
git commit -m "feat(dashboard-layouts): add the dashboard_layouts table for per-page saved layouts"
```

---

### Task 13: `dashboard_layouts` service module

**Files:**
- Create: `src/services/dashboard_layouts/types.ts`
- Create: `src/services/dashboard_layouts/queries.ts`
- Create: `src/services/dashboard_layouts/mutations.ts`
- Create: `src/services/dashboard_layouts/actions.ts`

**Interfaces:**
- Consumes: `Tables<"dashboard_layouts">` (Task 12).
- Produces: `getDashboardLayout(supabase, pageKey): Promise<unknown>` (the raw `layout` JSON, or `null`), `upsertDashboardLayout(supabase, pageKey, layout): Promise<unknown>` (I/O mutation), `saveDashboardLayout(pageKey, layout): Promise<unknown>` (`"use server"`, `settings.edit`-gated action — this is what the Inventory Analytics page's `save` closure calls, mirroring exactly how Overview's `save` closure calls `upsertSettings`). Consumed by Task 21 (`InventoryAnalyticsDashboard.tsx`) and Task 22 (`page.tsx`).

- [ ] **Step 1: Write the types**

Create `src/services/dashboard_layouts/types.ts`:

```ts
import type { Tables } from "@/lib/supabase/database.types";

export type DashboardLayoutRow = Tables<"dashboard_layouts">;
```

- [ ] **Step 2: Write the queries**

Create `src/services/dashboard_layouts/queries.ts`:

```ts
import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

/** The raw saved layout JSON for a page, or null if nothing's been saved yet. */
export async function getDashboardLayout(
  supabase: ServerSupabase,
  pageKey: string,
): Promise<unknown> {
  const { data, error } = await supabase
    .from("dashboard_layouts")
    .select("layout")
    .eq("page_key", pageKey)
    .maybeSingle();
  if (error) throw error;
  return data?.layout ?? null;
}
```

- [ ] **Step 3: Write the mutation**

Create `src/services/dashboard_layouts/mutations.ts`:

```ts
import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

/** Upserts one page's layout by page_key, returning the persisted JSON. */
export async function upsertDashboardLayout(
  supabase: ServerSupabase,
  pageKey: string,
  layout: unknown,
): Promise<unknown> {
  const { data, error } = await supabase
    .from("dashboard_layouts")
    .upsert(
      { page_key: pageKey, layout, updated_at: new Date().toISOString() },
      { onConflict: "page_key" },
    )
    .select("layout")
    .single();
  if (error) throw error;
  return data.layout;
}
```

- [ ] **Step 4: Write the server action**

Create `src/services/dashboard_layouts/actions.ts`:

```ts
"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { upsertDashboardLayout } from "./mutations";

/** Same gate Overview's own layout save already goes through. */
export async function saveDashboardLayout(
  pageKey: string,
  layout: unknown,
): Promise<unknown> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return upsertDashboardLayout(auth.supabase, pageKey, layout);
}
```

- [ ] **Step 5: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git status --short -- src/services/dashboard_layouts/
git add src/services/dashboard_layouts/types.ts src/services/dashboard_layouts/queries.ts src/services/dashboard_layouts/mutations.ts src/services/dashboard_layouts/actions.ts
git commit -m "feat(dashboard-layouts): add the service module for per-page layout persistence"
```

---

### Task 14: Inventory Analytics snapshot queries — expiring soon, reorder suggestions

**Files:**
- Modify: `src/services/inventory/statsQueries.ts`
- Modify: `src/services/inventory/statsQueries.test.ts`

**Interfaces:**
- Consumes: existing `ServerSupabase` type already in the file.
- Produces: `ExpiringBatch = { batchId: string; itemName: string; itemNameAr: string; qtyRemaining: number; expiresOn: string; daysUntilExpiry: number }`, `listExpiringSoonBatches(supabase, now?, withinDays?): Promise<ExpiringBatch[]>`; `ReorderSuggestion = { itemId: string; itemName: string; itemNameAr: string; qtyOnHand: number; minStockLevel: number; reorderQty: number; supplierName: string | null }`, `buildReorderSuggestions(items, batches): ReorderSuggestion[]` (pure), `listReorderSuggestions(supabase): Promise<ReorderSuggestion[]>` (I/O). Consumed by Task 19 (chart/list components) and Task 22 (`page.tsx`).

- [ ] **Step 1: Write the failing tests**

Append to `src/services/inventory/statsQueries.test.ts` (after the existing `countItemsBelowThreshold` describe block), and add `buildReorderSuggestions` to the existing import line:

Change:
```ts
import {
  aggregateStockValueByCategory,
  countItemsBelowThreshold,
} from "./statsQueries";
```
to:
```ts
import {
  aggregateStockValueByCategory,
  buildReorderSuggestions,
  countItemsBelowThreshold,
  daysUntil,
} from "./statsQueries";
```

Append:
```ts

describe("daysUntil", () => {
  it("counts whole days between two dates", () => {
    const now = new Date(2026, 8, 15, 12, 0, 0);
    assert.equal(daysUntil("2026-09-20T00:00:00.000Z", now), 5);
  });

  it("returns 0 for a date in the past", () => {
    const now = new Date(2026, 8, 15, 12, 0, 0);
    assert.equal(daysUntil("2026-09-10T00:00:00.000Z", now), 0);
  });
});

describe("buildReorderSuggestions", () => {
  it("suggests items at or below their minimum stock level", () => {
    const items = [
      {
        id: "item-1",
        name: "Gauze",
        name_ar: "شاش",
        min_stock_level: 10,
        reorder_qty: 50,
        default_supplier: { name: "MedSupply" },
      },
      {
        id: "item-2",
        name: "Gloves",
        name_ar: "قفازات",
        min_stock_level: 5,
        reorder_qty: 20,
        default_supplier: null,
      },
    ];
    const batches = [
      { item_id: "item-1", qty_remaining: 4 },
      { item_id: "item-1", qty_remaining: 2 },
      { item_id: "item-2", qty_remaining: 20 },
    ];
    const suggestions = buildReorderSuggestions(items, batches);
    assert.deepEqual(suggestions, [
      {
        itemId: "item-1",
        itemName: "Gauze",
        itemNameAr: "شاش",
        qtyOnHand: 6,
        minStockLevel: 10,
        reorderQty: 50,
        supplierName: "MedSupply",
      },
    ]);
  });

  it("treats an item with no batches as zero on hand", () => {
    const items = [
      {
        id: "item-1",
        name: "Gauze",
        name_ar: "شاش",
        min_stock_level: 1,
        reorder_qty: 10,
        default_supplier: null,
      },
    ];
    const suggestions = buildReorderSuggestions(items, []);
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0]!.supplierName, null);
  });

  it("ignores items with no minimum stock level set", () => {
    const items = [
      { id: "item-1", name: "Gauze", name_ar: "شاش", min_stock_level: 0, reorder_qty: 10, default_supplier: null },
    ];
    assert.deepEqual(buildReorderSuggestions(items, []), []);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/inventory/statsQueries.test.ts`
Expected: FAIL — `buildReorderSuggestions` and `daysUntil` are not exported yet.

- [ ] **Step 3: Implement**

Append to `src/services/inventory/statsQueries.ts`:

```ts

export type ExpiringBatch = {
  batchId: string;
  itemName: string;
  itemNameAr: string;
  qtyRemaining: number;
  expiresOn: string;
  daysUntilExpiry: number;
};

/** Whole days from `now` until `isoDate`, floored at 0 for a date already past. */
export function daysUntil(isoDate: string, now = new Date()): number {
  const ms = new Date(isoDate).getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

/** Batches with stock left, expiring within `withinDays` (default 30), soonest first. */
export async function listExpiringSoonBatches(
  supabase: ServerSupabase,
  now = new Date(),
  withinDays = 30,
): Promise<ExpiringBatch[]> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + withinDays);
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("id, qty_remaining, expires_on, item:inventory_items(name, name_ar)")
    .gt("qty_remaining", 0)
    .not("expires_on", "is", null)
    .lte("expires_on", cutoff.toISOString())
    .order("expires_on", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    batchId: row.id,
    itemName: row.item?.name ?? "",
    itemNameAr: row.item?.name_ar ?? "",
    qtyRemaining: row.qty_remaining,
    expiresOn: row.expires_on!,
    daysUntilExpiry: daysUntil(row.expires_on!, now),
  }));
}

export type ReorderSuggestion = {
  itemId: string;
  itemName: string;
  itemNameAr: string;
  qtyOnHand: number;
  minStockLevel: number;
  reorderQty: number;
  supplierName: string | null;
};

type ReorderItemRow = {
  id: string;
  name: string;
  name_ar: string;
  min_stock_level: number;
  reorder_qty: number;
  default_supplier: { name: string } | null;
};
type ReorderBatchRow = { item_id: string; qty_remaining: number };

/** Items at/below their minimum stock level, with on-hand qty and a suggested reorder amount — pure, no I/O. */
export function buildReorderSuggestions(
  items: ReorderItemRow[],
  batches: ReorderBatchRow[],
): ReorderSuggestion[] {
  const onHand = new Map<string, number>();
  for (const batch of batches) {
    onHand.set(batch.item_id, (onHand.get(batch.item_id) ?? 0) + batch.qty_remaining);
  }
  return items
    .filter((item) => item.min_stock_level > 0)
    .map((item) => ({ item, qtyOnHand: onHand.get(item.id) ?? 0 }))
    .filter(({ item, qtyOnHand }) => qtyOnHand <= item.min_stock_level)
    .map(({ item, qtyOnHand }) => ({
      itemId: item.id,
      itemName: item.name,
      itemNameAr: item.name_ar,
      qtyOnHand,
      minStockLevel: item.min_stock_level,
      reorderQty: item.reorder_qty,
      supplierName: item.default_supplier?.name ?? null,
    }));
}

/** Items at/below their minimum stock level, clinic-wide, with a suggested reorder quantity. */
export async function listReorderSuggestions(
  supabase: ServerSupabase,
): Promise<ReorderSuggestion[]> {
  const [itemsRes, batchesRes] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, name_ar, min_stock_level, reorder_qty, default_supplier:suppliers(name)")
      .is("deleted_at", null)
      .gt("min_stock_level", 0),
    supabase.from("inventory_batches").select("item_id, qty_remaining"),
  ]);
  if (itemsRes.error) throw itemsRes.error;
  if (batchesRes.error) throw batchesRes.error;
  return buildReorderSuggestions(
    (itemsRes.data ?? []) as unknown as ReorderItemRow[],
    batchesRes.data ?? [],
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/inventory/statsQueries.test.ts`
Expected: PASS (all tests in the file, including the new ones)

- [ ] **Step 5: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git status --short -- src/services/inventory/statsQueries.ts src/services/inventory/statsQueries.test.ts
git add src/services/inventory/statsQueries.ts src/services/inventory/statsQueries.test.ts
git commit -m "feat(inventory): add expiring-soon and reorder-suggestion queries"
```

---

### Task 15: Inventory Analytics period queries — top consumed items, wastage by reason, supplier spend

**Files:**
- Modify: `src/services/inventory/statsQueries.ts`
- Modify: `src/services/inventory/statsQueries.test.ts`

**Interfaces:**
- Consumes: existing `ServerSupabase` type.
- Produces: `TopConsumedItem = { itemId: string; itemName: string; itemNameAr: string; cost: number }`, `aggregateTopConsumedItems(rows): TopConsumedItem[]` (pure), `listTopConsumedItems(supabase, from, to): Promise<TopConsumedItem[]>`; `WastageByReason = { reasonCode: string; cost: number }`, `aggregateWastageByReason(rows): WastageByReason[]` (pure), `listWastageByReason(supabase, from, to): Promise<WastageByReason[]>`; `SupplierSpend = { supplierId: string; supplierName: string; cost: number }`, `aggregateSupplierSpend(rows): SupplierSpend[]` (pure), `listSupplierSpend(supabase, from, to): Promise<SupplierSpend[]>`. Consumed by Task 19 and Task 22.

- [ ] **Step 1: Write the failing tests**

Change the import line in `src/services/inventory/statsQueries.test.ts` again:
```ts
import {
  aggregateStockValueByCategory,
  aggregateSupplierSpend,
  aggregateTopConsumedItems,
  aggregateWastageByReason,
  buildReorderSuggestions,
  countItemsBelowThreshold,
  daysUntil,
} from "./statsQueries";
```

Append:
```ts

describe("aggregateTopConsumedItems", () => {
  it("sums cost per item, highest first", () => {
    const rows = [
      { item_id: "a", total_cost_egp: 50, item: { name: "Gauze", name_ar: "شاش" } },
      { item_id: "b", total_cost_egp: 300, item: { name: "Anesthetic", name_ar: "مخدر" } },
      { item_id: "a", total_cost_egp: 25, item: { name: "Gauze", name_ar: "شاش" } },
    ];
    assert.deepEqual(aggregateTopConsumedItems(rows), [
      { itemId: "b", itemName: "Anesthetic", itemNameAr: "مخدر", cost: 300 },
      { itemId: "a", itemName: "Gauze", itemNameAr: "شاش", cost: 75 },
    ]);
  });

  it("returns an empty list for no rows", () => {
    assert.deepEqual(aggregateTopConsumedItems([]), []);
  });
});

describe("aggregateWastageByReason", () => {
  it("sums cost per reason code, highest first", () => {
    const rows = [
      { reason_code: "expired", total_cost_egp: 40 },
      { reason_code: "dropped_contaminated", total_cost_egp: 120 },
      { reason_code: "expired", total_cost_egp: 10 },
    ];
    assert.deepEqual(aggregateWastageByReason(rows), [
      { reasonCode: "dropped_contaminated", cost: 120 },
      { reasonCode: "expired", cost: 50 },
    ]);
  });

  it("buckets a missing reason code as other", () => {
    const rows = [{ reason_code: null, total_cost_egp: 15 }];
    assert.deepEqual(aggregateWastageByReason(rows), [{ reasonCode: "other", cost: 15 }]);
  });
});

describe("aggregateSupplierSpend", () => {
  it("sums cost per supplier, highest first", () => {
    const rows = [
      { total_cost_egp: 200, batch: { supplier_id: "s1", supplier: { name: "MedSupply" } } },
      { total_cost_egp: 500, batch: { supplier_id: "s2", supplier: { name: "DentaCo" } } },
      { total_cost_egp: 100, batch: { supplier_id: "s1", supplier: { name: "MedSupply" } } },
    ];
    assert.deepEqual(aggregateSupplierSpend(rows), [
      { supplierId: "s2", supplierName: "DentaCo", cost: 500 },
      { supplierId: "s1", supplierName: "MedSupply", cost: 300 },
    ]);
  });

  it("groups a missing or deleted supplier as unknown", () => {
    const rows = [
      { total_cost_egp: 80, batch: { supplier_id: null, supplier: null } },
      { total_cost_egp: 20, batch: null },
    ];
    assert.deepEqual(aggregateSupplierSpend(rows), [
      { supplierId: "unknown", supplierName: null, cost: 100 },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/inventory/statsQueries.test.ts`
Expected: FAIL — the three new `aggregate*` functions aren't exported yet.

- [ ] **Step 3: Implement**

Append to `src/services/inventory/statsQueries.ts`:

```ts

export type TopConsumedItem = { itemId: string; itemName: string; itemNameAr: string; cost: number };

type ConsumptionItemRow = {
  item_id: string;
  total_cost_egp: number;
  item: { name: string; name_ar: string } | null;
};

/** Sums consumption cost per item, highest first — pure, no I/O. */
export function aggregateTopConsumedItems(rows: ConsumptionItemRow[]): TopConsumedItem[] {
  const totals = new Map<string, { cost: number; name: string; nameAr: string }>();
  for (const row of rows) {
    const existing = totals.get(row.item_id);
    const name = row.item?.name ?? "";
    const nameAr = row.item?.name_ar ?? "";
    totals.set(row.item_id, {
      cost: (existing?.cost ?? 0) + row.total_cost_egp,
      name: existing?.name ?? name,
      nameAr: existing?.nameAr ?? nameAr,
    });
  }
  return [...totals.entries()]
    .map(([itemId, v]) => ({ itemId, itemName: v.name, itemNameAr: v.nameAr, cost: v.cost }))
    .sort((a, b) => b.cost - a.cost);
}

/** Items consumed (type='consumption') in an inclusive ISO date range, ranked by cost. */
export async function listTopConsumedItems(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<TopConsumedItem[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("item_id, total_cost_egp, item:inventory_items(name, name_ar)")
    .eq("type", "consumption")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw error;
  return aggregateTopConsumedItems((data ?? []) as unknown as ConsumptionItemRow[]);
}

export type WastageByReason = { reasonCode: string; cost: number };

type WastageRow = { reason_code: string | null; total_cost_egp: number };

/** Sums wastage cost per reason code, highest first, missing code bucketed as "other" — pure, no I/O. */
export function aggregateWastageByReason(rows: WastageRow[]): WastageByReason[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const code = row.reason_code ?? "other";
    totals.set(code, (totals.get(code) ?? 0) + row.total_cost_egp);
  }
  return [...totals.entries()]
    .map(([reasonCode, cost]) => ({ reasonCode, cost }))
    .sort((a, b) => b.cost - a.cost);
}

/** Wastage (type='wastage') in an inclusive ISO date range, ranked by reason. */
export async function listWastageByReason(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<WastageByReason[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("reason_code, total_cost_egp")
    .eq("type", "wastage")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw error;
  return aggregateWastageByReason(data ?? []);
}

export type SupplierSpend = { supplierId: string; supplierName: string | null; cost: number };

type RestockRow = {
  total_cost_egp: number;
  batch: { supplier_id: string | null; supplier: { name: string } | null } | null;
};

/** Sums restock cost per supplier, highest first — a missing/deleted supplier groups as "unknown" — pure, no I/O. */
export function aggregateSupplierSpend(rows: RestockRow[]): SupplierSpend[] {
  const totals = new Map<string, { cost: number; name: string | null }>();
  for (const row of rows) {
    const supplierId = row.batch?.supplier_id ?? "unknown";
    const existing = totals.get(supplierId);
    totals.set(supplierId, {
      cost: (existing?.cost ?? 0) + row.total_cost_egp,
      name: existing?.name ?? row.batch?.supplier?.name ?? null,
    });
  }
  return [...totals.entries()]
    .map(([supplierId, v]) => ({ supplierId, supplierName: v.name, cost: v.cost }))
    .sort((a, b) => b.cost - a.cost);
}

/** Restock spend (type='restock') in an inclusive ISO date range, ranked by supplier. Joins the batch's actual supplier — not an item's default reorder supplier, which can differ. */
export async function listSupplierSpend(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<SupplierSpend[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("total_cost_egp, batch:inventory_batches(supplier_id, supplier:suppliers(name))")
    .eq("type", "restock")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw error;
  return aggregateSupplierSpend((data ?? []) as unknown as RestockRow[]);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/inventory/statsQueries.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 5: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git status --short -- src/services/inventory/statsQueries.ts src/services/inventory/statsQueries.test.ts
git add src/services/inventory/statsQueries.ts src/services/inventory/statsQueries.test.ts
git commit -m "feat(inventory): add top-consumed-items, wastage-by-reason, and supplier-spend queries"
```

---

### Task 16: Consumption-trend chart pure builder

**Files:**
- Create: `src/features/admin/lib/inventoryAnalyticsStats.ts`
- Test: `src/features/admin/lib/inventoryAnalyticsStats.test.ts`

**Interfaces:**
- Consumes: `WeekConsumptionRow` from `@/services/inventory/statsQueries` (already exists — `listWeekConsumptionRows` already takes an arbitrary `from`/`to`, reused as-is for this page too, no rename).
- Produces: `ConsumptionTrendPoint = { label: string; amount: number }`, `buildConsumptionTrendChart(rows, from, to): ConsumptionTrendPoint[]`. Consumed by Task 19, Task 22.

This is deliberately a **new, separate** function from Overview's `buildWeekConsumptionChart` (`dashboardInventoryStats.ts`) rather than a generalization of it — Overview buckets a fixed Monday–Sunday calendar week; this page buckets a rolling N-day window ending today. Same-shaped output, different alignment, so sharing one function would conflate two different semantics for no real benefit.

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/lib/inventoryAnalyticsStats.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildConsumptionTrendChart } from "./inventoryAnalyticsStats";
import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

describe("buildConsumptionTrendChart", () => {
  it("buckets cost into one point per day across the range, inclusive", () => {
    const from = new Date(2026, 8, 1, 0, 0, 0);
    const to = new Date(2026, 8, 3, 23, 59, 59);
    const rows: WeekConsumptionRow[] = [
      { date: new Date(2026, 8, 1, 10, 0, 0).toISOString(), cost: 100 },
      { date: new Date(2026, 8, 3, 9, 0, 0).toISOString(), cost: 40 },
      { date: new Date(2026, 8, 3, 15, 0, 0).toISOString(), cost: 10 },
    ];
    const chart = buildConsumptionTrendChart(rows, from, to);
    assert.equal(chart.length, 3);
    assert.equal(chart[0]!.amount, 100);
    assert.equal(chart[1]!.amount, 0);
    assert.equal(chart[2]!.amount, 50);
  });

  it("returns an all-zero range for no transactions", () => {
    const from = new Date(2026, 8, 1);
    const to = new Date(2026, 8, 2);
    assert.deepEqual(
      buildConsumptionTrendChart([], from, to).map((d) => d.amount),
      [0, 0],
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/inventoryAnalyticsStats.test.ts`
Expected: FAIL — `./inventoryAnalyticsStats` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/admin/lib/inventoryAnalyticsStats.ts`:

```ts
import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

export type ConsumptionTrendPoint = { label: string; amount: number };

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daySpan(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000)) + 1;
}

/** Consumption cost (EGP) per day across [from, to] inclusive — a rolling window, not calendar-aligned. */
export function buildConsumptionTrendChart(
  rows: WeekConsumptionRow[],
  from: Date,
  to: Date,
): ConsumptionTrendPoint[] {
  const start = startOfDay(from);
  const days = Math.max(1, daySpan(from, to));
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const amount = rows
      .filter((row) => isSameDay(new Date(row.date), day))
      .reduce((sum, row) => sum + row.cost, 0);
    return {
      label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      amount,
    };
  });
}
```

(The label format is `"Sep 1"` rather than a weekday name — unlike Overview's 7-bar weekly charts, a 30/90-bar chart spans multiple weeks, so a weekday name alone would be ambiguous and a month+day label is what a reader needs to place a bar in time.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/inventoryAnalyticsStats.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git status --short -- src/features/admin/lib/inventoryAnalyticsStats.ts src/features/admin/lib/inventoryAnalyticsStats.test.ts
git add src/features/admin/lib/inventoryAnalyticsStats.ts src/features/admin/lib/inventoryAnalyticsStats.test.ts
git commit -m "feat(inventory-analytics): add the consumption-trend chart builder"
```

---

### Task 17: Date-range filter (30d / 90d presets)

**Files:**
- Create: `src/features/admin/lib/inventoryAnalyticsFilters.ts`
- Create: `src/features/admin/lib/useInventoryAnalyticsFilterQuery.ts`
- Test: `src/features/admin/lib/inventoryAnalyticsFilters.test.ts`

**Interfaces:**
- Consumes: `nuqs/server` (`createSearchParamsCache`, `parseAsStringLiteral`), `nuqs` (`useQueryStates`).
- Produces: `InventoryAnalyticsRange` (`"30d" | "90d"`), `inventoryAnalyticsFilterParsers`, `inventoryAnalyticsFiltersCache`, `rangeDays(range): number`, `resolveInventoryAnalyticsRange(range, now?): { from: string; to: string }`; client hook `useInventoryAnalyticsFilterQuery()`. Consumed by Task 21 (picker UI) and Task 22 (`page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/lib/inventoryAnalyticsFilters.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rangeDays, resolveInventoryAnalyticsRange } from "./inventoryAnalyticsFilters";

describe("rangeDays", () => {
  it("maps the two presets to their day counts", () => {
    assert.equal(rangeDays("30d"), 30);
    assert.equal(rangeDays("90d"), 90);
  });
});

describe("resolveInventoryAnalyticsRange", () => {
  it("resolves 30d to a 30-day window ending today", () => {
    const now = new Date(2026, 8, 15, 14, 0, 0);
    const { from, to } = resolveInventoryAnalyticsRange("30d", now);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    assert.equal(fromDate.getDate(), 17); // Aug 17 — 30 days before Sep 15 inclusive
    assert.equal(fromDate.getMonth(), 7);
    assert.equal(toDate.getDate(), 15);
    assert.equal(toDate.getMonth(), 8);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/inventoryAnalyticsFilters.test.ts`
Expected: FAIL — `./inventoryAnalyticsFilters` does not exist yet.

- [ ] **Step 3: Write the server-side filter module**

Create `src/features/admin/lib/inventoryAnalyticsFilters.ts`:

```ts
import { createSearchParamsCache, parseAsStringLiteral } from "nuqs/server";

export const INVENTORY_ANALYTICS_RANGE_VALUES = ["30d", "90d"] as const;
export type InventoryAnalyticsRange = (typeof INVENTORY_ANALYTICS_RANGE_VALUES)[number];

export const inventoryAnalyticsFilterParsers = {
  range: parseAsStringLiteral(INVENTORY_ANALYTICS_RANGE_VALUES).withDefault("30d"),
};

export const inventoryAnalyticsFiltersCache = createSearchParamsCache(
  inventoryAnalyticsFilterParsers,
);

export function rangeDays(range: InventoryAnalyticsRange): number {
  return range === "90d" ? 90 : 30;
}

/** A [from, to] ISO window of `rangeDays(range)` days, ending at the end of `now`'s day. */
export function resolveInventoryAnalyticsRange(
  range: InventoryAnalyticsRange,
  now = new Date(),
): { from: string; to: string } {
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setDate(from.getDate() - (rangeDays(range) - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/inventoryAnalyticsFilters.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the client hook**

Create `src/features/admin/lib/useInventoryAnalyticsFilterQuery.ts`:

```ts
"use client";

import { useQueryStates } from "nuqs";
import { inventoryAnalyticsFilterParsers } from "@/features/admin/lib/inventoryAnalyticsFilters";

export function useInventoryAnalyticsFilterQuery() {
  const [filters, setFilters] = useQueryStates(inventoryAnalyticsFilterParsers, {
    shallow: false,
    history: "replace",
  });
  return { filters, setFilters };
}
```

- [ ] **Step 6: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git status --short -- src/features/admin/lib/inventoryAnalyticsFilters.ts src/features/admin/lib/inventoryAnalyticsFilters.test.ts src/features/admin/lib/useInventoryAnalyticsFilterQuery.ts
git add src/features/admin/lib/inventoryAnalyticsFilters.ts src/features/admin/lib/inventoryAnalyticsFilters.test.ts src/features/admin/lib/useInventoryAnalyticsFilterQuery.ts
git commit -m "feat(inventory-analytics): add the 30d/90d date-range filter"
```

---

### Task 18: Inventory Analytics catalog module

**Files:**
- Create: `src/features/admin/lib/inventoryAnalyticsCatalog.ts`

**Interfaces:**
- Consumes: `DashboardCatalog`, `DashboardWidgetMeta` (Task 2).
- Produces: `INVENTORY_ANALYTICS_WIDGET_IDS`, `InventoryAnalyticsWidgetId`, `INVENTORY_ANALYTICS_WIDGET_CATALOG`, `inventoryAnalyticsWidgetMeta`, `DEFAULT_INVENTORY_ANALYTICS_LAYOUT`, `INVENTORY_ANALYTICS_CATALOG` (a `DashboardCatalog`). Consumed by Task 20 (render switch) and Task 21 (page component).

- [ ] **Step 1: Write the file**

Create `src/features/admin/lib/inventoryAnalyticsCatalog.ts`:

```ts
import type {
  DashboardCatalog,
  DashboardLayout,
  DashboardWidgetMeta,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import { DASHBOARD_COL_SPANS } from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";

export const INVENTORY_ANALYTICS_WIDGET_IDS = [
  "consumptionTrend",
  "topConsumedItems",
  "wastageByReason",
  "supplierSpend",
  "expiringSoon",
  "reorderSuggestions",
] as const;

export type InventoryAnalyticsWidgetId =
  (typeof INVENTORY_ANALYTICS_WIDGET_IDS)[number];

const ALL_SPANS = DASHBOARD_COL_SPANS;

export const INVENTORY_ANALYTICS_WIDGET_CATALOG: readonly DashboardWidgetMeta[] = [
  {
    id: "consumptionTrend",
    labelKey: "admin.inventoryAnalytics.widget.consumptionTrend",
    defaultColSpan: 12,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "topConsumedItems",
    labelKey: "admin.inventoryAnalytics.widget.topConsumedItems",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "supplierSpend",
    labelKey: "admin.inventoryAnalytics.widget.supplierSpend",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "wastageByReason",
    labelKey: "admin.inventoryAnalytics.widget.wastageByReason",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "expiringSoon",
    labelKey: "admin.inventoryAnalytics.widget.expiringSoon",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "reorderSuggestions",
    labelKey: "admin.inventoryAnalytics.widget.reorderSuggestions",
    defaultColSpan: 12,
    allowedColSpans: ALL_SPANS,
  },
];

export function inventoryAnalyticsWidgetMeta(id: string): DashboardWidgetMeta {
  return INVENTORY_ANALYTICS_WIDGET_CATALOG.find((w) => w.id === id)!;
}

/** All 6 widgets ship by default — this page exists to show them, unlike Overview's opt-in extras. */
export const DEFAULT_INVENTORY_ANALYTICS_LAYOUT: DashboardLayout = [
  { id: "consumptionTrend", colSpan: 12 },
  { id: "topConsumedItems", colSpan: 6 },
  { id: "supplierSpend", colSpan: 6 },
  { id: "wastageByReason", colSpan: 6 },
  { id: "expiringSoon", colSpan: 6 },
  { id: "reorderSuggestions", colSpan: 12 },
];

export const INVENTORY_ANALYTICS_CATALOG: DashboardCatalog = {
  ids: INVENTORY_ANALYTICS_WIDGET_IDS,
  meta: inventoryAnalyticsWidgetMeta,
  defaultLayout: DEFAULT_INVENTORY_ANALYTICS_LAYOUT,
};
```

- [ ] **Step 2: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only about the not-yet-added `admin.inventoryAnalytics.widget.*` i18n keys (Task 23 adds them) — no other error.

- [ ] **Step 3: Commit**

```bash
git status --short -- src/features/admin/lib/inventoryAnalyticsCatalog.ts
git add src/features/admin/lib/inventoryAnalyticsCatalog.ts
git commit -m "feat(inventory-analytics): add the widget catalog"
```

---

### Task 19: Chart and list components

**Files:**
- Create: `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsTrendChart.tsx`
- Create: `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsRankedLists.tsx`
- Create: `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsWastageChart.tsx`
- Create: `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsSnapshotLists.tsx`

**Interfaces:**
- Consumes: `ConsumptionTrendPoint` (Task 16); `TopConsumedItem`, `SupplierSpend`, `WastageByReason`, `ExpiringBatch`, `ReorderSuggestion` (Tasks 14–15); `REASON_LABEL_KEYS`, `localizedItemName` (existing `@/services/inventory/i18nMaps`).
- Produces: `ChartConsumptionTrend`, `ListTopConsumedItems`, `ListSupplierSpend`, `ChartWastageByReason`, `ListExpiringSoon`, `ListReorderSuggestions` React components. Consumed by Task 20 (render switch).

No unit tests — presentational client components, verified visually in Task 24. Colors for the wastage donut reuse the exact same dataviz-skill-validated 6-hue order already used for Overview's payment-method-mix chart (`#2a78d6/#eb6834/#1baf7a/#eda100/#e87ba4/#008300`) — same validated palette, a different semantic domain, never rendered on screen at the same time as the payment-method chart.

- [ ] **Step 1: Create the trend chart**

Create `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsTrendChart.tsx`:

```tsx
"use client";

import type { ConsumptionTrendPoint } from "@/features/admin/lib/inventoryAnalyticsStats";
import { useTranslations } from "@/lib/i18n";

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

export function ChartConsumptionTrend({
  trend,
}: {
  trend: ConsumptionTrendPoint[];
}) {
  const t = useTranslations();
  const max = Math.max(...trend.map((item) => item.amount), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.consumptionTrend")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.consumptionTrendDesc")}
      </p>
      <div className="flex min-h-[12rem] min-w-0 flex-1 items-end gap-px overflow-x-auto">
        {trend.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="relative h-full min-w-[3px] flex-1"
            title={`${item.label}: ${formatEgp(item.amount)}`}
          >
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end">
              <div
                className="w-full min-h-0.5 rounded-t-sm"
                style={{
                  height: `${Math.max(item.amount === 0 ? 2 : 6, (item.amount / max) * 100)}%`,
                  background: "var(--admin-primary)",
                  opacity: item.amount === 0 ? 0.2 : 1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex shrink-0 justify-between text-[10px] text-[var(--admin-muted)]">
        <span>{trend[0]?.label}</span>
        <span>{trend[trend.length - 1]?.label}</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the ranked-list components**

Create `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsRankedLists.tsx`:

```tsx
"use client";

import type { SupplierSpend, TopConsumedItem } from "@/services/inventory/statsQueries";
import { useLocale, useTranslations } from "@/lib/i18n";
import { localizedItemName } from "@/services/inventory/i18nMaps";

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

export function ListTopConsumedItems({
  items,
}: {
  items: TopConsumedItem[];
}) {
  const t = useTranslations();
  const { locale } = useLocale();
  const rows = items.slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.cost));

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.topConsumedItems")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.topConsumedItemsDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.topConsumedItemsEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((item, index) => (
            <li key={item.itemId} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--admin-text)]">
                    {localizedItemName(locale === "ar" ? "ar" : "en", item.itemName, item.itemNameAr)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatEgp(item.cost)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-primary)]"
                    style={{ width: `${(item.cost / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ListSupplierSpend({
  suppliers,
}: {
  suppliers: SupplierSpend[];
}) {
  const t = useTranslations();
  const rows = suppliers.slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.cost));

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.supplierSpend")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.supplierSpendDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.supplierSpendEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((row, index) => (
            <li key={row.supplierId} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--admin-text)]">
                    {row.supplierName ?? t("admin.inventoryAnalytics.chart.unknownSupplier")}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatEgp(row.cost)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-primary)]"
                    style={{ width: `${(row.cost / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Create the wastage donut**

Create `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsWastageChart.tsx`:

```tsx
"use client";

import type { WastageByReason } from "@/services/inventory/statsQueries";
import type { WastageReasonCode } from "@/services/inventory/types";
import { REASON_LABEL_KEYS } from "@/services/inventory/i18nMaps";
import { useTranslations } from "@/lib/i18n";
import type { AnyMessageKey } from "@/lib/i18n";

// Same dataviz-skill-validated 6-hue order already used for Overview's
// payment-method-mix chart (references/palette.md, slots 1-6) — a different
// semantic domain, never on screen at the same time as that chart.
const REASON_ORDER = [
  "dropped_contaminated",
  "expired",
  "damaged_packaging",
  "patient_no_show_opened",
  "equipment_failure",
  "other",
] as const;

const REASON_COLOR: Record<string, string> = {
  dropped_contaminated: "#2a78d6",
  expired: "#eb6834",
  damaged_packaging: "#1baf7a",
  patient_no_show_opened: "#eda100",
  equipment_failure: "#e87ba4",
  other: "#008300",
};

function reasonLabel(t: (key: AnyMessageKey) => string, reasonCode: string): string {
  const key = REASON_LABEL_KEYS[reasonCode as WastageReasonCode];
  return key ? t(key) : t("admin.pages.inventory.reason.other");
}

function reasonColor(reasonCode: string): string {
  return REASON_COLOR[reasonCode] ?? REASON_COLOR.other!;
}

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

function conicGradient(rows: WastageByReason[], total: number): string {
  let cursor = 0;
  const stops: string[] = [];
  for (const row of rows) {
    const start = cursor;
    cursor += (row.cost / total) * 360;
    stops.push(`${reasonColor(row.reasonCode)} ${start.toFixed(1)}deg ${cursor.toFixed(1)}deg`);
  }
  if (stops.length === 0) return "#ECEEF3";
  return `conic-gradient(${stops.join(", ")})`;
}

export function ChartWastageByReason({
  wastage,
}: {
  wastage: WastageByReason[];
}) {
  const t = useTranslations();
  // Fixed order for identity, top 5 plus an "other" catch-all beyond that —
  // never a generated 7th+ hue.
  const ordered = REASON_ORDER
    .map((code) => wastage.find((w) => w.reasonCode === code))
    .filter((row): row is WastageByReason => row != null && row.cost > 0);
  const extra = wastage.filter((w) => !REASON_ORDER.includes(w.reasonCode as (typeof REASON_ORDER)[number]));
  const extraTotal = extra.reduce((sum, row) => sum + row.cost, 0);
  const rows = extraTotal > 0
    ? [...ordered.filter((r) => r.reasonCode !== "other"), { reasonCode: "other", cost: (ordered.find((r) => r.reasonCode === "other")?.cost ?? 0) + extraTotal }]
    : ordered;
  const total = rows.reduce((sum, row) => sum + row.cost, 0) || 1;

  return (
    <section className="admin-card h-full min-h-0 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.wastageByReason")}
      </h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.wastageByReasonDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.wastageByReasonEmpty")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="mx-auto size-36 shrink-0 rounded-full"
            style={{ background: conicGradient(rows, total) }}
            role="img"
            aria-label={t("admin.inventoryAnalytics.chart.wastageByReason")}
          />
          <ul className="min-w-0 flex-1 space-y-2.5">
            {rows.map((row) => (
              <li key={row.reasonCode} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: reasonColor(row.reasonCode) }}
                  />
                  <span className="truncate text-[var(--admin-text)]">
                    {reasonLabel(t, row.reasonCode)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--admin-text)]">
                  {formatEgp(row.cost)}
                  <span className="ms-1 font-normal text-[var(--admin-muted)]">
                    ({Math.round((row.cost / total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create the snapshot lists**

Create `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsSnapshotLists.tsx`:

```tsx
"use client";

import type { ExpiringBatch, ReorderSuggestion } from "@/services/inventory/statsQueries";
import { useLocale, useTranslations } from "@/lib/i18n";
import { localizedItemName } from "@/services/inventory/i18nMaps";

export function ListExpiringSoon({ batches }: { batches: ExpiringBatch[] }) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.expiringSoon")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.expiringSoonDesc")}
      </p>
      {batches.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.expiringSoonEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto">
          {batches.map((batch) => (
            <li key={batch.batchId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-[var(--admin-text)]">
                {localizedItemName(locale === "ar" ? "ar" : "en", batch.itemName, batch.itemNameAr)}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {batch.qtyRemaining}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  batch.daysUntilExpiry <= 7
                    ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                    : "bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
                }`}
              >
                {batch.daysUntilExpiry}d
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ListReorderSuggestions({
  suggestions,
}: {
  suggestions: ReorderSuggestion[];
}) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.reorderSuggestions")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.reorderSuggestionsDesc")}
      </p>
      {suggestions.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.reorderSuggestionsEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto">
          {suggestions.map((item) => (
            <li key={item.itemId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-[var(--admin-text)]">
                {localizedItemName(locale === "ar" ? "ar" : "en", item.itemName, item.itemNameAr)}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {item.qtyOnHand}/{item.minStockLevel}
              </span>
              <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                {item.supplierName ?? t("admin.inventoryAnalytics.chart.unknownSupplier")}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-[var(--admin-text)]">
                +{item.reorderQty}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only about the not-yet-added `admin.inventoryAnalytics.*` i18n keys (Task 23) — no other error.

- [ ] **Step 6: Commit**

```bash
git status --short -- src/features/admin/components/inventoryAnalytics/
git add src/features/admin/components/inventoryAnalytics/InventoryAnalyticsTrendChart.tsx src/features/admin/components/inventoryAnalytics/InventoryAnalyticsRankedLists.tsx src/features/admin/components/inventoryAnalytics/InventoryAnalyticsWastageChart.tsx src/features/admin/components/inventoryAnalytics/InventoryAnalyticsSnapshotLists.tsx
git commit -m "feat(inventory-analytics): add the chart and list components"
```

---

### Task 20: Render switch + widget host

**Files:**
- Create: `src/features/admin/components/inventoryAnalytics/renderInventoryAnalyticsWidget.tsx`
- Create: `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsWidgetHost.tsx`

**Interfaces:**
- Consumes: the 6 components (Task 19); `InventoryAnalyticsWidgetId` (Task 18); data types from Tasks 14–16.
- Produces: `InventoryAnalyticsWidgetRenderCtx` type, `renderInventoryAnalyticsWidget(id, ctx): ReactNode`, `InventoryAnalyticsWidgetHost` component. Consumed by Task 21.

- [ ] **Step 1: Write the render switch**

Create `src/features/admin/components/inventoryAnalytics/renderInventoryAnalyticsWidget.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import type { ConsumptionTrendPoint } from "@/features/admin/lib/inventoryAnalyticsStats";
import type {
  ExpiringBatch,
  ReorderSuggestion,
  SupplierSpend,
  TopConsumedItem,
  WastageByReason,
} from "@/services/inventory/statsQueries";
import type { InventoryAnalyticsWidgetId } from "@/features/admin/lib/inventoryAnalyticsCatalog";
import { ChartConsumptionTrend } from "./InventoryAnalyticsTrendChart";
import { ListSupplierSpend, ListTopConsumedItems } from "./InventoryAnalyticsRankedLists";
import { ChartWastageByReason } from "./InventoryAnalyticsWastageChart";
import { ListExpiringSoon, ListReorderSuggestions } from "./InventoryAnalyticsSnapshotLists";

export type InventoryAnalyticsWidgetRenderCtx = {
  consumptionTrend: ConsumptionTrendPoint[];
  topConsumedItems: TopConsumedItem[];
  wastageByReason: WastageByReason[];
  supplierSpend: SupplierSpend[];
  expiringSoon: ExpiringBatch[];
  reorderSuggestions: ReorderSuggestion[];
};

export function renderInventoryAnalyticsWidget(
  id: string,
  ctx: InventoryAnalyticsWidgetRenderCtx,
): ReactNode {
  switch (id as InventoryAnalyticsWidgetId) {
    case "consumptionTrend":
      return <ChartConsumptionTrend trend={ctx.consumptionTrend} />;
    case "topConsumedItems":
      return <ListTopConsumedItems items={ctx.topConsumedItems} />;
    case "wastageByReason":
      return <ChartWastageByReason wastage={ctx.wastageByReason} />;
    case "supplierSpend":
      return <ListSupplierSpend suppliers={ctx.supplierSpend} />;
    case "expiringSoon":
      return <ListExpiringSoon batches={ctx.expiringSoon} />;
    case "reorderSuggestions":
      return <ListReorderSuggestions suggestions={ctx.reorderSuggestions} />;
    default:
      return null;
  }
}
```

- [ ] **Step 2: Write the host**

Create `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsWidgetHost.tsx`:

```tsx
"use client";

import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  renderInventoryAnalyticsWidget,
  type InventoryAnalyticsWidgetRenderCtx,
} from "./renderInventoryAnalyticsWidget";

export type InventoryAnalyticsWidgetHostProps = InventoryAnalyticsWidgetRenderCtx & {
  id: string;
  className?: string;
};

export function InventoryAnalyticsWidgetHost(props: InventoryAnalyticsWidgetHostProps) {
  useTranslations();
  const { id, className, ...ctx } = props;
  const body = renderInventoryAnalyticsWidget(id, ctx);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 *:h-full *:min-h-0">{body}</div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only about the missing i18n keys (Task 23) — no other error.

- [ ] **Step 4: Commit**

```bash
git status --short -- src/features/admin/components/inventoryAnalytics/renderInventoryAnalyticsWidget.tsx src/features/admin/components/inventoryAnalytics/InventoryAnalyticsWidgetHost.tsx
git add src/features/admin/components/inventoryAnalytics/renderInventoryAnalyticsWidget.tsx src/features/admin/components/inventoryAnalytics/InventoryAnalyticsWidgetHost.tsx
git commit -m "feat(inventory-analytics): add the widget render switch and host"
```

---

### Task 21: `InventoryAnalyticsDashboard` page component + range picker

**Files:**
- Create: `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsRangePicker.tsx`
- Create: `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsDashboard.tsx`

**Interfaces:**
- Consumes: `useDashboardLayoutEditor` (Task 8); `INVENTORY_ANALYTICS_CATALOG` (Task 18); `DashboardWidgetFrame`, `DashboardDropPlaceholder` (Task 7); `useInventoryAnalyticsFilterQuery` (Task 17); `InventoryAnalyticsWidgetHost` (Task 20); `saveDashboardLayout` (Task 13).
- Produces: `InventoryAnalyticsDashboard` — the page-level component `page.tsx` renders. Consumed by Task 22.

This mirrors `ClinicDashboard.tsx`'s grid-rendering structure (same generic primitives, same JSX shape) but with a much smaller page-specific chrome: a heading, the range picker, and the widget grid — no patient drawer, no reservation filter bar, no doctor-scoping.

- [ ] **Step 1: Write the range picker**

Create `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsRangePicker.tsx`:

```tsx
"use client";

import { useInventoryAnalyticsFilterQuery } from "@/features/admin/lib/useInventoryAnalyticsFilterQuery";
import { INVENTORY_ANALYTICS_RANGE_VALUES } from "@/features/admin/lib/inventoryAnalyticsFilters";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function InventoryAnalyticsRangePicker() {
  const t = useTranslations();
  const { filters, setFilters } = useInventoryAnalyticsFilterQuery();

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-[var(--admin-border)]">
      {INVENTORY_ANALYTICS_RANGE_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          className={cn(
            "px-3 py-1.5 text-sm font-medium",
            filters.range === value
              ? "bg-[var(--admin-primary)] text-white"
              : "bg-[var(--admin-panel)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
          )}
          onClick={() => void setFilters({ range: value })}
        >
          {t(
            value === "30d"
              ? "admin.inventoryAnalytics.range.30d"
              : "admin.inventoryAnalytics.range.90d",
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write the page dashboard component**

Create `src/features/admin/components/inventoryAnalytics/InventoryAnalyticsDashboard.tsx`:

```tsx
"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { saveDashboardLayout } from "@/services/dashboard_layouts/actions";
import { useDashboardLayoutEditor } from "@/features/admin/hooks/useDashboardLayoutEditor";
import {
  INVENTORY_ANALYTICS_CATALOG,
} from "@/features/admin/lib/inventoryAnalyticsCatalog";
import {
  colSpanClass,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  packDashboardStackRows,
  rowGapColSpan,
  type DashboardLayout,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
import {
  dashboardEditChromeTransition,
  dashboardEditSlotVariants,
  dashboardLayoutTransition,
} from "@/features/admin/lib/dashboardWidgets/dashboardLayoutMotion";
import { DashboardDropPlaceholder } from "@/features/admin/components/dashboardWidgets/DashboardDropPlaceholder";
import { DashboardWidgetFrame } from "@/features/admin/components/dashboardWidgets/DashboardWidgetFrame";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { InventoryAnalyticsRangePicker } from "./InventoryAnalyticsRangePicker";
import { InventoryAnalyticsWidgetHost } from "./InventoryAnalyticsWidgetHost";
import type { InventoryAnalyticsWidgetRenderCtx } from "./renderInventoryAnalyticsWidget";

const PAGE_KEY = "inventoryAnalytics";

type Props = {
  initialLayout: DashboardLayout;
} & InventoryAnalyticsWidgetRenderCtx;

async function save(layout: DashboardLayout): Promise<DashboardLayout> {
  return (await saveDashboardLayout(PAGE_KEY, layout)) as DashboardLayout;
}

export function InventoryAnalyticsDashboard({ initialLayout, ...ctx }: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const layoutTransition = dashboardLayoutTransition(reduced);
  const chromeTransition = dashboardEditChromeTransition(reduced);
  const slotVariants = dashboardEditSlotVariants(reduced);
  const editor = useDashboardLayoutEditor(
    INVENTORY_ANALYTICS_CATALOG,
    initialLayout,
    save,
  );
  const stacks = groupDashboardStacks(editor.layout);
  const stackRows = packDashboardStackRows(stacks);
  const layoutActive = !reduced && !editor.dragFromId;

  const hostProps = ctx;

  return (
    <AdminPageMotion className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-[var(--admin-text)]">
          {t("admin.nav.inventoryAnalytics")}
        </h1>
        <InventoryAnalyticsRangePicker />
      </div>

      <LayoutGroup id="inventory-analytics-layout">
        <div className="space-y-3">
          {stackRows.map((row) => {
            const gapSpan = rowGapColSpan(row.gap);
            return (
              <div
                key={
                  row.stacks.map((s) => s.id).join("|") ||
                  `row-${row.afterStackId ?? "end"}`
                }
                className="grid grid-cols-12 items-stretch gap-3"
              >
                {row.stacks.map((stack) => (
                  <motion.div
                    key={stack.id}
                    layout={layoutActive}
                    transition={layoutTransition}
                    className={cn(
                      colSpanClass(stack.colSpan),
                      "flex min-h-0 min-w-0 flex-col",
                    )}
                  >
                    <div className="flex min-h-0 flex-1 flex-col gap-3">
                      {stack.widgets.map((placement) => (
                        <DashboardWidgetFrame
                          key={placement.id}
                          placement={placement}
                          meta={INVENTORY_ANALYTICS_CATALOG.meta(placement.id)}
                          editing={editor.editing}
                          dragOver={editor.dragOverId === placement.id}
                          dropEdge={
                            editor.dragOverId === placement.id
                              ? editor.dropEdge
                              : null
                          }
                          dragging={editor.dragFromId === placement.id}
                          maxColSpan={maxDashboardStackColSpan(
                            editor.layout,
                            placement.id,
                          )}
                          onDragStart={editor.onDragStart}
                          onDragOver={editor.onDragOver}
                          onDrop={editor.onDrop}
                          onDragEnd={editor.onDragEnd}
                          onResize={editor.resize}
                          onRemove={editor.remove}
                          onHeightChange={editor.resizeHeight}
                          onHeightCommit={editor.commitHeight}
                        >
                          <InventoryAnalyticsWidgetHost
                            id={placement.id}
                            {...hostProps}
                          />
                        </DashboardWidgetFrame>
                      ))}
                      <AnimatePresence initial={false}>
                        {editor.editing ? (
                          <motion.div
                            key={`slot-${stack.id}`}
                            variants={slotVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={chromeTransition}
                          >
                            {editor.dragOverStackId === stack.id && editor.dragFromId ? (
                              <div
                                data-dash-stack-slot={stack.id}
                                className="min-h-16"
                                onDragOver={(e) => editor.onStackDragOver(stack.id, e)}
                                onDrop={(e) => editor.onStackDrop(stack.id, e)}
                              >
                                <DashboardDropPlaceholder />
                              </div>
                            ) : (
                              <div
                                data-dash-stack-slot={stack.id}
                                className="min-h-10 shrink-0 rounded-md border border-dashed border-[color:color-mix(in_oklab,var(--admin-ink)_18%,transparent)] bg-[color:color-mix(in_oklab,var(--admin-ink)_4%,transparent)]"
                                onDragOver={(e) => editor.onStackDragOver(stack.id, e)}
                                onDrop={(e) => editor.onStackDrop(stack.id, e)}
                              />
                            )}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
                <AnimatePresence initial={false}>
                  {editor.editing && gapSpan && row.afterStackId ? (
                    <motion.div
                      key={`gap-${row.afterStackId}`}
                      layout={layoutActive}
                      variants={slotVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={chromeTransition}
                      data-dash-row-gap={row.afterStackId}
                      className={cn(colSpanClass(gapSpan), "min-h-[6rem]")}
                      onDragOver={(e) => editor.onGapDragOver(row.afterStackId!, gapSpan, e)}
                      onDrop={(e) => editor.onGapDrop(row.afterStackId!, gapSpan, e)}
                    >
                      {editor.dragOverGapId === row.afterStackId && editor.dragFromId ? (
                        <DashboardDropPlaceholder className="h-full min-h-[6rem]" />
                      ) : (
                        <div className="h-full min-h-[6rem] rounded-md border border-dashed border-[color:color-mix(in_oklab,var(--admin-ink)_18%,transparent)] bg-[color:color-mix(in_oklab,var(--admin-ink)_4%,transparent)]" />
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
          <AnimatePresence initial={false}>
            {editor.editing ? (
              <motion.div
                key="end-slot"
                variants={slotVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={chromeTransition}
                data-dash-end-slot
                className="min-h-14"
                onDragOver={editor.onEndDragOver}
                onDrop={editor.onEndDrop}
              >
                {editor.dragOverEnd && editor.dragFromId ? (
                  <DashboardDropPlaceholder className="min-h-14" />
                ) : (
                  <div
                    className={cn(
                      "flex min-h-14 items-center justify-center rounded-md border border-dashed text-xs",
                      "border-[color:color-mix(in_oklab,var(--admin-ink)_18%,transparent)] text-[color:color-mix(in_oklab,var(--admin-ink)_45%,transparent)]",
                    )}
                  >
                    {t("admin.overview.customize.dropNewRow")}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </AdminPageMotion>
  );
}
```

(`AdminPageMotion` is the existing shared page-transition wrapper `ClinicDashboard.tsx` already uses — reused as-is, no changes needed to it.)

- [ ] **Step 3: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean (all i18n keys this task needs — `admin.nav.inventoryAnalytics`, `admin.inventoryAnalytics.range.30d/90d`, `admin.overview.customize.dropNewRow` — the last one already exists; the first two are added in Task 23, so an error here about those two specific keys is expected until Task 23 lands).

- [ ] **Step 4: Commit**

```bash
git status --short -- src/features/admin/components/inventoryAnalytics/InventoryAnalyticsRangePicker.tsx src/features/admin/components/inventoryAnalytics/InventoryAnalyticsDashboard.tsx
git add src/features/admin/components/inventoryAnalytics/InventoryAnalyticsRangePicker.tsx src/features/admin/components/inventoryAnalytics/InventoryAnalyticsDashboard.tsx
git commit -m "feat(inventory-analytics): add the page dashboard component and range picker"
```

---

### Task 22: `page.tsx` route

**Files:**
- Create: `src/app/(internal)/admin/(dashboard)/inventory/analytics/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 13–21.
- Produces: the live route `/admin/inventory/analytics`.

- [ ] **Step 1: Write the page**

Create `src/app/(internal)/admin/(dashboard)/inventory/analytics/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { InventoryAnalyticsDashboard } from "@/features/admin/components/inventoryAnalytics/InventoryAnalyticsDashboard";
import { INVENTORY_ANALYTICS_CATALOG } from "@/features/admin/lib/inventoryAnalyticsCatalog";
import { normalizeDashboardLayout } from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
import {
  inventoryAnalyticsFiltersCache,
  resolveInventoryAnalyticsRange,
} from "@/features/admin/lib/inventoryAnalyticsFilters";
import { buildConsumptionTrendChart } from "@/features/admin/lib/inventoryAnalyticsStats";
import { getDashboardLayout } from "@/services/dashboard_layouts/queries";
import {
  listExpiringSoonBatches,
  listReorderSuggestions,
  listSupplierSpend,
  listTopConsumedItems,
  listWastageByReason,
  listWeekConsumptionRows,
} from "@/services/inventory/statsQueries";
import type {
  ExpiringBatch,
  ReorderSuggestion,
  SupplierSpend,
  TopConsumedItem,
  WastageByReason,
  WeekConsumptionRow,
} from "@/services/inventory/statsQueries";

export const dynamic = "force-dynamic";

const PAGE_KEY = "inventoryAnalytics";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InventoryAnalyticsPage({ searchParams }: PageProps) {
  await requirePagePermission("inventory.view");
  const { range } = await inventoryAnalyticsFiltersCache.parse(searchParams);
  const now = new Date();
  const { from, to } = resolveInventoryAnalyticsRange(range, now);

  const supabase = await createClient();
  const [
    savedLayout,
    consumptionRows,
    topConsumedItems,
    wastageByReason,
    supplierSpend,
    expiringSoon,
    reorderSuggestions,
  ] = await Promise.all([
    getDashboardLayout(supabase, PAGE_KEY).catch(() => null),
    listWeekConsumptionRows(supabase, from, to).catch(() => [] as WeekConsumptionRow[]),
    listTopConsumedItems(supabase, from, to).catch(() => [] as TopConsumedItem[]),
    listWastageByReason(supabase, from, to).catch(() => [] as WastageByReason[]),
    listSupplierSpend(supabase, from, to).catch(() => [] as SupplierSpend[]),
    listExpiringSoonBatches(supabase, now).catch(() => [] as ExpiringBatch[]),
    listReorderSuggestions(supabase).catch(() => [] as ReorderSuggestion[]),
  ]);

  const initialLayout = normalizeDashboardLayout(savedLayout, INVENTORY_ANALYTICS_CATALOG);

  return (
    <InventoryAnalyticsDashboard
      initialLayout={initialLayout}
      consumptionTrend={buildConsumptionTrendChart(consumptionRows, new Date(from), new Date(to))}
      topConsumedItems={topConsumedItems}
      wastageByReason={wastageByReason}
      supplierSpend={supplierSpend}
      expiringSoon={expiringSoon}
      reorderSuggestions={reorderSuggestions}
    />
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean, except for the still-missing `admin.inventoryAnalytics.*`/`admin.nav.inventoryAnalytics` i18n keys (Task 23).

- [ ] **Step 3: Commit**

```bash
git status --short -- "src/app/(internal)/admin/(dashboard)/inventory/analytics/page.tsx"
git add "src/app/(internal)/admin/(dashboard)/inventory/analytics/page.tsx"
git commit -m "feat(inventory-analytics): add the /admin/inventory/analytics route"
```

---

### Task 23: Nav entries + i18n keys

**Files:**
- Modify: `src/features/admin/lib/adminNav.ts`
- Modify: `src/lib/i18n/messages/admin/en.ts`
- Modify: `src/lib/i18n/messages/admin/ar.ts`

**Interfaces:**
- Produces: every `AdminMessageKey` referenced by Tasks 18–21, plus the nav entry for `/admin/inventory/analytics`.

- [ ] **Step 1: Add the nav entries**

In `src/features/admin/lib/adminNav.ts`, find (in the rail items array):
```ts
    children: [
      { href: "/admin/inventory/reports", labelKey: "admin.nav.inventoryReports", permission: "inventory.reports.view" },
    ],
```
immediately preceded by `id: "inventory"` — change it to:
```ts
    children: [
      { href: "/admin/inventory/reports", labelKey: "admin.nav.inventoryReports", permission: "inventory.reports.view" },
      { href: "/admin/inventory/analytics", labelKey: "admin.nav.inventoryAnalytics", permission: "inventory.view" },
    ],
```

Find the second occurrence (in the full sidebar's `items` array, also preceded by `id: "inventory"`):
```ts
        items: [
          { href: "/admin/inventory/reports", labelKey: "admin.nav.inventoryReports", permission: "inventory.reports.view" },
        ],
```
change it to:
```ts
        items: [
          { href: "/admin/inventory/reports", labelKey: "admin.nav.inventoryReports", permission: "inventory.reports.view" },
          { href: "/admin/inventory/analytics", labelKey: "admin.nav.inventoryAnalytics", permission: "inventory.view" },
        ],
```

Find:
```ts
  "/admin/inventory": "admin.nav.inventory",
  "/admin/inventory/reports": "admin.nav.inventoryReports",
```
change it to:
```ts
  "/admin/inventory": "admin.nav.inventory",
  "/admin/inventory/reports": "admin.nav.inventoryReports",
  "/admin/inventory/analytics": "admin.nav.inventoryAnalytics",
```

Find:
```ts
  "/admin/inventory": "inventory.view",
  "/admin/inventory/reports": "inventory.reports.view",
```
change it to:
```ts
  "/admin/inventory": "inventory.view",
  "/admin/inventory/reports": "inventory.reports.view",
  "/admin/inventory/analytics": "inventory.view",
```

- [ ] **Step 2: Add English i18n keys**

In `src/lib/i18n/messages/admin/en.ts`, find:
```ts
  "admin.nav.inventoryReports": "Reports",
```
(locate its exact current text by searching for the key — if the string differs from `"Reports"`, keep whatever the existing key's value is and add the new key on the next line regardless) and add immediately after it:
```ts
  "admin.nav.inventoryAnalytics": "Analytics",
```

Then add a new block anywhere after the existing `admin.overview.*` keys (e.g. right before the closing `};` of the `adminEn` object, or grouped with other page-specific keys — exact position doesn't matter since these are plain object properties):
```ts
  "admin.inventoryAnalytics.widget.consumptionTrend": "Consumption trend",
  "admin.inventoryAnalytics.widget.topConsumedItems": "Top consumed items",
  "admin.inventoryAnalytics.widget.wastageByReason": "Wastage by reason",
  "admin.inventoryAnalytics.widget.supplierSpend": "Supplier spend",
  "admin.inventoryAnalytics.widget.expiringSoon": "Expiring soon",
  "admin.inventoryAnalytics.widget.reorderSuggestions": "Reorder suggestions",
  "admin.inventoryAnalytics.range.30d": "Last 30 days",
  "admin.inventoryAnalytics.range.90d": "Last 90 days",
  "admin.inventoryAnalytics.chart.consumptionTrend": "Consumption trend",
  "admin.inventoryAnalytics.chart.consumptionTrendDesc": "Consumption cost (EGP) per day over the selected range",
  "admin.inventoryAnalytics.chart.topConsumedItems": "Top consumed items",
  "admin.inventoryAnalytics.chart.topConsumedItemsDesc": "Most costly items consumed in the selected range",
  "admin.inventoryAnalytics.chart.topConsumedItemsEmpty": "No consumption in this range yet.",
  "admin.inventoryAnalytics.chart.wastageByReason": "Wastage by reason",
  "admin.inventoryAnalytics.chart.wastageByReasonDesc": "Wastage cost grouped by reason, in the selected range",
  "admin.inventoryAnalytics.chart.wastageByReasonEmpty": "No wastage in this range.",
  "admin.inventoryAnalytics.chart.supplierSpend": "Supplier spend",
  "admin.inventoryAnalytics.chart.supplierSpendDesc": "Restock cost grouped by supplier, in the selected range",
  "admin.inventoryAnalytics.chart.supplierSpendEmpty": "No restocks in this range yet.",
  "admin.inventoryAnalytics.chart.unknownSupplier": "Unknown supplier",
  "admin.inventoryAnalytics.chart.expiringSoon": "Expiring soon",
  "admin.inventoryAnalytics.chart.expiringSoonDesc": "Batches expiring within 30 days",
  "admin.inventoryAnalytics.chart.expiringSoonEmpty": "Nothing expiring soon.",
  "admin.inventoryAnalytics.chart.reorderSuggestions": "Reorder suggestions",
  "admin.inventoryAnalytics.chart.reorderSuggestionsDesc": "Items at or below their minimum stock level",
  "admin.inventoryAnalytics.chart.reorderSuggestionsEmpty": "Nothing needs reordering right now.",
```

- [ ] **Step 3: Add matching Arabic i18n keys**

In `src/lib/i18n/messages/admin/ar.ts`, find the Arabic value for `"admin.nav.inventoryReports"` and add immediately after it:
```ts
  "admin.nav.inventoryAnalytics": "التحليلات",
```

Then add, in the same relative position as the English block above:
```ts
  "admin.inventoryAnalytics.widget.consumptionTrend": "اتجاه الاستهلاك",
  "admin.inventoryAnalytics.widget.topConsumedItems": "أكثر الأصناف استهلاكاً",
  "admin.inventoryAnalytics.widget.wastageByReason": "الهالك حسب السبب",
  "admin.inventoryAnalytics.widget.supplierSpend": "الإنفاق على الموردين",
  "admin.inventoryAnalytics.widget.expiringSoon": "قريب من انتهاء الصلاحية",
  "admin.inventoryAnalytics.widget.reorderSuggestions": "مقترحات إعادة الطلب",
  "admin.inventoryAnalytics.range.30d": "آخر ٣٠ يوم",
  "admin.inventoryAnalytics.range.90d": "آخر ٩٠ يوم",
  "admin.inventoryAnalytics.chart.consumptionTrend": "اتجاه الاستهلاك",
  "admin.inventoryAnalytics.chart.consumptionTrendDesc": "تكلفة الاستهلاك (جنيه) يومياً خلال النطاق المحدد",
  "admin.inventoryAnalytics.chart.topConsumedItems": "أكثر الأصناف استهلاكاً",
  "admin.inventoryAnalytics.chart.topConsumedItemsDesc": "أعلى الأصناف تكلفة استهلاكاً خلال النطاق المحدد",
  "admin.inventoryAnalytics.chart.topConsumedItemsEmpty": "لا يوجد استهلاك في هذا النطاق بعد.",
  "admin.inventoryAnalytics.chart.wastageByReason": "الهالك حسب السبب",
  "admin.inventoryAnalytics.chart.wastageByReasonDesc": "تكلفة الهالك مجمّعة حسب السبب خلال النطاق المحدد",
  "admin.inventoryAnalytics.chart.wastageByReasonEmpty": "لا يوجد هالك في هذا النطاق.",
  "admin.inventoryAnalytics.chart.supplierSpend": "الإنفاق على الموردين",
  "admin.inventoryAnalytics.chart.supplierSpendDesc": "تكلفة إعادة التخزين مجمّعة حسب المورد خلال النطاق المحدد",
  "admin.inventoryAnalytics.chart.supplierSpendEmpty": "لا توجد عمليات إعادة تخزين في هذا النطاق بعد.",
  "admin.inventoryAnalytics.chart.unknownSupplier": "مورد غير معروف",
  "admin.inventoryAnalytics.chart.expiringSoon": "قريب من انتهاء الصلاحية",
  "admin.inventoryAnalytics.chart.expiringSoonDesc": "دفعات تنتهي صلاحيتها خلال ٣٠ يوماً",
  "admin.inventoryAnalytics.chart.expiringSoonEmpty": "لا يوجد شيء قريب من الانتهاء.",
  "admin.inventoryAnalytics.chart.reorderSuggestions": "مقترحات إعادة الطلب",
  "admin.inventoryAnalytics.chart.reorderSuggestionsDesc": "الأصناف عند أو تحت الحد الأدنى للمخزون",
  "admin.inventoryAnalytics.chart.reorderSuggestionsEmpty": "لا يوجد شيء يحتاج لإعادة طلب الآن.",
```

- [ ] **Step 4: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean across the whole project.

- [ ] **Step 5: Commit**

```bash
git status --short -- src/features/admin/lib/adminNav.ts src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git add src/features/admin/lib/adminNav.ts src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "feat(inventory-analytics): add nav entry and i18n strings (en + ar)"
```

---

### Task 24: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `bash scripts/test.sh`
Expected: every test in the project passes.

- [ ] **Step 2: Full typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: clean.

- [ ] **Step 3: Confirm the migration is applied (if not already done in Task 12)**

If Task 12's migration hasn't been applied yet, confirm with the user and run:
```bash
supabase db push --linked
```
Without this, the new page's queries against `dashboard_layouts` (and the read-only inventory queries, which work regardless) will fail at runtime even though everything typechecks.

- [ ] **Step 4: Manual browser verification of the new page**

Sign in as `admin@dentallounge.local`, visit `/admin/inventory/analytics` via the new "Analytics" nav entry under Inventory. Confirm:
- All 6 widgets render with real data (seed a consumption/wastage/restock transaction first if the selected range is otherwise empty).
- The 30d/90d picker changes the URL (`?range=90d`) and the consumption/top-items/wastage/supplier widgets update.
- "Customize layout" → drag, resize, remove, undo/redo, save all work exactly like Overview's, and the saved layout persists across a reload.
- Arabic locale renders every label (nav entry, widget titles/descriptions, "Unknown supplier", reason names) with no raw key strings visible.

- [ ] **Step 5: Re-confirm Overview regression-free**

Repeat Task 11 Step 3's Overview check once more now that the full feature (both parts) is in place — the two pages share the generic framework, so this is the final confidence check that nothing about Inventory Analytics leaked into Overview's behavior.

- [ ] **Step 6: Report**

Summarize pass/fail for Steps 1–5. Fix any failures in the relevant task's files, re-run verification, and only report the feature done once every step passes.
