# Patient odontogram (admin)

Date: 2026-09-02

## Goal

On `/admin/patients/[patientKey]`, show a three-column chart: visit history, an interactive FDI odontogram, and a comment editor for the selected tooth.

## Behavior

- Adult 32 teeth, FDI numbering, dentist view (patient’s right on the left).
- Click a tooth to make it active (dashed blue, bold number).
- Save a non-empty comment; that tooth stays solid blue.
- No row = unmarked gray outline. Clear comment deletes the row.
- Comments keyed by existing `patient_key` (phone, or name fallback).
- Reservations timeline dialog keeps compact `PatientHistoryView` (no odontogram).

## Out of scope

Pharmacy, doctor chat, PDFs, surfaces, primary teeth, patient login, 3D jaw, visit-linked comments, condition statuses.

## Tests

- `fdi.test.ts` — arches, names, types, visual states, layout uniqueness
- `schemas.test.ts` — reject empty notes; accept trimmed comment
- Run: `yarn test`
