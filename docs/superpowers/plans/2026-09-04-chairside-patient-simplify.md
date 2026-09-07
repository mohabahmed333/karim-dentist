# Chairside Patient Simplify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline only — this repo forbids Task/subagent fan-out). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four-tab patient profile with a two-pane chairside workspace (Chart | Planner), tuck History/Clinical/Teeth under Records, and move diagnostics into the existing tooth inspector drawer.

**Architecture:** `PatientHistoryDashboard` always mounts `PatientChartingWorkspace`. Header exposes a Records menu that overlays existing history/EHR/teeth panes without unmounting charting. `ChartingPanels` becomes two columns; `DiagnosticBody` renders inside `ToothInspectorDrawer` via `ChartingDrawers`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind, existing `SideDrawer` / dropdown-menu, Node test runner (`yarn test` / `scripts/test.sh`).

## Global Constraints

- Max ~100 lines per TS/TSX file; named exports; no `any`
- No new shared primitives under `src/components/ui/` without asking
- No Task/subagents; implement inline
- Do not commit unless the user asks
- Preserve gray `patientSkin` / charting gray tokens
- TDD: failing test → minimal code → green for pure logic

## File map

| File | Responsibility |
| --- | --- |
| `history-dashboard/recordsPane.ts` | `RecordsPane` type + open/close helpers |
| `history-dashboard/recordsPane.test.ts` | Unit tests for pane helpers |
| `history-dashboard/RecordsMenu.tsx` | Header dropdown: History / Clinical / Chart style |
| `history-dashboard/RecordsOverlay.tsx` | Full-panel overlay hosting the three existing views |
| `history-dashboard/DashboardHeader.tsx` | Identity + Records + search (no tab bar) |
| `history-dashboard/PatientHistoryDashboard.tsx` | Always chairside + records state |
| `charting/chartingSkin.ts` | `CHART_BENTO` → 2 columns |
| `charting/ChartingPanels.tsx` | Chart then Planner only |
| `charting/PatientChartingWorkspace.tsx` | Wire drawers; open inspector on select |
| `charting/chartingTour.ts` | Two-step (or chart/planner) tour copy |
| `charting/chartingTour.test.ts` | Assert step count / copy |

---

### Task 1: Records pane state helpers

**Files:**
- Create: `src/features/admin/components/patients/history-dashboard/recordsPane.ts`
- Create: `src/features/admin/components/patients/history-dashboard/recordsPane.test.ts`

**Interfaces:**
- Produces: `export type RecordsPane = "history" | "clinical" | "teeth"`
- Produces: `export function openRecords(pane: RecordsPane): RecordsPane`
- Produces: `export function closeRecords(): null`

- [x] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { closeRecords, openRecords } from "./recordsPane.ts";

