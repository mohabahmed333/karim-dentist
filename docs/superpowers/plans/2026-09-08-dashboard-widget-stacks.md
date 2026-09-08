# Dashboard Widget Stacks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline to implement this plan task-by-task.

**Goal:** Allow widgets to occupy blank space beneath another widget in an independently resizable dashboard column.

**Architecture:** Persist a `stackId` with each placement. Group placements into stack containers in the outer 12-column grid, then render each stack as a vertical flex column. Top/bottom drops reorder within or move between stacks; left/right drops create adjacent stacks. Resizing applies to every placement in a stack.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Supabase JSONB.

## Global Constraints

- Keep clinic-wide persistence in `site_settings.dashboard_layout`.
- Preserve legacy layouts through normalization.
- Use only discrete widths `3 | 4 | 6 | 8 | 9 | 12`.

---

### Task 1: Stack data model

**Files:**
- Modify: `src/features/admin/lib/dashboardLayoutCatalog.ts`
- Modify: `src/features/admin/lib/dashboardLayout.ts`
- Modify: `src/features/admin/lib/dashboardDrop.ts`
- Test: `src/features/admin/lib/dashboardLayout.test.ts`

- [x] Add optional `stackId` and normalize legacy layouts.
- [x] Implement top/bottom stack insertion and left/right stack creation.
- [x] Make resizing affect only the selected widget (stack siblings keep their own widths).

### Task 2: Stack renderer

**Files:**
- Create: `src/features/admin/lib/dashboardStacks.ts`
- Modify: `src/features/admin/components/overview/ClinicDashboard.tsx`

- [x] Group placements into ordered stack containers.
- [x] Render each stack as one outer grid item with an inner vertical column.
- [x] Preserve per-widget drag targets and controls.

### Task 3: Verification

**Files:**
- Test: `src/features/admin/lib/dashboardLayout.test.ts`

- [x] Test independent two-column stacks, stack moves, and stack resizing.
- [x] Run focused unit tests, TypeScript diagnostics, and lints.
