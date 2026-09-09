# EHR Drawer Quick Actions — Design

Date: 2026-09-09

## Problem

The patient EHR drawer (`HomePatientClinicDrawer` → `PatientEhrView`, opened from the
clinic dashboard) has no action affordances today — every element is
select/expand/close/flip only. Marking a treatment complete, scheduling one, or
changing a booking's status all require leaving this screen (the full patient chart
page, or the reservations page) even though the data needed to act is already
visible here.

## Goal

Add the two or three highest-value actions directly to this screen as always-visible
controls, reusing existing service functions and mutation conventions rather than
inventing new ones.

## Non-goals

- Treatment Edit/Delete — already available on the full patient chart page
  (`RequiredTreatmentsSection`/`PatientTeethPane`); duplicating that form here would
  bloat a screen meant for a quick glance.
- Reworking the odontogram/ledger/table layout. The actions themselves remove the
  need to switch screens; no layout restructuring is needed to achieve that.
- A full reschedule UI (calendar/day picker). Reschedule here is a same-day
  date/time patch, not the drag-and-drop reservations-page flow.

## New service function

`src/services/patient_treatments/mutations.ts`:

```ts
export async function markTreatmentComplete(id: string): Promise<PatientTreatment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatments")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientTreatment;
}
```

Mirrors `markTreatmentScheduled` exactly — a minimal patch, not a full
`updatePatientTreatment` call, so a stale client-side copy of the treatment can't
clobber fields it doesn't own.

## Treatment card actions (`EhrDetailPane.tsx`)

- Card header keeps its current click-to-expand behavior.
- New action row in the card (visible whenever a treatment is selected, not gated
  behind "expanded"):
  - **Mark complete** — hidden once `status === "done"`. Calls
    `markTreatmentComplete(id)`.
  - **Schedule** (label becomes **Reschedule** once `reservation_id` is set) — opens
    the existing `TreatmentBookDrawer` (reused as-is, same `book`/`replace` modes it
    already supports), then `markTreatmentScheduled(id, reservation.id)` on booked,
    matching `usePatientTreatments.afterBooked`'s existing wiring.
- Both buttons: disabled + inline pending indicator while their mutation is in
  flight; on success, patch the local `useEhrSession` treatment list and
  `toast.success(...)`; on failure, `toast.error(err instanceof Error ? err.message : "...")`.
  No confirmation dialog — matches the existing convention that only deletes get one.

## Booking row actions (`EhrVisitPanel.tsx`)

- New `BookingStatusMenu` component replaces the static status badge/text in the
  table's Status cell with a popover trigger.
- One-click status transitions, filtered to valid next-states for the row's current
  status (`pending → confirmed | cancelled`, `confirmed → completed | cancelled |
  no_show`, terminal statuses show no actions): each calls
  `updateReservation(id, { status })` — the same function
  `useReservationEditor.setStatus` already uses.
- **Reschedule** opens an inline date/time sub-form inside the same popover (not the
  full `ReservationFormDrawer`, which is coupled to the reservations page's own
  state shape) and calls the existing `rescheduleReservation(reservation, targetDate)`
  on submit.
- Menu trigger calls `stopPropagation()` so it doesn't also fire the row's existing
  `onRowClick` (visit preview) behavior. Same pending/toast/error convention as the
  treatment card.

## Data flow

No new fetching. `useEhrSession` continues to receive treatments/imaging/notes as
props from `HomePatientClinicDrawer`'s existing fetch-on-mount effect; these actions
patch that same local state on success rather than refetching.

## Testing

- Unit test `markTreatmentComplete` (new) alongside existing
  `patient_treatments/mutations` coverage, if any exists — confirm during
  implementation.
- Component-level tests for `BookingStatusMenu`'s status-transition filtering and for
  the treatment card's button visibility (`Mark complete` hidden when already
  `done`; `Schedule` vs `Reschedule` label).
- Manual verification via `yarn dev`: mark a treatment complete, schedule one,
  confirm/cancel/reschedule a booking, all from the drawer, and confirm the change
  reflects on the full patient page / reservations page afterward.
