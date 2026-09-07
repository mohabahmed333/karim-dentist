# Clinic Menu Fees Implementation Plan

> **For agentic workers:** Execute **inline** in this session (`executing-plans`). Do not dispatch subagents. Do not commit unless the user asks.

**Goal:** Same patient chairside page, simpler: Settings is a name + EGP menu; Charting taps names (not CDT codes) with fees from Supabase.

**Architecture:** Expand in-code `CDT_CATALOG` with `shortLabel` + `group`. `clinic_cdt_fees` rows are the clinic menu. `clinic_treatment_presets` stay 4 slots with auto labels. More = extra chips in the same 2-column grid (no new sheet). Procedure rows show short names.

**Tech Stack:** Next.js App Router, TypeScript, Supabase client, sonner toasts, existing `ConfirmDeleteDialog`, node:test via `yarn test`.

## Global Constraints

- Max ~100 lines per TS/TSX file; named exports; no `any`
- Import Supabase only from `@/lib/supabase/client` or `server`
- No new `src/components/ui/` primitives
- No schema migration (existing `clinic_cdt_fees` + `clinic_treatment_presets`)
- Toasts via `sonner` (same as current Settings)
- Catalog stays in code; fees/menu in Supabase
- Do not commit unless the user asks

## File map

- Create: `src/services/cdt/groups.ts` — `CdtGroup`, `GROUP_ORDER`, `GROUP_LABELS`
- Create: `src/services/cdt/menu.ts` + `menu.test.ts` — addable / remove / more helpers
- Create: `src/features/admin/components/ClinicMenuList.tsx`
- Create: `src/features/admin/components/ClinicMenuAddPicker.tsx`
- Modify: `src/services/cdt/types.ts`, `catalog.ts`, `index.ts`, `cdt.test.ts`
- Modify: `src/services/clinic_fees/mutations.ts`, `index.ts`
- Modify: `ChartingFeesEditor.tsx`, `ChartingFeesForm.tsx`, `ChartingFeesChips.tsx`
- Remove usage of: `ChartingFeesSchedule.tsx` (delete if unused)
- Modify: `useChairsidePresets.ts`, `CdtPresetChips.tsx`, `CdtProcedureRow.tsx`

---

### Task 1: Catalog groups, short labels, expanded list

**Files:**
- Modify: `src/services/cdt/types.ts`
- Create: `src/services/cdt/groups.ts`
- Modify: `src/services/cdt/catalog.ts`
- Modify: `src/services/cdt/index.ts`
- Test: `src/services/cdt/cdt.test.ts`
- Create: `src/services/cdt/chipLabel.test.ts`

**Interfaces:**
- Produces: `CdtGroup`, `CdtEntry` with `shortLabel` + `group`, `GROUP_ORDER`, `GROUP_LABELS`, `chipLabelFor(code: string): string`, expanded `CDT_CATALOG` (~34 codes listed in the spec)

- [ ] **Step 1: Write failing tests**

In `cdt.test.ts` add: every catalog row has non-empty `shortLabel` and `group`; codes match `^D[0-9]{4}$`.

Create `chipLabel.test.ts`: `chipLabelFor("D2391")` equals `"+ Fill"`; unknown code returns `"+ D0000"` using the raw code only if we decide to return `"+ {code}"` — implement as `"+ {shortLabel}"` or `"+ {code}"` if missing.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `yarn test`

- [ ] **Step 3: Implement types, groups, catalog, `chipLabelFor`**

```ts
export type CdtGroup =
  | "exam"
  | "filling"
  | "endo"
  | "extract"
  | "crown"
  | "perio"
  | "implant"
  | "other";

export const GROUP_ORDER: readonly CdtGroup[] = [
  "exam",
  "filling",
  "endo",
  "extract",
  "crown",
  "perio",
  "implant",
  "other",
];

export const GROUP_LABELS: Record<CdtGroup, string> = {
  exam: "Exam & emergency",
  filling: "Fillings",
  endo: "Root canal",
  extract: "Extraction",
  crown: "Crowns",
  perio: "Gum / cleaning",
  implant: "Implants & dentures",
  other: "Other",
};

export function chipLabelFor(code: string): string {
  const entry = cdtByCode(code);
  return `+ ${entry?.shortLabel ?? code}`;
}
```

Use the exact ~34-code list from [docs/superpowers/specs/2026-09-05-clinic-menu-fees-design.md](docs/superpowers/specs/2026-09-05-clinic-menu-fees-design.md). Keep existing `title` / `defaultPhase` for the original 20. Split files if `catalog.ts` exceeds ~100 lines (`catalogData.ts` + `catalog.ts`).

- [ ] **Step 4: Run `yarn test` — expect PASS**

---

### Task 2: Menu helpers

**Files:**
- Create: `src/services/cdt/menu.ts`
- Create: `src/services/cdt/menu.test.ts`
- Modify: `src/services/cdt/index.ts` (re-export)

**Interfaces:**
- Consumes: `CDT_CATALOG`, `GROUP_ORDER`, `chipLabelFor`, `ClinicFeeRow`, `ClinicPresetRow`
- Produces:

