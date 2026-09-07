# Chairside patient profile simplify (admin)

Date: 2026-09-04

## Goal

Make `/admin/patients/[patientKey]` a **dentist chairside** screen: one primary loop — tooth → surfaces → treatment → fee/book — without four top tabs or a three-column charting bento. History, Clinical, and Teeth remain reachable under **Records**, not as peer tabs.

## Decisions (approved)

| Topic | Choice |
| --- | --- |
| Pain | All of the above: tabs, 3 columns, overlapping surfaces |
| Primary user | Dentist chairside (speed) |
| Default loop | Chart + planner only |
| Approach | Two-pane chairside; Records menu; diagnostics as drawer |

## Non-goals

- Rewriting History / Clinical / Teeth content
- New CDT catalog, insurance EDI, or DICOM
- New shared UI primitives under `src/components/ui/`
- Removing data hooks or services
- Patient-facing chart
- Hard-deleting History / Clinical / Teeth routes or components (only demote from primary chrome)

## Information architecture

**Default patient screen** = chairside workspace. No `History | Clinical | Teeth | Charting` tab bar.

**Header (thin):** display name · back/search · **Records** menu · optional notation/dentition controls stay on the chart toolbar (not new top tabs).

**Records menu** opens existing views as overlay/sheet (preserve chairside selection + planner state on close):

1. History → `PatientHistoryView`
2. Clinical → `PatientEhrView`
3. Chart style → `PatientTeethPane` (teeth chart picker)

**Chairside body:** two panes — **Chart** | **Planner**.

**Diagnostics** (imaging / vitality / perio / SOAP for selected tooth) use existing `ToothInspectorDrawer` / charting drawers — not a permanent third column.

## Layout & interaction

### Desktop (≥ md)

~60% Chart | ~40% Planner under the header. Keep gray `patientSkin` shell (`PATIENT_SHELL`, panel tokens).

### Mobile

Chart full width; Planner stacks below or opens as bottom sheet. Records stays in header menu.

### Visit loop

1. Tap tooth → selection highlight; open inspector drawer (or Diagnose control)
2. Paint surfaces / choose paint tool on chart
3. Preset chips or add CDT on planner (prefer selected tooth when set)
4. Adjust phase / fee / rate
5. Book or open Booked replace flow on the row

### Empty states

- No tooth selected: chart shows centered “Select a tooth”; planner still lists the full plan (not blocked)
- Diagnostics drawer closed until a tooth is selected (or user opens Diagnose)

### Records

Menu → overlay/sheet with chosen view; dismiss returns to the same chairside state (selected FDI + planner items intact).

## What moves / what stays

### Stays (reuse)

- `SurfaceOdontogram`, paint tools, `CdtPlanner`, presets, fees, booking
- `ToothInspectorDrawer`, `ProcedureBuilderDrawer`, `ChartingDrawers`
- `PatientHistoryView`, `PatientEhrView`, `PatientTeethPane` (content)
- `usePatientToothNotes` / imaging / treatments hooks
- Gray `patientSkin` + charting skin tokens (adapt bento to 2 columns)

### Changes

- `PatientHistoryDashboard`: default = chairside charting workspace; drop tab-driven primary nav
- `DashboardHeader`: identity + search + **Records** (replace `DashboardTabBar` as primary)
- `ChartingPanels` / `CHART_BENTO`: two columns Chart | Planner; remove permanent Diagnostics column
- Tooth select wires to inspector drawer instead of filling a left diagnostics pane

### Demoted from primary UI

- Four-tab `DashboardTabBar`
- Three-column charting layout (`diagnostics | chart | planner`)

## Architecture notes

```
PatientHistoryDashboard
  DashboardHeader (Records menu)
  PatientChartingWorkspace          ← always mounted as primary
    ChartingToolbar
    ChartingPanels (2-col)
      Chart card → SurfaceOdontogram
      Planner card → CdtPlanner
    ChartingDrawers (inspector + builder)
  RecordsOverlay (conditional)
    history | clinical | teeth panes
```

URL stays `/admin/patients/[patientKey]`. Optional query `?records=history|clinical|teeth` may open Records for deep links; not required for v1.

## Error handling

- Existing toast patterns for save/book failures unchanged
- Closing Records never discards unsaved chairside draft state beyond what today’s charting already does
- Invalid FDI after Adult/Child switch: clear selection (existing behavior)

## Testing

- Unit: Records menu state machine (open/close, which pane); 2-col panel render order (chart then planner)
- Manual: select tooth → drawer; paint → preset → book; open History from Records → close → selection preserved
- No new E2E required for v1

## Success criteria

- Opening a patient lands on chart + planner with no tab bar
- Dentist can complete tooth → treat → book without leaving the primary screen
- History / Clinical / Teeth reachable in ≤2 clicks via Records
- Diagnostics never occupy a permanent third column on desktop
