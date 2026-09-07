# Hide chairside fees + clinical notes

Date: 2026-09-05

## Goal

Chairside EHR shows clinical planning only — no prices. Dentists add clinical notes from the header or any procedure card.

## Decisions

- Fees remain in Supabase / Settings; chairside UI hides them (chips, rows, estimator, export body).
- Procedure cards show CDT code, title, tooth badge, booking status, **Book**, **Add Note**.
- Footer is Book Appointment + Export Pre-Auth + Send Patient Summary (no Gross/Discount/Balance).
- Clinical notes are session state (`ClinicalNote[]`) with Framer Motion modal; toast on save. Persist to Supabase later if needed.

## Files

- `src/services/clinical_notes/` — types + helpers
- `ClinicalNoteModal` + `ClinicalNoteModalBody` + `useClinicalNotes`
- Refactored `CdtProcedureRow`, `CdtPlanner`, `PlannerActions`, `CdtChipGrid`
- Header `+ Note` on `DashboardHeader`
