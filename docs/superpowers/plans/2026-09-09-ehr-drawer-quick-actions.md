# EHR Drawer Quick Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Mark complete" / "Schedule" actions to the patient EHR drawer's treatment card, and status/reschedule actions to its bookings table, so common clinical/front-desk actions no longer require leaving the drawer.

**Architecture:** All mutations reuse existing service functions (`updateReservation`, `markTreatmentScheduled`, plus one new `markTreatmentComplete`). `useEhrSession` grows from pure derived state into the owner of optimistic local overrides + mutation handlers (it already owns all other drawer state, and `PatientEhrView`/`useEhrSession` are only ever instantiated together — see `PatientEhrView.tsx:24`). New presentational pieces (`EhrStatusPill`, `BookingStatusMenu`) are extracted so the booking-row status control and its reschedule sub-form stay in one small, testable place.

**Tech Stack:** Next.js (App Router), React, TypeScript, Supabase JS client, `sonner` for toasts, Base UI (`@base-ui/react/menu`) via the shared `AdminDropdownMenu*` wrappers, `node:test` for pure-logic unit tests.

**Spec:** `docs/superpowers/specs/2026-09-09-ehr-drawer-quick-actions-design.md`

## Global Constraints

- No new API routes — every mutation is a direct Supabase client call from a service function, matching every existing mutation in `src/services/patient_treatments` and `src/services/reservations`.
- No confirmation dialogs for these actions (only deletes get one, per existing convention) — status changes and scheduling fire immediately with a pending state + toast.
- This repo has no component-render test infrastructure (`node:test` covers pure logic only, glob `src/**/*.test.ts`, run via `bash scripts/test.sh`) — new tests are for pure helper functions only; UI wiring is verified via `npx tsc --noEmit -p tsconfig.json`, `yarn lint`, and manual `yarn dev` walkthrough.
- Match existing error handling: `toast.error(err instanceof Error ? err.message : "<fallback>")`.

---

### Task 1: `markTreatmentComplete` service mutation

**Files:**
- Modify: `src/services/patient_treatments/mutations.ts`

**Interfaces:**
- Produces: `markTreatmentComplete(id: string): Promise<PatientTreatment>` — re-exported through the `@/services/patient_treatments` barrel (`index.ts` already does `export * from "./mutations"`).

- [ ] **Step 1: Add the function**

Add to `src/services/patient_treatments/mutations.ts`, directly after `markTreatmentScheduled` (mirrors its minimal-patch shape exactly — same reasoning as that function: a full `updatePatientTreatment` call requires the whole form payload and risks clobbering fields from a stale client-side copy):

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

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/patient_treatments/mutations.ts
git commit -m "feat(patient-treatments): add markTreatmentComplete mutation"
```

---

### Task 2: Pure action-state helpers (`ehrActions.ts`)

**Files:**
- Create: `src/features/admin/components/patients/ehr-view/ehrActions.ts`
- Test: `src/features/admin/components/patients/ehr-view/ehrActions.test.ts`

**Interfaces:**
- Consumes: `TreatmentItem` from `@/services/patient_treatments` (fields used: `status`, `reservationId`); `Reservation["status"]` from `@/services/reservations/types`.
- Produces:
  - `canMarkTreatmentComplete(treatment: TreatmentItem): boolean`
  - `treatmentScheduleAction(treatment: TreatmentItem): { label: string; mode: "book" | "replace" }`
  - `nextReservationStatuses(status: Reservation["status"]): Reservation["status"][]`
  - `canRescheduleReservation(status: Reservation["status"]): boolean`
  These are consumed by Task 4 (`BookingStatusMenu.tsx`), Task 6 (`EhrDetailPane.tsx`), and Task 7 (`useEhrSession.ts`).

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/components/patients/ehr-view/ehrActions.test.ts`, following this repo's existing pure-logic test convention (see `ehrScene.test.ts` for the same idiom):

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  canMarkTreatmentComplete,
  canRescheduleReservation,
  nextReservationStatuses,
  treatmentScheduleAction,
} from "./ehrActions.ts";
import type { TreatmentItem } from "@/services/patient_treatments";

function treatment(overrides: Partial<TreatmentItem> = {}): TreatmentItem {
  return {
    id: "t1",
    toothName: "Upper right first molar",
    toothFdi: "16",
    severity: "Critical",
    lastTreatment: "",
    status: "open",
    reservationId: null,
    cdtCode: null,
    phase: "restorative",
    feeAmount: 0,
    createdAt: "2026-09-01T00:00:00.000Z",
    attachments: [],
    ...overrides,
  };
}

describe("canMarkTreatmentComplete", () => {
  it("is true for open and scheduled treatments", () => {
    assert.equal(canMarkTreatmentComplete(treatment({ status: "open" })), true);
    assert.equal(canMarkTreatmentComplete(treatment({ status: "scheduled" })), true);
  });

  it("is false once a treatment is done", () => {
    assert.equal(canMarkTreatmentComplete(treatment({ status: "done" })), false);
  });
});

