# SinglePatient3DDashboard (design notes)

Date: 2026-09-05

## Goal

Dentist-first clinical dashboard: 3D arch drives selection; real patient treatments/imaging feed the queue; quick CDT + AI chips are session-local.

## Decisions

- Embed `AnatomicalArchViewer` (same as EHR).
- Real `PatientGroup` + `PatientTreatmentRow[]` + `PatientImaging[]`.
- View pills are visual-only (chairside stays on arch).
- Quick CDT appends session rows; keep `selectedUniversal`.
- Age/allergy not in schema → visits/phone + “Confirm allergies”; balance = open/scheduled fees (EGP).
- 2D mock `SinglePatientDashboard` kept on disk; profile view mounts 3D shell.
