# SinglePatientDashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline; no subagent fan-out per project rules). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mount a mock `SinglePatientDashboard` on the patient detail page with header, odontogram, treatment table, and action panel.

**Architecture:** Modular folder under `patients/single-patient-dashboard/`. Local React state for `selectedTooth` + `treatments`. `PatientProfileView` swaps to the new dashboard; old history dashboard files stay untouched.

**Tech Stack:** React client components, Tailwind, existing admin patient styling tokens, vitest/node test runner via `yarn test`.

## Global Constraints

- Mock data only — no Supabase writes
- Universal teeth 1–16 / 17–32
- Clinical light mode: white/`#e5e7eb` borders, `#2563eb` selection
- Named exports; no `any`; keep files ~100 lines
- Fill/Crown/Extract append treatment and keep tooth selected
- Generate Note inserts placeholder text only

---

### Task 1: Types, mock data, treatment helper + test

**Files:**
- Create: `src/features/admin/components/patients/single-patient-dashboard/types.ts`
- Create: `src/features/admin/components/patients/single-patient-dashboard/mockData.ts`
- Create: `src/features/admin/components/patients/single-patient-dashboard/treatmentActions.ts`
- Create: `src/features/admin/components/patients/single-patient-dashboard/treatmentActions.test.ts`

**Interfaces:**
- Produces: `Treatment`, `TreatmentSeverity`, `MockPatient`, `MOCK_PATIENT`, `MOCK_TREATMENTS`, `appendQuickTreatment(treatments, tooth, action)`, `toothConditionTint(treatments, tooth)`

- [ ] **Step 1: Write failing test for `appendQuickTreatment`**

```ts
import { describe, expect, it } from "vitest";
import { appendQuickTreatment } from "./treatmentActions";

describe("appendQuickTreatment", () => {
  it("appends fill for selected tooth and keeps prior rows", () => {
    const next = appendQuickTreatment([], 14, "Fill");
    expect(next).toHaveLength(1);
    expect(next[0]?.tooth).toBe(14);
    expect(next[0]?.procedureName).toMatch(/fill/i);
    expect(next[0]?.cdtCode).toBeTruthy();
  });
});
```

- [ ] **Step 2: Implement types, mock, helper**

```ts
// types.ts
export type TreatmentSeverity = "Critical" | "Minor";
export type QuickAction = "Fill" | "Crown" | "Extract";
export type Treatment = {
  id: string;
  tooth: number;
  cdtCode: string;
  procedureName: string;
  severity: TreatmentSeverity;
  fee: number;
};
export type MockPatient = {
  name: string;
  age: number;
  balance: number;
  hasMedicalAlert: boolean;
};
```

Quick-action map: Fill → D2391 / Minor / $180; Crown → D2740 / Critical / $1200; Extract → D7140 / Critical / $250.

- [ ] **Step 3: Run test** — `yarn test src/features/admin/components/patients/single-patient-dashboard/treatmentActions.test.ts` — expect PASS

- [ ] **Step 4: Commit** types/mock/helper/test (if user wants commits mid-stream; otherwise batch at end)

---

### Task 2: UI modules

**Files:**
- Create: `PatientHeader.tsx`, `Odontogram.tsx`, `TreatmentTable.tsx`, `ActionPanel.tsx`, `SinglePatientDashboard.tsx`, `index.ts`

**Interfaces:**
- Consumes: types + mock + `appendQuickTreatment` + `toothConditionTint`
- Produces: `SinglePatientDashboard` named export

- [ ] **Step 1: PatientHeader** — mock name, age, red Medical Alert if flag, formatted balance
- [ ] **Step 2: Odontogram** — two rows of buttons; tint via `toothConditionTint`; selected blue; `onSelectTooth(n)`
- [ ] **Step 3: TreatmentTable** — list treatments; severity pills; 32×32 gray X-ray placeholder
- [ ] **Step 4: ActionPanel** — null tooth empty state; else actions + notes + Generate Note
- [ ] **Step 5: SinglePatientDashboard** — state + responsive grid; wire children
- [ ] **Step 6: Export from `index.ts`**

---

### Task 3: Route-level swap

**Files:**
- Modify: `src/features/admin/components/patients/PatientProfileView.tsx`

- [ ] **Step 1:** Render `<SinglePatientDashboard />` instead of `PatientHistoryDashboard`. Keep prop types on the view so the server page compiles; prefix unused props with underscore or void them.
- [ ] **Step 2:** Manual check — open `/admin/patients/...` shows new UI
- [ ] **Step 3:** Run focused test + `yarn tsc --noEmit` if available / lint touched files

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Mock data | 1 |
| Modules listed | 2 |
| selectedTooth / treatments | 2 |
| Quick actions append | 1+2 |
| Generate Note placeholder | 2 |
| PatientProfileView swap | 3 |
| Old dashboard untouched | 3 (by omission) |
