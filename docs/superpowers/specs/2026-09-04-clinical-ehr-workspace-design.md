# Clinical EHR Charting workspace (admin)

Date: 2026-09-04

## Goal

Add a **Charting** tab on `/admin/patients/[patientKey]` that is a three-panel clinical workstation: a 5-surface odontogram, a tooth-scoped diagnostic column (imaging lightbox, vitality, perio, SOAP notes), and a CDT-coded phased treatment planner with a fee estimate. History, Clinical, and Teeth tabs stay unchanged. Charting is another view of the same patient notes, imaging, and treatments.

## Non-goals

- Replacing the Teeth tab or the Clinical condition-graph EHR
- True DICOM / PACS / `.dcm` parsing, window-level from modality headers, 3D CBCT reconstruction
- Full ADA CDT book, 837D / EDI pre-authorization, insurer eligibility APIs
- Email vendor for estimates (mailto + toast only)
- Per-line insurance percentages
- Autosave of vitality/perio on every toggle
- Patient-facing chart, primary-care medical EHR, e-prescribing
- New shared UI primitives in `src/components/ui/`
- `@dnd-kit` or other new drag libraries

## Layout

Patient dashboard tabs: `History | Clinical | Teeth | Charting`. Default remains History.

Charting desktop (~16 columns): left 5 (chart), center 7 (diagnostics), right 4 (planner). Chart column stays in view; center and right scroll. Mobile stacks chart → diagnostics → planner.

No tooth selected: center shows “Select a tooth to open diagnostics.” Planner Add is disabled. Imaging/vitality/perio/SOAP stay empty until a tooth is selected.

```
┌ [FDI | Universal | Palmer]  [Adult | Child]  paint palette  color legend ┐
├───────────────┬──────────────────────────┬──────────────────────────────┤
│ 5-surface     │ Imaging | Vitality |     │ Phase 1 Urgent               │
│ odontogram    │ Perio | SOAP             │ Phase 2 Restorative          │
│               │ lightbox / tests / notes │ Phase 3 Prosthodontic        │
│               │                          │ Gross / insurance / OOP      │
│               │                          │ Book · Pre-auth · Estimate   │
└───────────────┴──────────────────────────┴──────────────────────────────┘
```

Visual language follows the patient clinical rule: white cards, `#e5e7eb` borders, blue `#2563eb` for the selected tooth, sans-serif only. Clinical status colors are only the four paint fills below — not a second brand palette.

## Chart (left)

### Identity

Canonical id is **FDI** (adult `11–48`, primary `51–85`). Regex: `^([1-4][1-8]|[5-8][1-5])$`.

Dentist view: patient’s right on the left. Adult 32 teeth; child 20 teeth (FDI `51–55, 61–65, 71–75, 81–85`).

Toolbar label systems (display only):

| System | Adult | Child |
| --- | --- | --- |
| FDI | 11–48 | 51–85 |
| Universal | #1–#32 | A–T |
| Palmer | quadrant ticks + 1–8 | quadrant ticks + A–E |

Switching Adult/Child clears the selection if the current FDI is not in the new set. Notation does not change stored ids.

### Glyph

Each tooth is five clickable cells:

```
        [ facial / buccal ]
[ mesial ] [ occlusal / incisal ] [ distal ]
        [ lingual / palatal ]
```

Anterior: incisal + facial. Posterior: occlusal + buccal. Maxilla lingual cell is palatal; mandible is lingual. Mesial is toward the midline (screen-left on Q1/Q4, screen-right on Q2/Q3).

### Paint

Palette (single selected tool): **Select · Decay · Filling · Crown · Missing · Clear**.

- Click the number, or any cell with Select: set `selectedFdi`.
- Decay / Filling: paint that **surface** only (`decay` = `#EF4444`, `filling` = `#3B82F6`).
- Crown: set whole-tooth `crown` (`#10B981` overlay). Surfaces kept but not clickable until Clear.
- Missing: set whole-tooth `missing` (muted gray + **X**). Surfaces disabled.
- Clear on a surface: that surface → `unmarked`. Clear on a crown/missing tooth: whole → `none`, surfaces unmarked.
- Arrow keys move selection within the active dentition. Escape clears selection.

Unmarked enamel is a light outline only. Teeth with notes are not auto-blue; Charting color is surface status only. Selected tooth: `#2563eb` ring on the glyph.

### Persistence

Table `patient_tooth_surfaces`:

```
id uuid PK
patient_key text NOT NULL
fdi_number text NOT NULL  CHECK (^([1-4][1-8]|[5-8][1-5])$)
dentition text NOT NULL CHECK (adult | primary)
mesial, distal, occlusal, facial, lingual
  text NOT NULL DEFAULT 'unmarked' CHECK (unmarked | decay | filling)
whole text NOT NULL DEFAULT 'none' CHECK (none | crown | missing)
updated_at timestamptz
UNIQUE (patient_key, fdi_number)
```

