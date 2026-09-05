# SinglePatientDashboard (mock rebuild v1)

Date: 2026-09-05

## Goal

Replace the patient detail page UI with a clean, modular clinical dashboard so we can rebuild tabs one by one. V1 is **mock data only** and a **route-level swap** (old dashboard files untouched).

## Decisions

- **Data:** Local mock patient + seed treatments. Ignore server props from `AdminPatientDetailPage` for now.
- **Quick actions:** Fill / Crown / Extract append a treatment row (placeholder CDT, severity, fee); keep `selectedTooth`.
- **Generate Note:** Insert a fixed placeholder string into the AI notes textarea (no API).
- **Integration:** `PatientProfileView` renders `SinglePatientDashboard` only. Do not comment inside `PatientHistoryDashboard` / old tab files.
- **Numbering:** Universal adult chart — upper 1–16, lower 17–32.
- **Visual:** Clinical light mode — white surfaces, `#e5e7eb` borders, blue `#2563eb` selection, red medical alert, severity pills (Critical red / Minor yellow). Align with `.cursor/rules/frontend-design-dental.mdc`.

## Architecture

```
PatientProfileView
  └── SinglePatientDashboard  (selectedTooth, treatments)
        ├── PatientHeader
        └── Dashboard grid
              ├── Left: Odontogram + TreatmentTable
              └── Right: ActionPanel
```

### State

| State | Type | Notes |
|-------|------|--------|
| `selectedTooth` | `number \| null` | Set by odontogram click |
| `treatments` | `Treatment[]` | Seeded from mock; mutated by quick actions |
| `clinicalNotes` | `string` | Local to ActionPanel (or lifted if needed) |

### Treatment shape

```ts
type TreatmentSeverity = "Critical" | "Minor";

type Treatment = {
  id: string;
  tooth: number;
  cdtCode: string;
  procedureName: string;
  severity: TreatmentSeverity;
  fee: number;
};
```

### Condition colors (odontogram)

Teeth with an existing treatment in the array get a condition tint (e.g. `bg-red-100` for Critical, `bg-yellow-100` for Minor). Selected tooth uses blue ring / `bg-blue-100`.

## Components

| File | Role |
|------|------|
| `single-patient-dashboard/SinglePatientDashboard.tsx` | Layout + state |
| `PatientHeader.tsx` | Name, age, Medical Alert badge, balance |
| `Odontogram.tsx` | 2×16 clickable tooth buttons |
| `TreatmentTable.tsx` | List + severity pills + X-ray placeholder thumbs |
| `ActionPanel.tsx` | Empty prompt or tooth actions + notes |
| `types.ts` | Shared types |
| `mockData.ts` | Mock patient + initial treatments |

Keep each file near the project ~100-line guidance; named exports; no `any`.

## Layout

- Desktop: two columns — left chart+history (~2/3), right action panel (~1/3).
- Mobile: stack header → odontogram → treatment table → action panel.
- No cards-as-decoration beyond bordered clinical panels; keep borders subtle.

## Wiring

1. Change `PatientProfileView` to import and render `SinglePatientDashboard`.
2. Leave `PatientHistoryDashboard` and related tab files unchanged on disk.
3. Server page may keep fetching real data; unused props can remain on `PatientProfileView` signature for a later re-wire (or accept `_` unused with existing props to avoid churn).

## Non-goals (v1)

- Supabase persistence
- Real CDT catalog / fee lookup
- 3D / GLTF chart
- Bottom `PatientViewTabs` / history / imaging / workspace
- Real AI note generation

## Success criteria

- Opening any patient detail URL shows the new mock dashboard.
- Clicking a tooth selects it and unlocks ActionPanel.
- Fill / Crown / Extract appends a row visible in TreatmentTable and tints that tooth.
- Generate Note fills the textarea with placeholder text.
- Old history-dashboard modules still compile (unused) and can be reattached later.
