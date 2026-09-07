# Charting 2-Column Split + Contextual Drawers

**Date:** 2026-09-04  
**Status:** Approved (Option A + color revert)

## Goal

Replace the 3-column Charting bento with a **50/50 split** so care buckets and fees stay visible while charting. Heavy diagnostics move into **intentional** right slide-over drawers.

## Color revert

Restore the pre–amber-polish clinical/EHR accents used elsewhere in patient UI:

| Role | Token |
|------|--------|
| Canvas | `#F8FAFC` |
| Cards | `bg-white rounded-2xl border-slate-200/80 shadow-sm` |
| Ink / mute | `#0F172A` / `#64748B` |
| Selection focus | Brand yellow `#E2F163` (not amber) |
| Primary actions | `#2563EB` |
| Segment active | White pill on soft gray track (not slate-900 fill) |
| Decay / filling / crown | `#EF4444` / `#3B82F6` / `#10B981` |
| Severity badges | Soft red / amber / green as today |
| Fee summary | `bg-slate-900 text-white` |

## Layout

- **Left 50%:** Chart card (toolbar + odontogram + Inspect CTA) stacked above Required treatments.
- **Right 50%:** CdtPlanner only (lanes, fee switcher, dark summary, Book Appointment).

## Interaction — Option A

- Tooth click = select / paint only. Does **not** open a drawer.
- When a tooth is selected, show `[Inspect Tooth Details]`; that opens the Tooth Inspector drawer.
- Financial pane remains visible during multi-tooth tagging.

## Drawers

1. **Tooth Inspector** — `SideDrawer`; tabs Imaging / Vitality / Perio / Notes; reuse `DiagnosticBody`.
2. **Procedure Builder** — presets, optional fee, Immediate vs Planned; calls `addCdtProcedure` (+ phase move if needed).
3. **Appointment** — existing `TreatmentBookDrawer` (enable from chart overlays or keep on Required treatments).

## Soft refactor

Reuse `ChartingCard`, `CdtPlanner`, `DiagnosticPane`/`Body`, `RequiredTreatmentsSection`, `SideDrawer`. Replace `CHART_BENTO` with a 2-column split. Update tour copy for chart → inspect → planner.

## Out of scope

New calendar UI, Settings fees, 3D teeth, color redesign beyond the revert table above.