describe("recordsPane", () => {
  it("opens a named pane and closes to null", () => {
    assert.equal(openRecords("history"), "history");
    assert.equal(openRecords("clinical"), "clinical");
    assert.equal(openRecords("teeth"), "teeth");
    assert.equal(closeRecords(), null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/patients/history-dashboard/recordsPane.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```ts
export type RecordsPane = "history" | "clinical" | "teeth";

export function openRecords(pane: RecordsPane): RecordsPane {
  return pane;
}

export function closeRecords(): null {
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Same command as Step 2. Expected: PASS

- [ ] **Step 5: Commit** — skip unless user asks

---

### Task 2: Records menu + overlay UI

**Files:**
- Create: `src/features/admin/components/patients/history-dashboard/RecordsMenu.tsx`
- Create: `src/features/admin/components/patients/history-dashboard/RecordsOverlay.tsx`
- Modify: `src/features/admin/components/patients/history-dashboard/DashboardHeader.tsx`

**Interfaces:**
- Consumes: `RecordsPane` from `recordsPane.ts`
- Produces: `RecordsMenu({ onOpen }: { onOpen: (pane: RecordsPane) => void })`
- Produces: `RecordsOverlay({ pane, onClose, children }: { pane: RecordsPane | null; onClose: () => void; children: ReactNode })`

- [ ] **Step 1: Implement `RecordsMenu`** using existing `@/components/ui/dropdown-menu` with three items labeled History, Clinical, Chart style; call `onOpen` with the matching pane.

- [ ] **Step 2: Implement `RecordsOverlay`** as a fixed inset panel over the chairside body (`z-30`, gray panel skin, Close button). When `pane === null`, return `null`. Render `children` inside a scrollable region.

- [ ] **Step 3: Update `DashboardHeader`** — remove `tab` / `onTab` / `DashboardTabBar`. Props become `{ group, directory, onOpenRecords }`. Place `RecordsMenu` between identity and `PatientSearchPill`.

- [ ] **Step 4: Manual smoke** — typecheck by loading patient page after Task 3 wires dashboard (or `npx tsc --noEmit` if configured). Fix line-count splits if any file exceeds ~100 lines.

- [ ] **Step 5: Commit** — skip unless user asks

---

### Task 3: Dashboard always chairside

**Files:**
- Modify: `src/features/admin/components/patients/history-dashboard/PatientHistoryDashboard.tsx`

**Interfaces:**
- Consumes: `RecordsMenu`/`RecordsOverlay`, `openRecords`/`closeRecords`
- State: `const [records, setRecords] = useState<RecordsPane | null>(null)`

- [ ] **Step 1: Replace tab state** with `records` state. Always render `PatientChartingWorkspace` (no AnimatePresence tab switch).

- [ ] **Step 2: Wire header** `onOpenRecords={(pane) => setRecords(openRecords(pane))}`.

- [ ] **Step 3: Render `RecordsOverlay`** when `records` is set:
  - `history` → `PatientHistoryView` (same props as today)
  - `clinical` → `PatientEhrView` (same props as today)
  - `teeth` → `PatientTeethPane` via `chartTabProps(notesChart)` (same props as today)
  - `onClose={() => setRecords(closeRecords())}`

- [ ] **Step 4: Keep delete dialogs** for imaging/notes unchanged.

- [ ] **Step 5: Remove unused** `DashboardTab` import / AnimatePresence tab branches if unused. Keep `dashboard.types` `DashboardTab` for now (or narrow later) — do not break other imports.

- [ ] **Step 6: Commit** — skip unless user asks

---

### Task 4: Two-column ChartingPanels

**Files:**
- Modify: `src/features/admin/components/patients/charting/chartingSkin.ts`
- Modify: `src/features/admin/components/patients/charting/ChartingPanels.tsx`

**Interfaces:**
- `CHART_BENTO` = `"grid items-stretch gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"` (chart | planner ~60/40)
- `ChartingPanels` props: drop `toothLabel`, `diagTab`, `onDiagTab`, `children` from the panel layout (diagnostics leave this file)
- Column order: Chart card first, Planner second
- `ring` ids remain `"chart" | "diagnostics" | "planner"` for tour compatibility until Task 6; panels only ring `chart` and `planner`

- [ ] **Step 1: Update `CHART_BENTO`** to two columns as above.

- [ ] **Step 2: Rewrite `ChartingPanels`** to only render Chart + Planner cards (copy from current odontogram + `CdtPlanner` blocks). Remove `DiagnosticPane` import/usage.

- [ ] **Step 3: Fix call sites** in `PatientChartingWorkspace` that passed diagnostic props into panels (Task 5 will move body into drawers — temporarily may leave unused DiagnosticBody; prefer completing Task 5 in the same session).

- [ ] **Step 4: Commit** — skip unless user asks

---

### Task 5: Diagnostics via ToothInspectorDrawer

**Files:**
- Modify: `src/features/admin/components/patients/charting/PatientChartingWorkspace.tsx`
- Possibly: `src/features/admin/components/patients/charting/ChartingOverlays.tsx` or keep drawers in workspace
- Reuse: `ChartingDrawers.tsx`, `InspectToothButton.tsx`

**Interfaces:**
- State: `inspectorOpen: boolean` (open when tooth selected; close clears or keeps selection per existing deselect)
- On `notesChart.selectTooth`: set inspector open `true`
- Render `ChartingDrawers` with `diagnosticBody={<DiagnosticBody .../>}` and builder wired to `treatmentsChart.addCdtProcedure`
- Place `InspectToothButton` in chart header row (toolbar area) so Diagnose works if drawer was closed

- [ ] **Step 1: Add local state** `inspectorOpen` / `builderOpen` in workspace (or tiny hook file if workspace exceeds ~100 lines — split `useChartingDrawers.ts`).

- [ ] **Step 2: Wire `ChartingDrawers`** with DiagnosticBody as `diagnosticBody`; onAddProcedure calls `treatmentsChart.addCdtProcedure(selectedFdi, code, fee)` with phase if API supports it — match `ProcedureBuilderDrawer` / existing `onAddProcedure` signature in `ChartingDrawers`.

- [ ] **Step 3: On select tooth** open inspector; on deselect close inspector.

- [ ] **Step 4: Manual** — select tooth → drawer with diagnostics tabs; planner still visible behind.

- [ ] **Step 5: Commit** — skip unless user asks

---

### Task 6: Tour copy for two panes

**Files:**
- Modify: `src/features/admin/components/patients/charting/chartingTour.ts`
- Modify: `src/features/admin/components/patients/charting/chartingTour.test.ts`

**Interfaces:**
- Steps: chart → planner (2 steps) OR chart → diagnostics-drawer → planner (3 steps). Prefer **3 steps** still teaching fees: (1) chart, (2) diagnose drawer, (3) planner fees — keep `CHARTING_TOUR_STEPS.length === 3` so existing test shape mostly holds; update body copy to say diagnose opens as a drawer.

- [ ] **Step 1: Update failing assertion if step copy changes** — keep length 3 and fee mention on last step.

- [ ] **Step 2: Edit `CHARTING_TOUR_STEPS`** diagnostics step body to mention drawer / Inspect.

- [ ] **Step 3: Run** `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/patients/charting/chartingTour.test.ts` — PASS

- [ ] **Step 4: Commit** — skip unless user asks

---

### Task 7: Verification

**Files:** none new

- [ ] **Step 1: Run** `yarn test` (or `bash scripts/test.sh`) — all green

- [ ] **Step 2: Manual checklist on `/admin/patients/[patientKey]`:**
  - Lands on Chart | Planner (no top tabs)
  - Records → History / Clinical / Chart style open overlay; Close returns with selection intact
  - Tooth select opens inspector; paint + preset + book still work
  - No permanent third diagnostics column

- [ ] **Step 3: Clear `todo.md` when done**

---

## Spec coverage

| Spec requirement | Task |
| --- | --- |
| Default = chairside, no tab bar | 3 |
| Records menu + overlay | 1–3 |
| Two panes Chart \| Planner | 4 |
| Diagnostics as drawer | 5 |
| Preserve components/hooks | 3, 5 |
| Tour / empty states | 5–6 |
| Tests for pane helpers | 1 |
| Manual chairside loop | 7 |

## Execution

Repo rule: **inline only** (no subagents). After this plan is saved, execute with `executing-plans` in this chat unless the user pauses.
