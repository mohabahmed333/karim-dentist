# Admin AI Actions — Design

Date: 2026-09-07

## Goal
Confirmation-first admin AI that updates Customization/CMS content and performs doctor-approved clinical operations (charting, treatments, records, imaging attach, follow-up) from Reception chat and patient workspace chat.

## Architecture
- Model is read-only: returns `proposedActions` + reply.
- Server registry (`src/services/admin_ai`) validates allowlisted actions, builds diffs/snapshots, stores proposals, executes on Confirm.
- Stale snapshot hash / expiry / ownership checks prevent unsafe writes.
- Audit events record proposed / confirmed / failed / stale outcomes.
- Navigation actions may run immediately; every write requires Confirm.

## Non-goals
Source-code generation; automatic image diagnosis; unattended writes.
