# Patients table + reservation-form patient picker

## Problem

The reservation form has no way to book against an existing patient. Patient
identity today is entirely derived at query time: `patientKeyFromReservation`
(`src/services/reservations/patientHistory.ts`) computes a key of
`phone:<canonical-digits>` (or `name:<lowercased-name>` when no phone) from
whatever `patient_name`/`phone` was typed into a reservation. There is no
table row that represents "a patient" independent of a reservation, so a
reservation form can't offer "pick an existing patient" — there's nothing
queryable to pick from.

`patient_key` (the same derived string) is also used, unlinked, as a bare
text column across 13+ other tables: `patient_profiles`, `treatment_proposals`,
`patient_treatments`, `patient_imaging`, `patient_tooth_findings`,
`patient_tooth_notes`, `patient_tooth_surfaces`, `patient_clinical_notes`,
`patient_chart_findings`, `patient_prescriptions`, `patient_lab_orders`,
`whatsapp_conversations`, `patient_billing_entries` — plus ~700 references
across services, admin AI tools, WhatsApp integration, reception flows,
command palette search, and tests.

## Scope

This is stage 1 of a larger migration away from the derived-key model,
decomposed as:

1. **This spec** — introduce a real `patients` table with a stable `uuid`
   id, backfill it from every existing derived `patient_key`, add
   `reservations.patient_id`, and build the existing/new-patient picker in
   the reservation form.
2. **Future** — migrate the other 12 consumer tables from bare `patient_key`
   text columns to a real `patient_id` FK, one table at a time.
3. **Future** — once every consumer is migrated, retire whatever's left of
   the old derive-on-read approach.

Stages 2 and 3 are explicitly out of scope here. This spec is written so
that none of those 12 tables need to change: every patient that already has
a `patient_key` keeps that exact value, and new patients created through the
reservation form get a `patient_key` computed with the same existing
algorithm — so lookups against those tables keep working unchanged.

## Schema & migration

**New `patients` table**, replacing `patient_profiles` (merge, not
alongside):

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
patient_key     text NOT NULL UNIQUE   -- carried over unchanged from patient_profiles/derived keys
display_name    text NOT NULL DEFAULT ''
phone           text NOT NULL DEFAULT ''
email           text
date_of_birth   date
age_years       integer CHECK (age_years IS NULL OR (age_years BETWEEN 0 AND 130))
gender          text NOT NULL DEFAULT '' CHECK (gender IN ('','female','male','other','prefer_not'))
medical_history text[] NOT NULL DEFAULT '{}'
allergies       text[] NOT NULL DEFAULT '{}'
medications     text NOT NULL DEFAULT ''
notes           text NOT NULL DEFAULT ''
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

Index on `patient_key` (as `patient_profiles` already had). RLS: same
`is_admin()`-gated all-access policy as `patient_profiles` had.

Migration steps:

1. Rename/recreate `patient_profiles` → `patients` (same columns, same
   `patient_key` values preserved 1:1). Existing rows carry over as-is.
2. Backfill: for every `patient_key` produced by
   `patientKeyFromReservation()` across existing reservations that has no
   matching row in `patients` yet, insert a minimal row (`patient_key`,
   best-available `display_name`/`phone`/`email` taken from that patient's
   most recent reservation).
3. Add `reservations.patient_id uuid REFERENCES patients(id)`, nullable.
   Backfill by joining each reservation's derived `patientKeyFromReservation()`
   value to `patients.patient_key`.
4. `reservations.patient_name` / `phone` / `email` are unchanged — they
   remain a booking-time snapshot, independent of `patients`. This is a
   deliberate choice: it keeps every existing reader of those columns
   working untouched, and lets staff correct a typo for one booking without
   touching the patient's master record.

## Reservation form UX

`ReservationFormFields` gets a mode toggle: **Existing patient** / **New
patient**.

- **Existing patient**: a debounced search (name or phone, `ILIKE`) against
  `patients` renders matches in a combobox. Selecting one sets `patient_id`
  and prefills `patient_name`/`phone`/`email` (still editable, since they're
  a snapshot for this booking).
- **New patient**: fields start blank; `patient_id` stays null until submit.

**Submit logic** (server action, in `src/services/reservations`):

- If `patient_id` is already set (existing-patient mode), use it directly.
- If not (new-patient mode), compute the prospective `patient_key` from the
  submitted name/phone using the existing `patientKeyFromReservation`
  algorithm:
  - No `patients` row with that key → insert one, use the new id.
  - A row already exists with that key (staff typed a phone/name that
    already matches a patient) → reuse that patient's id instead of
    violating the `patient_key` unique constraint. Surface this the same
    way the current "existing reservation found" flow already does
    (`ReservationFormDialog.tsx:74-102` — the existing phone/name match →
    new-vs-replace prompt), reframed as "this matches an existing patient,
    using their record."

## Explicitly out of scope

- Merging patient records that were already duplicated before this
  migration.
- The pre-existing limitation where a shared household phone number
  collapses multiple people into one derived key — unchanged by this work.
- Migrating any of the other 12 `patient_key`-keyed tables, or `database.types.ts`
  regeneration beyond what `patients`/`reservations` need — future stage.

## Testing

- Migration: verify every existing `patient_key` value (from
  `patient_profiles` and from reservations with no matching profile) has
  exactly one `patients` row after backfill, and every reservation's
  `patient_id` resolves to the same `patient_key` its
  `patientKeyFromReservation()` would compute.
- Service layer: unit tests for the new/existing-patient submit branching in
  the reservation create action (new patient, existing patient by id,
  new-patient path that collides with an existing key).
- Component: form tests for the mode toggle, search/select flow, and prefill
  behavior.
