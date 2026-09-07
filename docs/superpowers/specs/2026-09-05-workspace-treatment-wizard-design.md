# Workspace required-treatment wizard

Date: 2026-09-05

## Goal
On `/admin/patients/[patientKey]/workspace`, selecting a tooth drives a full required-treatment flow on the right.

## Behavior
1. Right pane shows Required treatments filtered to the selected FDI.
2. **+ Add** opens a wizard with tooth locked from the chart:
   - **Treatment (CDT)** — clinic menu from Settings fees; fee auto-fills; optional EGP override
   - Severity → Last treatment → Clinical → Attachments → Optional book
3. Save persists `cdt_code`, `phase`, `fee_amount` with clinical fields.
4. Accordion shows CDT code; fee stays stored (not shown chairside).
5. Left chart tooth-note popover unchanged.

## Out of scope
CDT planner on workspace right pane; classic patient tabs unchanged.