describe("treatmentScheduleAction", () => {
  it("offers Schedule/book when no reservation is linked", () => {
    assert.deepEqual(treatmentScheduleAction(treatment({ reservationId: null })), {
      label: "Schedule",
      mode: "book",
    });
  });

  it("offers Reschedule/replace once a reservation is linked", () => {
    assert.deepEqual(
      treatmentScheduleAction(treatment({ reservationId: "r1" })),
      { label: "Reschedule", mode: "replace" },
    );
  });
});

describe("nextReservationStatuses", () => {
  it("lets a pending booking be confirmed or cancelled", () => {
    assert.deepEqual(nextReservationStatuses("pending"), ["confirmed", "cancelled"]);
  });

  it("lets a confirmed booking be completed, cancelled, or marked no-show", () => {
    assert.deepEqual(nextReservationStatuses("confirmed"), [
      "completed",
      "cancelled",
      "no_show",
    ]);
  });

  it("has no further transitions once terminal", () => {
    assert.deepEqual(nextReservationStatuses("completed"), []);
    assert.deepEqual(nextReservationStatuses("cancelled"), []);
    assert.deepEqual(nextReservationStatuses("no_show"), []);
  });
});

describe("canRescheduleReservation", () => {
  it("allows rescheduling pending or confirmed bookings only", () => {
    assert.equal(canRescheduleReservation("pending"), true);
    assert.equal(canRescheduleReservation("confirmed"), true);
    assert.equal(canRescheduleReservation("completed"), false);
    assert.equal(canRescheduleReservation("cancelled"), false);
    assert.equal(canRescheduleReservation("no_show"), false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash scripts/test.sh`
Expected: FAIL — `ehrActions.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `src/features/admin/components/patients/ehr-view/ehrActions.ts`:

```ts
import type { TreatmentItem } from "@/services/patient_treatments";
import type { Reservation } from "@/services/reservations/types";

export function canMarkTreatmentComplete(treatment: TreatmentItem): boolean {
  return treatment.status !== "done";
}

export function treatmentScheduleAction(
  treatment: TreatmentItem,
): { label: string; mode: "book" | "replace" } {
  return treatment.reservationId
    ? { label: "Reschedule", mode: "replace" }
    : { label: "Schedule", mode: "book" };
}

export function nextReservationStatuses(
  status: Reservation["status"],
): Reservation["status"][] {
  switch (status) {
    case "pending":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["completed", "cancelled", "no_show"];
    default:
      return [];
  }
}

export function canRescheduleReservation(status: Reservation["status"]): boolean {
  return status === "pending" || status === "confirmed";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash scripts/test.sh`
Expected: PASS (all `ehrActions.test.ts` cases green, plus every pre-existing test still green).

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/patients/ehr-view/ehrActions.ts src/features/admin/components/patients/ehr-view/ehrActions.test.ts
git commit -m "feat(ehr-view): add pure action-state helpers for treatment/booking actions"
```

---

### Task 3: Extract `EhrStatusPill`

**Files:**
- Create: `src/features/admin/components/patients/ehr-view/EhrStatusPill.tsx`
- Modify: `src/features/admin/components/patients/ehr-view/EhrVisitPanel.tsx:14-33`

**Interfaces:**
- Produces: `EhrStatusPill({ status: string })` — a presentational component. Consumed by Task 4 (`BookingStatusMenu.tsx`, as the dropdown trigger's visible content) and Task 5 (`EhrVisitPanel.tsx`, as the fallback when a row has no matching raw reservation).

This is a pure extraction: the current `statusPill(status)` function inside `EhrVisitPanel.tsx` (lines 14-33) becomes a component. It has to move out of `EhrVisitPanel.tsx` because Task 5 makes `EhrVisitPanel.tsx` render `BookingStatusMenu`, and `BookingStatusMenu` also needs this same pill — importing it back from `EhrVisitPanel.tsx` would be a circular import (`EhrVisitPanel` → `BookingStatusMenu` → `EhrVisitPanel`).

- [ ] **Step 1: Create the component**

Create `src/features/admin/components/patients/ehr-view/EhrStatusPill.tsx`:

```tsx
export function EhrStatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const label = status ? status.replace(/_/g, " ") : "—";
  const tone =
    key === "confirmed" || key === "completed"
      ? "bg-emerald-50 text-emerald-800"
      : key === "pending"
        ? "bg-amber-50 text-amber-900"
        : key === "cancelled" || key === "no_show"
          ? "bg-rose-50 text-rose-800"
          : "bg-[var(--admin-hover)] text-[var(--admin-muted)]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Remove the old function and use the component in `EhrVisitPanel.tsx`**

In `src/features/admin/components/patients/ehr-view/EhrVisitPanel.tsx`:
- Delete the `statusPill` function (lines 14-33).
- Add `import { EhrStatusPill } from "./EhrStatusPill";`.
- Change the status column's cell from `cell: (v) => statusPill(v.status),` to `cell: (v) => <EhrStatusPill status={v.status} />,` (Task 5 replaces this again with `BookingStatusMenu`, but do this swap now so the file typechecks standalone after this task).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/patients/ehr-view/EhrStatusPill.tsx src/features/admin/components/patients/ehr-view/EhrVisitPanel.tsx
git commit -m "refactor(ehr-view): extract EhrStatusPill so it can be shared with BookingStatusMenu"
```

---

### Task 4: `BookingStatusMenu`

**Files:**
- Create: `src/features/admin/components/patients/ehr-view/BookingStatusMenu.tsx`

**Interfaces:**
- Consumes: `nextReservationStatuses`, `canRescheduleReservation` from `./ehrActions` (Task 2); `EhrStatusPill` from `./EhrStatusPill` (Task 3); `AdminDropdownMenu`/`AdminDropdownMenuContent`/`AdminDropdownMenuItem`/`AdminDropdownMenuSeparator`/`AdminDropdownMenuTrigger` from `@/features/admin/ui` (existing, Base UI-backed — `AdminDropdownMenuItem` takes `onClick` and `closeOnClick={false}` per `MenuItemProps`, not Radix's `onSelect`); `Button` from `@/components/ui/button`; `Reservation` type from `@/services/reservations/types`.
- Produces: `BookingStatusMenu({ reservation: Reservation; pending: boolean; onStatusChange: (status: Reservation["status"]) => void; onReschedule: (startsAtIso: string) => void })`. Consumed by Task 5 (`EhrVisitPanel.tsx`).

This renders a status pill that opens a dropdown of valid next statuses, plus (for non-terminal bookings) a "Reschedule" item that switches the same dropdown into an inline date/time mini-form — no separate positioned popover, so it stays correctly placed inside a table cell regardless of row position (unlike `RescheduleDatePopover`, which assumes a full-width chat-composer-sized parent and is not reused here).

- [ ] **Step 1: Create the component**

Create `src/features/admin/components/patients/ehr-view/BookingStatusMenu.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuSeparator,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";
import { Button } from "@/components/ui/button";
import type { Reservation } from "@/services/reservations/types";
import { canRescheduleReservation, nextReservationStatuses } from "./ehrActions";
import { EhrStatusPill } from "./EhrStatusPill";

const STATUS_LABELS: Record<Reservation["status"], string> = {
  pending: "Mark pending",
  confirmed: "Confirm",
  cancelled: "Cancel",
  completed: "Mark completed",
  no_show: "Mark no-show",
};

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Props = {
  reservation: Reservation;
  pending: boolean;
  onStatusChange: (status: Reservation["status"]) => void;
  onReschedule: (startsAtIso: string) => void;
};

export function BookingStatusMenu({
  reservation,
  pending,
  onStatusChange,
  onReschedule,
}: Props) {
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [date, setDate] = useState(() => toDateInputValue(reservation.starts_at));
  const [time, setTime] = useState(() => toTimeInputValue(reservation.starts_at));
  const nextStatuses = nextReservationStatuses(reservation.status);
  const canReschedule = canRescheduleReservation(reservation.status);

  function submitReschedule() {
    if (!date || !time) return;
    onReschedule(new Date(`${date}T${time}:00`).toISOString());
    setRescheduleMode(false);
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <AdminDropdownMenu
        onOpenChange={(open) => {
          if (!open) setRescheduleMode(false);
        }}
      >
        <AdminDropdownMenuTrigger disabled={pending}>
          <EhrStatusPill status={reservation.status} />
        </AdminDropdownMenuTrigger>
        <AdminDropdownMenuContent align="start">
          {rescheduleMode ? (
            <div className="flex flex-col gap-2 p-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-[var(--admin-border)] px-2 py-1 text-[12px]"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-md border border-[var(--admin-border)] px-2 py-1 text-[12px]"
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setRescheduleMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={submitReschedule}
                >
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {nextStatuses.map((status) => (
                <AdminDropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(status)}
                >
                  {STATUS_LABELS[status]}
                </AdminDropdownMenuItem>
              ))}
              {canReschedule ? (
                <>
                  {nextStatuses.length > 0 ? <AdminDropdownMenuSeparator /> : null}
                  <AdminDropdownMenuItem
                    closeOnClick={false}
                    onClick={() => setRescheduleMode(true)}
                  >
                    Reschedule
                  </AdminDropdownMenuItem>
                </>
              ) : null}
            </>
          )}
        </AdminDropdownMenuContent>
      </AdminDropdownMenu>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/patients/ehr-view/BookingStatusMenu.tsx
git commit -m "feat(ehr-view): add BookingStatusMenu for inline booking status/reschedule actions"
```

---

### Task 5: Wire `BookingStatusMenu` into `EhrVisitPanel`

**Files:**
- Modify: `src/features/admin/components/patients/ehr-view/EhrVisitPanel.tsx`

**Interfaces:**
- Consumes: `BookingStatusMenu` (Task 4); `group.visits: Reservation[]` (already available via the existing `group: PatientGroup` prop — `PatientGroup.visits` is `Reservation[]`, per `src/services/reservations/patientHistory.ts:9`).
- Produces: new `EhrVisitPanel` props `pendingVisitId: string | null`, `onStatusChange: (id: string, status: Reservation["status"]) => void`, `onReschedule: (id: string, startsAtIso: string) => void` — consumed by Task 8 (`PatientEhrView.tsx`).

The table's `visits: EhrVisit[]` rows are a display-shaped projection (no raw `Reservation` fields beyond `id`/`status`/`startsAt`); the actual mutation needs the raw `Reservation` row, which is available via `group.visits`. Build a lookup once per render.

- [ ] **Step 1: Update the component**

Replace the full contents of `src/features/admin/components/patients/ehr-view/EhrVisitPanel.tsx` with:

```tsx
"use client";

import { useMemo } from "react";
import { CollectionTable } from "@/features/admin/components/CollectionTable";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { buildPatientHistoryStats } from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import { BookingStatusMenu } from "./BookingStatusMenu";
import { EhrStatusPill } from "./EhrStatusPill";
import type { EhrVisit } from "./ehr.types";

type Props = {
  group: PatientGroup;
  visits: EhrVisit[];
  onSelect: (id: string) => void;
  pendingVisitId: string | null;
  onStatusChange: (id: string, status: Reservation["status"]) => void;
  onReschedule: (id: string, startsAtIso: string) => void;
};

export function EhrVisitPanel({
  group,
  visits,
  onSelect,
  pendingVisitId,
  onStatusChange,
  onReschedule,
}: Props) {
  const rows = [...visits].reverse();
  const stats = buildPatientHistoryStats(group);
  const name = group.displayName || "Patient";
  const aka =
    group.alternateNames.length > 0
      ? group.alternateNames.join(", ")
      : null;
  const reservationById = useMemo(
    () => new Map(group.visits.map((r) => [r.id, r])),
    [group.visits],
  );

  return (
    <div
      data-ehr-node="visit-panel"
      className="min-h-0 max-h-[280px] overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] [&_td]:text-[var(--admin-primary)]"
    >
      <CollectionTable
        tableId="ehr-visits"
        rows={rows}
        onRowClick={onSelect}
        emptyMessage="No visits yet."
        defaultPageSize={8}
        columns={[
          {
            key: "patient",
            header: "Patient",
            cell: () => (
              <div className="min-w-[8rem]">
                <p className="font-medium text-[var(--admin-primary)]">{name}</p>
                {aka ? (
                  <p className="text-[11px] text-[var(--admin-muted)]">
                    aka {aka}
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            cell: () => (
              <span className="tabular-nums text-[var(--admin-primary)]">
                {group.phone || "—"}
              </span>
            ),
          },
          {
            key: "email",
            header: "Email",
            cell: () => (
              <span className="max-w-[10rem] truncate text-[var(--admin-primary)]">
                {group.email || "—"}
              </span>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: () => (
              <span className="rounded-full bg-[var(--admin-hover)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-primary)]">
                {stats.isReturning ? "Returning" : "New"}
              </span>
            ),
          },
          {
            key: "date",
            header: "Date",
            cell: (v) => (
              <span className="tabular-nums font-medium text-[var(--admin-primary)]">
                {v.dateLabel}
              </span>
            ),
          },
          {
            key: "time",
            header: "Time",
            cell: (v) => (
              <span className="tabular-nums text-[var(--admin-muted)]">
                {v.timeLabel}
              </span>
            ),
          },
          {
            key: "service",
            header: "Service",
            cell: (v) => (
              <span className="inline-flex max-w-[10rem] truncate rounded-full bg-[var(--admin-hover)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-primary)]">
                {v.serviceLabel}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (v) => {
              const reservation = reservationById.get(v.id);
              if (!reservation) return <EhrStatusPill status={v.status} />;
              return (
                <BookingStatusMenu
                  reservation={reservation}
                  pending={pendingVisitId === v.id}
                  onStatusChange={(status) => onStatusChange(v.id, status)}
                  onReschedule={(iso) => onReschedule(v.id, iso)}
                />
              );
            },
          },
        ]}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: errors only in `PatientEhrView.tsx` (missing new required props on `<EhrVisitPanel>`) — fixed in Task 8. No errors within `EhrVisitPanel.tsx` itself.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/patients/ehr-view/EhrVisitPanel.tsx
git commit -m "feat(ehr-view): render BookingStatusMenu in the visits table status column"
```

---

### Task 6: Treatment card actions in `EhrDetailPane`

**Files:**
- Modify: `src/features/admin/components/patients/ehr-view/EhrDetailPane.tsx`

**Interfaces:**
- Consumes: `canMarkTreatmentComplete`, `treatmentScheduleAction` from `./ehrActions` (Task 2); `Button` from `@/components/ui/button`.
- Produces: new `EhrDetailPane` props `onMarkComplete: () => void`, `completePending: boolean`, `onSchedule: () => void` — consumed by Task 8 (`PatientEhrView.tsx`).

The card's header stays a single click-to-expand `<button>`; the new actions are siblings below it (they can't live inside that button — nested interactive elements aren't valid, and clicking them shouldn't also toggle expand/collapse).

- [ ] **Step 1: Update the component**

Replace the full contents of `src/features/admin/components/patients/ehr-view/EhrDetailPane.tsx` with:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import type { TreatmentItem } from "@/services/patient_treatments";
import { canMarkTreatmentComplete, treatmentScheduleAction } from "./ehrActions";
import { EHR } from "./ehr.types";
import { EhrTreatmentPropBranch } from "./EhrTreatmentProps";
import { EhrImagingCard } from "./EhrImagingCard";
import { plainText } from "./ehrScene";
import type { EhrMediaPanel } from "./ehr.types";
import type { TreatmentPropNode } from "./treatmentProps";

type Props = {
  treatment: TreatmentItem;
  expanded: boolean;
  onToggle: () => void;
  propNodes: TreatmentPropNode[];
  media: EhrMediaPanel[];
  onMarkComplete: () => void;
  completePending: boolean;
  onSchedule: () => void;
};

export function EhrDetailPane({
  treatment,
  expanded,
  onToggle,
  propNodes,
  media,
  onMarkComplete,
  completePending,
  onSchedule,
}: Props) {
  const toothLabel = `${treatment.toothName}${
    treatment.toothFdi ? ` · #${treatment.toothFdi}` : ""
  }`;
  const title = treatment.aiInsight?.title?.trim() || toothLabel;
  const subtitle =
    treatment.aiInsight?.title?.trim() && toothLabel !== title
      ? toothLabel
      : plainText(treatment.lastTreatment);
  const scheduleAction = treatmentScheduleAction(treatment);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="w-full rounded-2xl border p-4 text-start"
        style={{ background: EHR.card, borderColor: EHR.ink }}
      >
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <Chip ink>{treatment.status}</Chip>
          <Chip>{treatment.severity}</Chip>
          {treatment.cdtCode ? <Chip muted>{treatment.cdtCode}</Chip> : null}
        </div>
        <p className="text-[15px] leading-snug font-semibold tracking-tight text-[var(--admin-primary)]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 text-[12px] leading-snug" style={{ color: EHR.muted }}>
            {subtitle}
          </p>
        ) : null}
        <p className="mt-2.5 text-[10px]" style={{ color: EHR.muted }}>
          {expanded ? "Collapse details" : "Show progress, details, attachments"}
        </p>
      </button>
      <div className="flex flex-wrap gap-2">
        {canMarkTreatmentComplete(treatment) ? (
          <Button
            type="button"
            size="sm"
            disabled={completePending}
            onClick={onMarkComplete}
          >
            {completePending ? "Marking…" : "Mark complete"}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" onClick={onSchedule}>
          {scheduleAction.label}
        </Button>
      </div>
      {expanded ? <EhrTreatmentPropBranch nodes={propNodes} /> : null}
      {media.length > 0 ? <EhrImagingCard panels={media} /> : null}
    </div>
  );
}

function Chip({
  children,
  ink,
  muted,
}: {
  children: React.ReactNode;
  ink?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize tabular-nums"
      style={{
        background: ink ? EHR.ink : EHR.soft,
        color: ink ? "#fff" : muted ? EHR.muted : EHR.ink,
      }}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: errors only in `PatientEhrView.tsx` (missing new required props on `<EhrDetailPane>`) — fixed in Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/patients/ehr-view/EhrDetailPane.tsx
git commit -m "feat(ehr-view): add Mark complete / Schedule actions to the treatment detail card"
```

---

### Task 7: Mutation handlers + optimistic overrides in `useEhrSession`

**Files:**
- Modify: `src/features/admin/components/patients/ehr-view/useEhrSession.ts`

**Interfaces:**
- Consumes: `markTreatmentComplete` (Task 1), `markTreatmentScheduled` (existing) from `@/services/patient_treatments`; `updateReservation` (existing) from `@/services/reservations/mutations`; `treatmentScheduleAction` from `./ehrActions` (Task 2).
- Produces (new/changed return fields, consumed by Task 8's `PatientEhrView.tsx`):
  - `mergedTreatments: TreatmentItem[]` — `treatments` prop with local overrides applied; use this (not `props.treatments`) anywhere the raw list is needed.
  - `mergedGroup: PatientGroup` — `group` prop with local visit-status/reschedule overrides applied.
  - `completePending: boolean`
  - `bookOpen: boolean`, `bookMode: "book" | "replace"`
  - `pendingVisitId: string | null`
  - `markComplete(): Promise<void>`
  - `openSchedule(): void`, `closeSchedule(): void`
  - `afterBooked(treatmentId: string, reservation: Reservation): Promise<void>`
  - `updateVisitStatus(id: string, status: Reservation["status"]): Promise<void>`
  - `rescheduleVisit(id: string, startsAtIso: string): Promise<void>`

`treatments`/`imaging`/`notes`/`group` remain props (owned by `HomePatientClinicDrawer`); this hook layers local override maps on top, the same pattern `usePatientTreatments.afterBooked` already uses for its own optimistic-fallback branch. Overrides reset for free on patient switch because `PatientEhrView` (and therefore this hook) is remounted via `key={group.patientKey}` in `HomePatientClinicDrawer.tsx:254`.

- [ ] **Step 1: Update the hook**

Replace the full contents of `src/features/admin/components/patients/ehr-view/useEhrSession.ts` with:

```ts
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import {
  markTreatmentComplete,
  markTreatmentScheduled,
  type TreatmentItem,
} from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { updateReservation } from "@/services/reservations/mutations";
import type { Reservation } from "@/services/reservations/types";
import { UNIVERSAL_TO_FDI } from "./ehr.types";
import { buildEhrModel } from "./buildEhrModel";
import { linkedMediaFor } from "./ehrScene";
import { buildTreatmentPropNodes } from "./treatmentProps";
import { treatmentScheduleAction } from "./ehrActions";

type Props = {
  group: PatientGroup;
  treatments: TreatmentItem[];
  imaging: PatientImaging[];
  notes: PatientToothNote[];
};

export function useEhrSession({ group, treatments, imaging, notes }: Props) {
  const [treatmentOverrides, setTreatmentOverrides] = useState<
    Record<string, Partial<TreatmentItem>>
  >({});
  const [visitOverrides, setVisitOverrides] = useState<
    Record<string, Partial<Reservation>>
  >({});
  const [completePending, setCompletePending] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookMode, setBookMode] = useState<"book" | "replace">("book");
  const [pendingVisitId, setPendingVisitId] = useState<string | null>(null);

  const mergedTreatments = useMemo(
    () =>
      treatments.map((t) =>
        treatmentOverrides[t.id] ? { ...t, ...treatmentOverrides[t.id] } : t,
      ),
    [treatments, treatmentOverrides],
  );
  const mergedGroup = useMemo<PatientGroup>(
    () => ({
      ...group,
      visits: group.visits.map((v) =>
        visitOverrides[v.id] ? { ...v, ...visitOverrides[v.id] } : v,
      ),
    }),
    [group, visitOverrides],
  );

  const model = useMemo(
    () => buildEhrModel(mergedTreatments, mergedGroup, imaging, notes),
    [mergedTreatments, mergedGroup, imaging, notes],
  );
  const [conditionId, setConditionId] = useState(
    model.conditions[0]?.id ?? null,
  );
  const [selectedToothId, setSelectedToothId] = useState<number | null>(
    model.conditions[0]?.toothUniversal ?? null,
  );
  const [visitId, setVisitId] = useState(model.visits.at(-1)?.id ?? null);
  const [expandedTx, setExpandedTx] = useState(true);
  const [archFlip, setArchFlip] = useState(false);

  const activeCondition =
    model.conditions.find((c) => c.id === conditionId) ??
    model.conditions[0] ??
    null;
  const activeVisit =
    model.visits.find((v) => v.id === visitId) ?? model.visits.at(-1) ?? null;
  const activeTreatment =
    mergedTreatments.find((t) => t.id === activeCondition?.id) ?? null;
  const activeFdi =
    activeCondition?.fdi ??
    (selectedToothId != null ? UNIVERSAL_TO_FDI[selectedToothId] : undefined);
  const sceneNotes = useMemo(() => {
    const scoped = activeFdi
      ? notes.filter((n) => n.fdi_number === activeFdi)
      : notes;
    return scoped.slice(0, 4);
  }, [notes, activeFdi]);

  function selectTooth(universal: number) {
    setSelectedToothId(universal);
    setExpandedTx(true);
    const match = model.conditions.find((c) => c.toothUniversal === universal);
    if (match) setConditionId(match.id);
  }

  function selectCondition(id: string, toothUniversal: number | null) {
    setConditionId(id);
    setSelectedToothId(toothUniversal);
    setExpandedTx(true);
  }

  async function markComplete() {
    if (!activeTreatment) return;
    setCompletePending(true);
    try {
      const row = await markTreatmentComplete(activeTreatment.id);
      setTreatmentOverrides((prev) => ({
        ...prev,
        [row.id]: { status: row.status },
      }));
      toast.success("Treatment marked complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not mark complete");
    } finally {
      setCompletePending(false);
    }
  }

  function openSchedule() {
    if (!activeTreatment) return;
    setBookMode(treatmentScheduleAction(activeTreatment).mode);
    setBookOpen(true);
  }

  function closeSchedule() {
    setBookOpen(false);
  }

  async function afterBooked(treatmentId: string, reservation: Reservation) {
    try {
      const row = await markTreatmentScheduled(treatmentId, reservation.id);
      setTreatmentOverrides((prev) => ({
        ...prev,
        [row.id]: { status: row.status, reservationId: row.reservation_id },
      }));
    } catch {
      setTreatmentOverrides((prev) => ({
        ...prev,
        [treatmentId]: { status: "scheduled", reservationId: reservation.id },
      }));
    }
    setBookOpen(false);
  }

  async function updateVisitStatus(id: string, status: Reservation["status"]) {
    setPendingVisitId(id);
    try {
      const row = await updateReservation(id, { status });
      setVisitOverrides((prev) => ({ ...prev, [id]: { status: row.status } }));
      toast.success(`Marked ${row.status.replace(/_/g, " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update booking");
    } finally {
      setPendingVisitId(null);
    }
  }

  async function rescheduleVisit(id: string, startsAtIso: string) {
    setPendingVisitId(id);
    try {
      const row = await updateReservation(id, { starts_at: startsAtIso });
      setVisitOverrides((prev) => ({
        ...prev,
        [id]: { starts_at: row.starts_at },
      }));
      toast.success("Appointment rescheduled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reschedule");
    } finally {
      setPendingVisitId(null);
    }
  }

  return {
    model,
    mergedTreatments,
    mergedGroup,
    activeCondition,
    activeVisit,
    activeTreatment,
    activeFdi,
    sceneNotes,
    selectedToothId,
    expandedTx,
    archFlip,
    completePending,
    bookOpen,
    bookMode,
    pendingVisitId,
    propNodes: activeTreatment ? buildTreatmentPropNodes(activeTreatment) : [],
    linkedMedia: linkedMediaFor(activeTreatment, activeVisit?.id, model.media),
    setVisitId,
    setExpandedTx,
    setArchFlip,
    selectTooth,
    selectCondition,
    markComplete,
    openSchedule,
    closeSchedule,
    afterBooked,
    updateVisitStatus,
    rescheduleVisit,
  };
}
```

- [ ] **Step 2: Typecheck and run existing tests**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: errors only in `PatientEhrView.tsx` (Task 8 fixes these).

Run: `bash scripts/test.sh`
Expected: PASS — `ehrScene.test.ts` (which calls `buildEhrModel` directly, unaffected by this hook change) and `ehrActions.test.ts` both still green.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/patients/ehr-view/useEhrSession.ts
git commit -m "feat(ehr-view): own optimistic overrides and mutation handlers in useEhrSession"
```

---

### Task 8: Wire everything up in `PatientEhrView`

**Files:**
- Modify: `src/features/admin/components/patients/ehr-view/PatientEhrView.tsx`

**Interfaces:**
- Consumes: `TreatmentBookDrawer` from `@/features/admin/components/patients/treatments/TreatmentBookDrawer` (existing — props `open`, `mode`, `group`, `services`, `treatment`, `onClose`, `onBooked`, per `TreatmentBookDrawer.tsx:27-35`); `Service` type from `@/services/services/types`; everything Task 7 added to `useEhrSession`'s return value.
- Produces: new required `PatientEhrView` prop `services: Service[]` — consumed by Task 9 (`HomePatientClinicDrawer.tsx`).

Also fixes a correctness gap: the ledger currently reads `props.treatments` (the raw, un-overridden prop) to compute each row's status pill (`EhrLedger.tsx:39,46`) — after this task it reads `s.mergedTreatments` so a just-completed or just-scheduled treatment's status pill updates immediately instead of only after the next full refetch.

- [ ] **Step 1: Update the component**

Replace the full contents of `src/features/admin/components/patients/ehr-view/PatientEhrView.tsx` with:

```tsx
"use client";

import { EHR } from "./ehr.types";
import { EhrArchStage } from "./EhrArchStage";
import { EhrDetailPane } from "./EhrDetailPane";
import { EhrLedger } from "./EhrLedger";
import { EhrNodeStage } from "./EhrNodeStage";
import { EhrVisitPanel } from "./EhrVisitPanel";
import { useEhrSession } from "./useEhrSession";
import { TreatmentBookDrawer } from "@/features/admin/components/patients/treatments/TreatmentBookDrawer";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";

type Props = {
  group: PatientGroup;
  treatments: TreatmentItem[];
  imaging: PatientImaging[];
  notes: PatientToothNote[];
  services: Service[];
  /** Drawer: arch on top half, ledger + detail below. */
  layout?: "default" | "stacked";
};

export function PatientEhrView(props: Props) {
  const s = useEhrSession(props);
  const stacked = props.layout === "stacked";

  const detail = (
    <section className="min-h-0 min-w-0 overflow-y-auto">
      {s.activeCondition && s.activeTreatment ? (
        <EhrDetailPane
          treatment={s.activeTreatment}
          expanded={s.expandedTx}
          onToggle={() => s.setExpandedTx((v) => !v)}
          propNodes={s.propNodes}
          media={s.linkedMedia}
          onMarkComplete={() => void s.markComplete()}
          completePending={s.completePending}
          onSchedule={s.openSchedule}
        />
      ) : (
        <div
          className="rounded-2xl border px-4 py-6 text-[12px]"
          style={{
            background: EHR.card,
            borderColor: EHR.border,
            color: EHR.muted,
          }}
        >
          Select a required treatment to expand details.
        </div>
      )}
    </section>
  );

  const ledger = (
    <div className="min-h-0 min-w-0 overflow-y-auto">
      <EhrLedger
        conditions={s.model.conditions}
        treatments={s.mergedTreatments}
        activeId={s.activeCondition?.id ?? null}
        notes={s.sceneNotes}
        emptyNotes={
          s.activeFdi
            ? `No notes for tooth #${s.activeFdi}`
            : "Select a tooth to see notes"
        }
        onSelect={(c) => s.selectCondition(c.id, c.toothUniversal)}
      />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <EhrNodeStage
        footer={
          <EhrVisitPanel
            group={s.mergedGroup}
            visits={s.model.visits}
            onSelect={s.setVisitId}
            pendingVisitId={s.pendingVisitId}
            onStatusChange={(id, status) => void s.updateVisitStatus(id, status)}
            onReschedule={(id, iso) => void s.rescheduleVisit(id, iso)}
          />
        }
      >
        {stacked ? (
          <div className="flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4">
            <section className="min-h-0 flex-[1.1] overflow-hidden">
              <EhrArchStage
                conditions={s.model.conditions}
                active={s.activeCondition}
                selectedToothId={s.selectedToothId}
                flipped={s.archFlip}
                onFlip={() => s.setArchFlip((v) => !v)}
                onSelectTooth={s.selectTooth}
                fill
              />
            </section>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              {ledger}
              {detail}
            </div>
          </div>
        ) : (
          <div className="grid h-full grid-cols-1 items-start gap-8 overflow-auto p-4 sm:p-5 @[880px]:grid-cols-[minmax(320px,0.95fr)_minmax(260px,340px)_minmax(0,1.2fr)] @[880px]:gap-8 lg:p-6">
            <section className="w-full lg:sticky lg:top-2">
              <EhrArchStage
                conditions={s.model.conditions}
                active={s.activeCondition}
                selectedToothId={s.selectedToothId}
                flipped={s.archFlip}
                onFlip={() => s.setArchFlip((v) => !v)}
                onSelectTooth={s.selectTooth}
              />
            </section>
            {ledger}
            {detail}
          </div>
        )}
      </EhrNodeStage>
      <TreatmentBookDrawer
        open={s.bookOpen}
        mode={s.bookMode}
        group={props.group}
        services={props.services}
        treatment={s.activeTreatment}
        onClose={s.closeSchedule}
        onBooked={(id, reservation) => void s.afterBooked(id, reservation)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: errors only in `HomePatientClinicDrawer.tsx` (missing new required `services` prop on `<PatientEhrView>`) — fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/patients/ehr-view/PatientEhrView.tsx
git commit -m "feat(ehr-view): wire treatment/booking actions and TreatmentBookDrawer into PatientEhrView"
```

---

### Task 9: Thread `services` through to the drawer

**Files:**
- Modify: `src/features/admin/components/overview/HomePatientClinicDrawer.tsx`
- Modify: `src/features/admin/components/overview/ClinicDashboard.tsx`

**Interfaces:**
- Consumes: `services: Service[]`, already a prop on `ClinicDashboard` (`ClinicDashboard.tsx:51`, sourced from its own caller — a server component fetch, out of scope here).
- Produces: `HomePatientClinicDrawer` gains a required `services: Service[]` prop.

- [ ] **Step 1: Add the prop to `HomePatientClinicDrawer`**

In `src/features/admin/components/overview/HomePatientClinicDrawer.tsx`:
- Add `import type { Service } from "@/services/services/types";`
- Add `services: Service[];` to the `Props` type (after `reservations: Reservation[];`).
- Add `services,` to the destructured props in the function signature (after `reservations,`).
- Add `services={services}` to the `<PatientEhrView>` call (`HomePatientClinicDrawer.tsx:253-260`).

- [ ] **Step 2: Pass `services` from `ClinicDashboard`**

In `src/features/admin/components/overview/ClinicDashboard.tsx`, add `services={services}` to the `<HomePatientClinicDrawer>` call (around line 288-295), alongside the existing `reservations={reservations}`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors anywhere in the ehr-view / overview tree.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/overview/HomePatientClinicDrawer.tsx src/features/admin/components/overview/ClinicDashboard.tsx
git commit -m "feat(overview): thread services into the EHR drawer for treatment scheduling"
```

---

### Task 10: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `yarn lint`
Expected: no new warnings/errors in any file touched above.

- [ ] **Step 2: Full test suite**

Run: `bash scripts/test.sh`
Expected: PASS, including `ehrActions.test.ts` and every pre-existing `*.test.ts`.

- [ ] **Step 3: Production build**

Run: `yarn build`
Expected: builds successfully (this is the project's actual full-program typecheck, since there's no standalone `typecheck` script).

- [ ] **Step 4: Manual walkthrough**

Run: `yarn dev`, open the admin dashboard, click a reservation to open the patient EHR drawer, and verify:
- Selecting a required treatment shows "Mark complete" and "Schedule" (or "Reschedule", if it already has a linked appointment) buttons on the detail card.
- "Mark complete" disables itself, shows "Marking…", then the treatment disappears from the required-treatments ledger (its status left `open`/`scheduled`) and a success toast appears.
- "Schedule" opens the existing `TreatmentBookDrawer`; booking updates the treatment's status/label without a page reload.
- In the bookings table at the bottom, clicking a status pill opens a menu of valid next statuses (e.g. `pending` → Confirm/Cancel); selecting one updates the pill and shows a toast, without triggering the row's own click-to-preview behavior.
- "Reschedule" (for pending/confirmed bookings) switches the menu to inline date/time inputs; saving updates the row's date/time and closes the menu.
- Terminal-status bookings (`completed`/`cancelled`/`no_show`) show no menu items besides the (non-interactive) pill styling — no dead-end empty dropdown.
- Cancelling a booking makes its row disappear from this table immediately — expected, not a bug: `buildEhrModel` already filters `status === "cancelled"` visits out of the visit list (`buildEhrModel.ts:51`), this action just makes that reachable interactively instead of only via external cancellation.

- [ ] **Step 5: Final commit (only if the walkthrough required fixes)**

```bash
git add -A
git commit -m "fix(ehr-view): address issues found in manual verification"
```
