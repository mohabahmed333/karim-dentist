# Patient billing / ledger: design

- **Date:** 2026-09-14
- **Status:** proposed
- **Area:** new admin subsystem — a "Billing" tab on the patient profile, plus a new `/admin/billing` clinic-wide balances page

## Problem

The only money-tracking in the admin panel today is the booking-deposit anti-no-show flow (`deposit_settings`/`deposit_requests`/`deposit_receipts`) — a mechanism for collecting a small hold before confirming a slot, not general billing. `patient_treatments` already carries a `fee_amount` per treatment (used by `FeeEstimator` during treatment planning), but nothing ties that fee to an actual charge, payment, or running balance. There is no way to see what a patient owes, or to record a cash/card payment taken at the desk.

## Goals

1. A per-patient running ledger: every completed treatment becomes a charge, every paid deposit becomes a credit, and staff can add manual charges or payments (cash/card/InstaPay/other) — all combined into one chronological list with a running balance.
2. A clinic-wide view of which patients have a non-zero balance, so front desk/owner can follow up without checking patients one by one.
3. Reuse existing data wherever possible — no duplicating treatment fees or deposit amounts into a new "charges" table.

## Non-goals

- **No formal invoice documents.** No invoice numbering, no PDF/printable generation, no grouping of charges into discrete invoice records. "Itemized" here means the ledger's line items, not a generated document.
- **No refunds/discounts as a distinct type.** A discount or refund is recorded as a manual "payment" entry with a note (e.g. "Discount — loyalty") rather than a dedicated adjustment kind. Revisit if this turns out to matter.
- **No payment gateway integration.** Payments are staff-entered records of money already collected elsewhere (cash in hand, a card terminal, an InstaPay transfer) — this system doesn't move money.

## Decisions

- **Only manual entries are stored.** Treatment charges and deposit payments are computed at read time from `patient_treatments` (`status = 'done'`) and `deposit_requests` (`status = 'paid'`) — the same pattern this codebase already uses for dashboard stats and the doctor-production widget (`listDoctorProductionThisWeek`), rather than materializing/duplicating amounts into a new table that could drift out of sync.
- **Deposits join through reservations, not a stored patient_key.** `deposit_requests` has no `patient_key` column — it's linked via `reservation_id`. The existing `patientKeyFromReservation()` helper (`src/services/reservations/patientHistory.ts`) is reused to attribute a deposit to a patient, exactly as the Patients directory already does for grouping reservations.
- **Clinic-wide balances computed in application code, not SQL.** Like `buildReservationStats`/`buildDashboardKpis`, the Balances page fetches done-treatments, paid-deposits (with their reservation), and manual entries, then aggregates per `patient_key` in JS. This matches the existing convention throughout `src/services/reservations/stats.ts` and avoids a new Postgres view/RPC for what is, for a single clinic, a small dataset.
- **Permissions reuse the `patients.*` category, no new `billing.*` keys** — mirrors how the deposits queue reuses `reservations.view`/`settings.view` rather than inventing its own category. Viewing the ledger/balances is gated on the existing `patients.view`; recording a payment or manual charge is gated on a new `patients.billing.edit` permission (parallel to `patients.chart.edit`/`patients.notes.edit`/`patients.treatments.edit`).
- **Default grants:** `owner` and `front-desk` get `patients.billing.edit`; the seeded `doctor` role does not (doctors can see a patient's balance via `patients.view`, but recording payments/charges is a front-desk/owner action by default — configurable per role in Roles & permissions like everything else). Front Desk's role description ("Reservations, waitlist, patients (read), and support") gets a one-line update to reflect the new write capability. Note: `owner`'s existing `CROSS JOIN` grant in `20260913150000_seed_rbac_catalog.sql` already ran and won't retroactively pick up a permission inserted by a later migration, so this migration grants both roles explicitly by key, the same way `20260913320000_multi_doctor_scheduling.sql` granted the `doctor` role's permissions.

## Data

New migration, one table:

```sql
create table patient_billing_entries (
  id           uuid primary key default gen_random_uuid(),
  patient_key  text not null,
  kind         text not null check (kind in ('charge', 'payment')),
  amount_egp   numeric not null check (amount_egp > 0),
  description  text not null,
  method       text, -- 'cash' | 'card' | 'instapay' | 'other', payments only
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);
create index patient_billing_entries_patient_key_idx on patient_billing_entries (patient_key);
```

RLS: admin-only writes (`is_admin()`), matching every other admin-editable table; reads gated the same way as `patient_treatments`.

New permission row (seed migration, category `patients`, next `sort_order` after the existing `patients.*` rows which end at 45):
```sql
('patients.billing.edit', 'patients', 'Record a patient payment or charge', 46)
```

## Service layer

New `src/services/patient_billing/` module, following the `doctor_schedule`/`profiles` file split:
- `types.ts` — `LedgerEntry = { id, date, kind, source: 'treatment'|'deposit'|'manual', amount, description, method? }`
- `queries.ts` — `listPatientLedger(supabase, patientKey, reservationIds)`: merges done-treatments + paid-deposits (given the patient's reservation ids, already available wherever this is called from — the patient detail page already fetches `group.visits`) + manual entries, sorted by date, with a running balance computed top-down. Also `listPatientBalances(supabase)` for the clinic-wide page: fetches all three sources clinic-wide, aggregates per `patient_key` in JS, returns only non-zero balances sorted descending, joined to a display name.
- `schemas.ts` — `billingEntryUpsertSchema` (kind, amount_egp > 0, description required, method required-if-payment).
- `mutations.ts` / `actions.ts` — `addBillingEntry`, `"use server"` action gated on `requirePermission("patients.billing.edit")`, mirroring `saveDoctorIdentity`'s shape.

## UI

- **Per-patient tab:** `PatientProfileTabs.tsx` gets a 5th tab, `"billing"` (alongside `information`/`history`/`next`/`medical` — confirmed this is the live component behind `/admin/patients/[patientKey]`, not one of the other experimental patient-dashboard variants under `history-dashboard/`/`single-patient-dashboard/`/`ehr-view/`). New `PatientBillingTab.tsx`: balance header, chronological entry list, "Record payment" / "Add charge" form.
- **Clinic-wide page:** new route `/admin/billing`, `AdminPageMotion` + a simple sortable list (reusing `CollectionTable` the way `ReservationsPageView`'s table does), each row linking to `patientProfilePath(patientKey)`.
- **Nav:** a new **top-level** rail item (not nested under Reservations, so it gets its own icon per the icon-rail's type — `AdminRailItem.children` entries don't carry icons) — `id: "billing"`, `href: "/admin/billing"`, icon **`Receipt`** (lucide-react, unused elsewhere in the nav), `permission: "patients.view"`, placed right after `"patients"` in both `adminRailItems` and the `clinic` section's `entries` in `adminNavSections`. New i18n key `admin.nav.billing` ("Billing"), plus `adminPageLabelKeys["/admin/billing"]` and `adminPagePermissions["/admin/billing"] = "patients.view"`.

## Known limitation, accepted

Treatments with no linked reservation (`patient_treatments.reservation_id IS NULL`) still count as charges here (unlike the doctor-production widget, which excludes them because it needs a `doctor_id` from the reservation) — the ledger only needs `patient_key`, which every treatment already carries directly, so this gap doesn't apply to billing.