RLS: authenticated admin, same `is_admin()` pattern as `patient_tooth_notes`. One upsert per paint click; one row per tooth.

## Diagnostics (center)

Tabs: **Imaging · Vitality · Perio · SOAP**. All scoped to `selectedFdi`.

### Imaging

Lightbox of `patient_imaging` plus treatment attachments (`kind` xray/image) that match the tooth:

1. `patient_imaging.tooth_fdi === selectedFdi`, else
2. Adult only: `fdiForUniversal(tooth_number) === selectedFdi`.

Newest match auto-displays. Controls: zoom, pan, invert, prev/next. Empty: “No radiograph linked to this tooth” and an upload that uses the existing imaging mutation with `tooth_fdi` set and `tooth_number` = Universal for adult, `null` for primary.

Not a DICOM viewer: raster/PDF only, as today.

Migration: `patient_imaging.tooth_fdi text` nullable, same FDI check as surfaces (or null).

### Vitality

Cold: `normal | lingering | negative`. EPT: integer 0–80. Percussion: `negative | positive`. Mobility: `0 | 1 | 2 | 3` (label Class I–III for 1–3).

**Save to SOAP** (disabled until Cold is chosen): insert a tooth note:

`O: Cold {label} · EPT {n} · Perc {−|+} · Mobility {0|I|II|III}`

Toast on success/failure (existing `sonner` pattern). Local widget state clears after a successful save. No autosave. No vitality table.

### Perio

Six probing sites in order: DF, F, MF, DL, L, ML. Each: depth 1–9 mm and BOP boolean. Recession: F and L, 0–9 mm.

Depth color: 1–3 default, 4–5 amber `#F59E0B`, 6–9 `#EF4444`.

**Save to SOAP**:

`O: PD DF{n} F{n} MF{n} DL{n} L{n} ML{n} · BOP {sites or none} · REC F{n} L{n}`

Same toast/clear rules as vitality.

### SOAP

Existing `patient_tooth_notes` for `selectedFdi`, newest first, plus the current composer. Widen note `fdi_number` CHECK and Zod to the adult+primary regex so child charting can save.

## Planner (right)

Same `patient_treatments` rows as the Teeth tab. Full plan always listed. Rows whose `tooth_fdi === selectedFdi` are full contrast; others muted.

### New columns

```
cdt_code text NULL
  CHECK (cdt_code IS NULL OR cdt_code ~ '^D[0-9]{4}$')
phase text NOT NULL DEFAULT 'restorative'
  CHECK (phase IN ('urgent', 'restorative', 'prosthodontic'))
fee_amount integer NOT NULL DEFAULT 0 CHECK (fee_amount >= 0)
```

Widen `tooth_fdi` CHECK to adult+primary. Regenerated `database.types.ts` after push.

### Catalog

Static module `src/services/cdt/catalog.ts`. Curated codes only (not the full CDT book). Each entry:

`{ code, title, defaultPhase, defaultFee }`

`defaultFee` is whole EGP. Picker label: `D3330 — Endodontic therapy, molar`.

Default phase from code (override by drag):

- `urgent`: D0140, D3220, D7xxx, D9xxx except D9944 and D9972, plus D7510
- `restorative`: D1xxx, D2xxx, D3xxx, D4xxx
- `prosthodontic`: everything else (D5, D6, D8, D9944, D9972)

Minimum catalog (code → defaultPhase, defaultFee EGP):

| Code | Title | Phase | Fee |
| --- | --- | --- | --- |
| D0140 | Limited oral evaluation, problem focused | urgent | 500 |
| D9110 | Palliative treatment of dental pain | urgent | 800 |
| D3220 | Therapeutic pulpotomy | urgent | 1500 |
| D7510 | Incision and drainage of abscess | urgent | 2000 |
| D7140 | Extraction, erupted tooth | urgent | 1200 |
| D7210 | Extraction, surgical | urgent | 2500 |
| D2391 | Resin composite, one surface posterior | restorative | 1500 |
| D2392 | Resin composite, two surfaces posterior | restorative | 2000 |
| D2393 | Resin composite, three surfaces posterior | restorative | 2500 |
| D2330 | Resin composite, one surface anterior | restorative | 1400 |
| D3310 | Endodontic therapy, anterior | restorative | 4000 |
| D3320 | Endodontic therapy, premolar | restorative | 5000 |
| D3330 | Endodontic therapy, molar | restorative | 6500 |
| D2740 | Crown, porcelain/ceramic | restorative | 8000 |
| D2950 | Core buildup | restorative | 2000 |
| D4341 | Periodontal scaling and root planing, per quadrant | restorative | 1800 |
| D6010 | Surgical placement of implant body | prosthodontic | 15000 |
| D6058 | Abutment supported porcelain/ceramic crown | prosthodontic | 9000 |
| D6240 | Pontic, porcelain fused to high noble metal | prosthodontic | 7000 |
| D9944 | Occlusal guard | prosthodontic | 3500 |
| D9972 | External bleaching, per arch | prosthodontic | 4000 |

