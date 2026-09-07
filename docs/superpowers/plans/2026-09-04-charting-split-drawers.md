# Charting Split + Drawers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 50/50 Charting layout, Option A Inspect drawer, Procedure Builder drawer, revert selection accents to `#E2F163` / white segments.

**Architecture:** Soft refactor of `PatientChartingWorkspace` + `ChartingPanels`; reuse diagnostic bodies inside `ToothInspectorDrawer`; extract presets into `ProcedureBuilderDrawer`.

**Tech:** React, Tailwind, Framer Motion (`SideDrawer`), existing CDT services.

---

### Task 1: Color revert

- [ ] `SurfaceToothGlyph` — selected ring/badge `#E2F163` / `#111111`
- [ ] `ChartingSegment` — white active pill on `bg-[#F1F5F9]`
- [ ] `ChartingToolbar` Select swatch `#E2F163`
- [ ] `CdtProcedureRow` — blue active border (not amber)

### Task 2: Split layout tokens + panels

- [ ] `chartingSkin.ts` — `CHART_SPLIT` 2-col 50/50; left stack gap
- [ ] Rewrite `ChartingPanels` — left chart + treatments slot; right planner only
- [ ] Drop center diagnostic column from panels

### Task 3: Tooth Inspector (Option A)

- [ ] `InspectToothButton` when `selectedFdi`
- [ ] `ToothInspectorDrawer` wrapping tabs + `DiagnosticBody`
- [ ] Workspace state `inspectorOpen`; never open on tooth click alone

### Task 4: Procedure Builder drawer

- [ ] `ProcedureBuilderDrawer` — presets, phase toggle, requires selected tooth
- [ ] Planner header / CTA opens it; wire `addCdtProcedure` + `movePhase`

### Task 5: Wire overlays + tour

- [ ] Enable book drawer from chart path or keep RequiredTreatmentsSection
- [ ] Update `chartingTour` steps for split + inspect
- [ ] `yarn test` green; clear `todo.md`