```ts
export type ClinicMenuItem = {
  code: string;
  shortLabel: string;
  title: string;
  group: CdtGroup;
  fee: number;
};

export function resolveClinicMenu(
  fees: readonly ClinicFeeRow[],
): ClinicMenuItem[];

export function addableCatalog(
  menuCodes: ReadonlySet<string>,
): readonly CdtEntry[];

export function canRemoveFromMenu(
  code: string,
  presets: readonly ClinicPresetRow[],
): boolean;

export function moreMenuItems(
  menu: readonly ClinicMenuItem[],
  presets: readonly ClinicPresetRow[],
): ClinicMenuItem[];
```

- [ ] **Step 1: Write failing tests** in `menu.test.ts`
  - `resolveClinicMenu` joins fee to catalog; skips unknown codes
  - `addableCatalog` omits codes already in the set
  - `canRemoveFromMenu` is false when a preset uses that code
  - `moreMenuItems` excludes favorite codes; preserves group order

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement `menu.ts`** (~80 lines). Sort groups with `GROUP_ORDER`, items by `shortLabel` within a group.

- [ ] **Step 4: `yarn test` — expect PASS**

---

### Task 3: Delete fee mutation

**Files:**
- Modify: `src/services/clinic_fees/mutations.ts`
- Modify: `src/services/clinic_fees/index.ts`

**Interfaces:**
- Produces: `deleteClinicCdtFee(code: string): Promise<void>` — `.from("clinic_cdt_fees").delete().eq("code", code)`; throw on error (FK will fail if still a favorite).

- [ ] **Step 1:** No extra unit test for the network call. Keep `saveClinicFeeSchedule` / `upsertClinicCdtFee`.

- [ ] **Step 2: Implement and export `deleteClinicCdtFee`.**

---

### Task 4: Settings clinic-menu UI + immediate save

**Files:**
- Create: `src/features/admin/components/ClinicMenuAddPicker.tsx`
- Create: `src/features/admin/components/ClinicMenuList.tsx`
- Modify: `ChartingFeesChips.tsx` — 4 selects of **menu** items; remove label text input; show auto `chipLabelFor` + fee
- Modify: `ChartingFeesForm.tsx` — chips + add picker + flat name/EGP list; drop schedule table
- Modify: `ChartingFeesEditor.tsx` — state is DB menu rows only (not full catalog overlay); persist on add / fee blur / favorite change / confirmed remove; remove Save button
- Delete: `ChartingFeesSchedule.tsx` if unused

**Behavior:**
- Load: `setFees(feeRows)` mapped to `{ code, fee_egp }`; presets from DB or `defaultPresetSlots()`
- Add: `upsertClinicCdtFee(code, 0)` then append to state; toast
- Fee blur: `upsertClinicCdtFee(code, fee)`; toast
- Favorite select: set `label: chipLabelFor(code)`, `saveClinicTreatmentPresets`; toast
- Remove: `ConfirmDeleteDialog`; if `!canRemoveFromMenu` disable control; else `deleteClinicCdtFee` and drop from state
- Add picker options: `addableCatalog(new Set(fees.map(f => f.code)))` grouped with `GROUP_LABELS`

Keep each new/modified component under ~100 lines.

- [ ] **Step 1: Implement UI (no RTL component tests in this repo — logic already covered in Task 2)**

- [ ] **Step 2: `yarn test` still PASS**

---

### Task 5: Charting names + More chips (same grid)

**Files:**
- Modify: `useChairsidePresets.ts` — return `{ presets, moreItems, loading }`
- Modify: `CdtPresetChips.tsx` — 4 chips; **More** toggles extra chips in the **same** 2-column grid; hide CDT codes (name + fee only)
- Modify: `CdtProcedureRow.tsx` — title is catalog `shortLabel` (e.g. Extract), not `D7140`

```ts
export function useChairsidePresets(): {
  presets: ChairsidePreset[];
  moreItems: ClinicMenuItem[];
  loading: boolean;
};
```

`moreItems = moreMenuItems(resolveClinicMenu(fees), slots)` inside the hook. Chip buttons: `preset.label` / `item.shortLabel` and `formatEgp(fee)` — no code line.

- [ ] **Step 1: Implement hook, chips More, procedure-row name**

- [ ] **Step 2: `yarn test` PASS**

---

### Task 6: Verify

- [ ] **Step 1: `yarn test`** — all green
- [ ] **Step 2: `yarn lint`** on touched files
- [ ] **Step 3: Browser** (dev server already running)
  - Settings → Charting fees: 4 slots + flat name/EGP list, Add by name, no Save, reload persists
  - Patient `phone:+201056789012`: tap tooth → tap **Extract** (not D7140) → row titled Extract with Settings fee
  - More → extra chips in the same grid → tap one
  - Row still shows Immediate / Planned, Book, fee tap-to-edit
  - Insurance / Book / Export / Send unchanged
  - Site tab still saves brand settings