Add procedure: requires selected tooth. Creates a treatment with that FDI, catalog title as `last_treatment`, catalog code/phase/fee, severity `Minor` (D7/D9/D0140/D3220/D7510 → `Critical`). Toast on success.

### Phases

Three buckets, labels:

- Phase 1: Urgent / emergency (pain & active infection)
- Phase 2: Restorative & endodontic
- Phase 3: Prosthodontic & elective

Pointer drag moves a row to another bucket and `updatePatientTreatment({ phase })`. Persist immediately. No new drag library: HTML5 drag or pointer events in the feature folder.

Status chips remain `open | scheduled | done`. Book appointment uses the existing `TreatmentBookDrawer`.

### Fees

Plan-level insurance % in React state, persisted in `localStorage` key `charting.insurancePct:{patientKey}`, integer 0–100, default 50. Not a database column.

Let `billable` = treatments with `status` in `open`, `scheduled`.

```
gross = sum(fee_amount of billable)
insurance = round(gross * pct / 100)
oop = gross - insurance
```

Display EGP, no cents. Done rows excluded.

### Actions

- **Book appointment**: each procedure row has Book; it opens the existing `TreatmentBookDrawer` for that row. The footer Book button opens it for the selected tooth’s first `open` row, or is disabled if none.
- **Export pre-auth**: download `preauth-{safePatientKey}-{yyyy-mm-dd}.txt` listing patient name, date, each billable row (notation, CDT, title, phase, fee), then gross / insurance % / OOP. Toast “Pre-auth exported”.
- **Send patient estimate**: `mailto:` with subject `{name} — treatment estimate` and the same figures in the body. Toast “Estimate opened in mail”.

## Interfaces

### Notation (`src/services/notation/`)

```
type Dentition = "adult" | "primary"
type NotationSystem = "fdi" | "universal" | "palmer"
type SurfaceId = "mesial" | "distal" | "occlusal" | "facial" | "lingual"
type SurfaceStatus = "unmarked" | "decay" | "filling"
type WholeStatus = "none" | "crown" | "missing"

fdiSet(dentition): readonly string[]
displayTooth(fdi: string, system: NotationSystem): string
universalForFdi(fdi: string): number | string | null
  // adult → 1–32; primary → A–T; invalid → null
fdiForUniversalAdult(n: number): string | null
```

Palmer display: `1┘` style using Unicode quadrant corners. Invalid FDI → empty string, never throw.

### Surfaces

```
upsertToothSurfaces(patientKey, fdi, patch: Partial<surface columns>): Promise<row>
listToothSurfaces(patientKey): Promise<row[]>
```

Errors: throw; UI toasts `Failed to save chart` / success silent or “Chart updated” only on debounce flush — prefer toast on error only (paint is high-frequency).

### Treatments (extend existing)

`treatmentUpsertSchema` adds optional `cdt_code`, `phase`, `fee_amount`; `tooth_fdi` uses the widened regex.

`defaultPhaseForCdt(code: string): "urgent" | "restorative" | "prosthodontic"`

`planTotals(rows, pct): { gross, insurance, oop }`

### Notes / imaging

Widen note Zod FDI. Imaging create accepts optional `tooth_fdi`. Match helper `imagingForFdi(items, fdi): PatientImaging[]`.

### UI state (`useChartingSession`)

```
selectedFdi: string | null
dentition: Dentition
notation: NotationSystem
paintTool: "select" | "decay" | "filling" | "crown" | "missing" | "clear"
diagTab: "imaging" | "vitality" | "perio" | "soap"
insurancePct: number
```

Reuse `usePatientToothNotes`, `usePatientImaging`, `usePatientTreatments` from the dashboard parent (same hooks already constructed in `PatientHistoryDashboard`).

## Data flow

1. Dashboard adds tab `charting`. `PatientChartingWorkspace` receives `group`, notes/imaging/treatments hook results, `services`.
2. Load surfaces for `patient_key` on mount.
3. Select tooth → filter imaging, notes, highlight treatments.
4. Paint surface → optimistic local map → upsert row.
5. Save vitality/perio → `createToothNote` → notes list prepends → toast.
6. Add CDT → `createPatientTreatment` → appears in phase bucket.
7. Drag phase → `updatePatientTreatment`.
8. Insurance slider → localStorage.
9. Export / mailto are client-only; no API.

## Error handling

| Failure | Observable |
| --- | --- |
| Surfaces upsert fails | Revert optimistic cell; `toast.error` |
| Note save fails | Keep widget values; `toast.error`; button re-enabled |
| Treatment create/update/delete fails | Existing treatment toasts |
| Imaging upload fails | Existing imaging toasts |
| No tooth selected + Add | Button disabled, no toast |
| Invalid FDI from URL/state | Ignore; treat as no selection |
| mailto blocked | Toast still fires; user may see no mail app |
| Missing catalog code on old row | Show `last_treatment` only; phase bucket from `phase` column |

Deletes stay on `ConfirmDeleteDialog` (treatments, notes, imaging) — Charting does not add new delete paths except reusing those dialogs.

## File plan (≤100 lines each)

Feature: `src/features/admin/components/patients/charting/`

- `PatientChartingWorkspace.tsx` — three-column shell
- `ChartingToolbar.tsx` — notation, dentition, palette, legend
- `SurfaceOdontogram.tsx` — arches
- `SurfaceToothGlyph.tsx` — one 5-cell tooth
- `DiagnosticPane.tsx` — tab bar + empty state
- `ImagingLightbox.tsx`
- `VitalityCard.tsx`
- `PerioStrip.tsx`
- `SoapLog.tsx` — wraps existing note list/composer
- `CdtPlanner.tsx` — phase buckets
- `CdtPhaseLane.tsx`
- `CdtProcedureRow.tsx`
- `FeeEstimator.tsx`
- `PlannerActions.tsx`
- `useChartingSession.ts`

Services: `src/services/notation/`, `src/services/cdt/`, `src/services/tooth_surfaces/`.

Migration: `supabase/migrations/20260904180000_charting_workspace.sql` (timestamp after existing 20260904 files).

No new files under `src/components/ui/`.

## Acceptance criteria

1. **Tab** — Given a patient profile, When the dentist opens Charting, Then History/Clinical/Teeth still exist and Charting shows the three-panel workspace.
2. **Notation** — Given an adult chart, When switching FDI / Universal / Palmer, Then stored FDI is unchanged and labels update (11 ↔ #8 ↔ Palmer 1 for upper right central).
3. **Child** — Given Child dentition, When the chart renders, Then 20 primary teeth (51–85) appear and adult 11–48 do not.
4. **Surfaces** — Given Decay is selected, When the dentist clicks the mesial cell of 16, Then that cell is `#EF4444` and other cells of 16 stay unmarked.
5. **Whole tooth** — Given Missing is selected, When any cell of 48 is clicked, Then 48 shows gray + X and surface clicks do nothing until Clear.
6. **Select drives panes** — Given 26 is selected, When imaging/notes/treatments exist for 26, Then the lightbox, SOAP, and highlighted planner rows are those of 26.
7. **SOAP save** — Given vitality Cold = Lingering, When Save to SOAP is clicked, Then a new objective note is stored for that FDI and the widget resets; toggling Cold alone does not write.
8. **CDT add** — Given 36 selected and D3330 chosen, When added, Then a treatment row appears in Phase 2 with code D3330, title Endodontic therapy, molar, and default fee 6500.
9. **Drag phase** — Given that row, When dropped on Phase 1, Then `phase` persists as `urgent` and the row renders in Phase 1 after reload.
10. **Fees** — Given billable fees 6500 + 8000 and insurance 50%, Then Gross 14500, Insurance 7250, OOP 7250; a `done` row is excluded.
11. **Actions** — Export downloads a `.txt` pre-auth; Send estimate opens `mailto:`; Book opens the existing appointment drawer.
12. **Isolation** — Teeth tab still uses its chart styles and treatment accordion; no 5-surface palette there.

## Tests

Run `yarn test`.

- `src/services/notation/notation.test.ts` — adult/primary sets, FDI↔Universal↔Palmer labels, invalid FDI
- `src/services/cdt/cdt.test.ts` — defaultPhaseForCdt, catalog codes unique, planTotals (done excluded, rounding)
- `src/services/tooth_surfaces/schemas.test.ts` — surface enum, whole enum, FDI regex adult+primary, reject FDI `19` and `56`
- `src/services/patient_tooth_notes/schemas.test.ts` — accept `51`, reject `19`
- `src/services/patient_treatments/schemas.test.ts` — accept cdt `D3330`, reject `3330`; accept primary `74`

## Corrections to the original brief

- New **Charting** tab; Teeth is not replaced.
- Imaging is a raster lightbox, not DICOM.
- Insurance % is plan-level, not per CDT line.
- Vitality/perio persist only as SOAP notes, via explicit save.
- Missing and Crown are whole-tooth tools.
- Fees are whole EGP, not USD cents.
- CDT list is curated, not the full ADA codebook.
