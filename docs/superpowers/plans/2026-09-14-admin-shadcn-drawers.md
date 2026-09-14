# Admin shadcn Drawers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every hand-rolled `createPortal` drawer/modal in the admin (side-panel drawers, the patient clinical panel, the mobile nav, the chat gallery lightbox, and the command palette) with the project's real shadcn UI primitives — the existing `Dialog` plus a new shadcn-style `Sheet` — so admin overlays stop needing manual dark-theme CSS-variable patching and instead inherit theming the way every other shadcn component in the repo already does.

**Architecture:** Two foundational pieces unlock everything else: (1) a CSS fix in `globals.css` that extends the existing dark-mode block to also remap the shadcn *semantic* tokens (`--background`, `--border`, `--muted`, `--input`, etc.) the way the light block and `.admin-shell`'s live block already do — this is what actually makes portaled shadcn content dark-theme-correct, and it means no component needs to manually patch CSS vars onto itself anymore; (2) a new `src/components/ui/sheet.tsx`, a shadcn-style side-panel primitive built on the same `@base-ui/react/dialog` primitive `dialog.tsx` already uses (this repo has no Radix — Base UI is the house library for every overlay). Every custom drawer then gets rewritten to sit on `Sheet` (or `Dialog` for the two that aren't side panels), keeping each component's external `Props` type identical so call sites need zero changes. The one deliberate UX trade-off: the Command Palette's `layoutId` shared-element morph (button growing into the panel) is dropped in favor of a plain fade/zoom open, because that animation is fundamentally incompatible with a portal-managed `Dialog` — the user explicitly accepted this when scoping the work.

**Tech Stack:** Next.js App Router, `@base-ui/react` (Dialog primitive), Tailwind v4 + `tw-animate-css` (provides the `animate-in`/`data-open:`/`slide-in-from-*` utilities already used in `dialog.tsx`), TypeScript.

**Spec:** No separate spec doc — scoped directly with the user via two `AskUserQuestion` rounds in this conversation. Their answers are captured as Global Constraints below.

## Global Constraints

- Build a real shadcn-style `Sheet` side-panel component on top of the existing Base UI `Dialog` primitive — do not fall back to a centered `Dialog` for side panels.
- In scope: `SideDrawer.tsx` (and its 6 consumers, unchanged), `ReservationFormDrawer.tsx`, `HomePatientClinicDrawer.tsx`, `AdminMobileNav.tsx`, `ChatGalleryModal.tsx`, `CommandPalette.tsx`. Also touch `ReservationFormDialog.tsx` (already `Dialog`-based, but drop its now-redundant manual theme patch once the CSS fix lands) since it shares the `adminThemeStyle`/`useAdminThemeVars` mechanism being retired.
- Out of scope: `CollectionTable.tsx`'s portaled bulk-selection action bar (not a dialog/drawer — a pinned toolbar, portaled only to escape `overflow-hidden` clipping).
- Every migrated component keeps its existing exported `Props` type and prop names unchanged, so no call site (`ReservationsPageView.tsx`, `ClinicDashboard.tsx`, `TreatmentBookDrawer.tsx`, etc.) needs edits.
- The Command Palette's `layoutId` morph animation is intentionally dropped, per the user's explicit choice when accepting full migration scope.
- No new npm dependencies. Reuse `@base-ui/react`, `lucide-react`, `tw-animate-css`, all already installed.
- This repo has no browser-automation tool available to this session — every task's manual verification step must be run by a human (or a future session with browser access) in the actual dev server; do not claim visual confirmation that wasn't actually observed.

---

## File Structure

- **Create** `src/components/ui/sheet.tsx` — new shadcn-style Sheet primitive (Base UI Dialog-based), side-panel variant of `dialog.tsx`.
- **Modify** `src/app/globals.css` — extend the dark-mode block to remap semantic shadcn tokens, so all portaled Base UI content (existing `Dialog`, new `Sheet`) is dark-correct without per-component patching.
- **Modify** `src/features/admin/components/patients/treatments/SideDrawer.tsx` — rewrite internals on `Sheet`, same `{ open, title, onClose, children }` props. Its 6 consumers (`TreatmentBookDrawer.tsx`, `TreatmentEditorDrawer.tsx`, `ProcedureBuilderDrawer.tsx`, `ToothInspectorDrawer.tsx`, `ClientProfileDrawer.tsx`, `ClinicPricesDrawer.tsx`) are **not modified**.
- **Modify** `src/features/admin/components/reservations/ReservationFormDrawer.tsx` — rewrite on `Sheet`; also fix a pre-existing bug (two identical "Edit" buttons in the view-mode footer).
- **Modify** `src/features/admin/components/reservations/ReservationFormDialog.tsx` — drop `adminThemeStyle`/`useAdminThemeVars`, rely on the CSS fix.
- **Modify** `src/features/admin/components/overview/HomePatientClinicDrawer.tsx` — rewrite on `Sheet`, delete its local duplicate of the theme-var-reading logic.
- **Modify** `src/features/admin/components/AdminMobileNav.tsx` — rewrite on `Sheet`.
- **Modify** `src/features/admin/components/support/chat/ChatGalleryModal.tsx` — rewrite on `Dialog` (fullscreen, no-padding variant).
- **Modify** `src/features/admin/components/CommandPalette.tsx` — rewrite on `Dialog`, drop the `layoutId` morph and the now-dead `resultsReady`/`reduced`-staged-reveal state.
- **Delete** `src/features/admin/lib/commandPaletteMotion.ts` — only consumer is `CommandPalette.tsx`.
- **Delete** `src/features/admin/hooks/useAdminThemeVars.ts` and the `adminThemeStyle`/`readAdminThemeVars`/`FALLBACK_ADMIN_THEME`/`ADMIN_VAR_KEYS`/`AdminThemeVars` exports of `src/features/admin/lib/adminThemeVars.ts` — once Tasks 4/5/6 land, nothing imports them (confirmed by grep in Task 10).

---

### Task 1: Dark-mode CSS fix for portaled shadcn semantic tokens

**Files:**
- Modify: `src/app/globals.css:160-180`

**Interfaces:**
- Produces: dark-mode values for `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border`, `--input`, `--ring`, `--sidebar*`, available at `<html>` scope whenever `.admin-shell.dark` (or `.customize-shell.dark`) is present anywhere in the document — i.e. for portaled content too, not just descendants of `.admin-shell`.

This is the root-cause fix. Today, `html:has(.admin-shell)` (lines 103-153) sets the full shadcn semantic token set at `<html>` scope with **fixed light** values, so any portaled content (which sits outside `.admin-shell`, e.g. anything using `createPortal(..., document.body)` or a Base UI `Portal`) inherits them. The dark counterpart, `html:has(.admin-shell.dark)` (lines 160-180), only overrides the raw `--admin-*` tokens — never the semantic aliases — so portaled content stays pinned to light `--background`/`--border`/`--muted`/etc even in dark mode. `.admin-shell` itself (line 202) *does* remap the semantic aliases from `--admin-*`, but that rule only applies to descendants of `.admin-shell`, which a portal is not.

`--admin-canvas`, `--admin-panel`, `--admin-secondary`, `--admin-primary` are already reliably correct at `<html>` scope in dark mode by the time any drawer/dialog/palette opens (interactive-only UI, always after mount): `AdminShell.tsx:72-77` sets the customizable ones (`--admin-primary/secondary/canvas/content/panel`) as an inline style on `document.documentElement`, and the existing `html:has(.admin-shell.dark)` rule sets the fixed neutrals (`--admin-border/text/muted/hover/active`). So referencing `var(--admin-canvas)` etc. inside the new dark block is safe.

- [ ] **Step 1: Read the current block to confirm line numbers before editing**

```bash
sed -n '155,181p' src/app/globals.css
```

Expected output starts with the comment above `html:has(.admin-shell.dark),` and ends with the closing `}` of that rule (the block you're about to extend).

- [ ] **Step 2: Add the semantic token remap to the dark block**

Replace:
```css
html:has(.admin-shell.dark),
html:has(.customize-shell.dark),
.admin-shell.dark,
.customize-shell.dark {
  --admin-border: #34363a;
  --admin-text: #e8e9ea;
  --admin-muted: #9a9da3;
  --admin-hover: #2a2c30;
  --admin-active: color-mix(in srgb, var(--admin-primary) 18%, #202124);
  /* Lighten a dark customized primary so it stays legible on a dark panel —
     without this, a black/near-black accent color makes active nav text
     disappear into the dark background. */
  --admin-primary-contrast: color-mix(in srgb, var(--admin-primary) 55%, white);
  /* Tooltips are a near-black bubble by default, which has nothing to separate it
     from the dark canvas — swap in the panel surface plus a border. The inner
     fallback covers the first paint, before AdminShell's effect has put
     --admin-panel on <html> for portaled content. */
  --tooltip-bg: var(--admin-panel, #202124);
  --tooltip-fg: var(--admin-text);
  --tooltip-border: var(--admin-border);
}
```

with:
```css
html:has(.admin-shell.dark),
html:has(.customize-shell.dark),
.admin-shell.dark,
.customize-shell.dark {
  --admin-border: #34363a;
  --admin-text: #e8e9ea;
  --admin-muted: #9a9da3;
  --admin-hover: #2a2c30;
  --admin-active: color-mix(in srgb, var(--admin-primary) 18%, #202124);
  /* Lighten a dark customized primary so it stays legible on a dark panel —
     without this, a black/near-black accent color makes active nav text
     disappear into the dark background. */
  --admin-primary-contrast: color-mix(in srgb, var(--admin-primary) 55%, white);
  /* Tooltips are a near-black bubble by default, which has nothing to separate it
     from the dark canvas — swap in the panel surface plus a border. The inner
     fallback covers the first paint, before AdminShell's effect has put
     --admin-panel on <html> for portaled content. */
  --tooltip-bg: var(--admin-panel, #202124);
  --tooltip-fg: var(--admin-text);
  --tooltip-border: var(--admin-border);

  /* Same shadcn-semantic-token remap `.admin-shell` does for its own descendants
     (below), but at `<html>` scope so portaled content — Dialog/Sheet/DropdownMenu
     content rendered via Base UI's Portal, outside `.admin-shell` entirely — picks
     up dark values too instead of staying pinned to the light block's fixed oklch
     colors. Without this, e.g. a Dialog's `bg-popover` or a Button's `outline`
     variant (`bg-background`, `border-border`) renders pale-on-pale in dark mode. */
  --background: var(--admin-canvas);
  --foreground: var(--admin-text);
  --card: var(--admin-panel);
  --card-foreground: var(--admin-text);
  --popover: var(--admin-panel);
  --popover-foreground: var(--admin-text);
  --secondary: var(--admin-secondary);
  --secondary-foreground: #ffffff;
  --muted: var(--admin-panel);
  --muted-foreground: var(--admin-muted);
  --accent: var(--admin-secondary);
  --accent-foreground: #ffffff;
  --border: var(--admin-border);
  --input: var(--admin-border);
  --ring: var(--admin-primary);
  --sidebar: var(--admin-canvas);
  --sidebar-foreground: var(--admin-text);
  --sidebar-primary: var(--admin-primary);
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: var(--admin-active);
  --sidebar-accent-foreground: var(--admin-text);
  --sidebar-border: var(--admin-border);
  --sidebar-ring: transparent;
}
```

Note `--primary`/`--primary-foreground` are deliberately left out of this new block — they're user-customizable and already handled correctly (the light block's `--primary: oklch(...)` gets overridden per-request by `.admin-shell`'s live block for shell descendants; portaled content that needs the live customized primary already gets it via other means in the tasks below, e.g. `Sheet`/`Dialog` content reading `--admin-primary` directly via `var(--admin-primary)` arbitrary-value classes, which is unaffected by this change).

- [ ] **Step 3: Typecheck (sanity — CSS-only change, this just confirms nothing else broke)**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no new errors.

- [ ] **Step 4: Manual verification (requires a human/browser — no automation available in this session)**

Ask the user (or do it yourself if you have browser access) to: open the admin in dark mode, open any existing shadcn `Dialog` (e.g. `ConfirmDeleteDialog` from a delete action, or the "New reservation" quick-book dialog), and confirm its outline/secondary buttons are now legible *without* relying on `ReservationFormDialog.tsx`'s `adminThemeStyle()` patch (that patch is still present until Task 5 — this step just confirms the CSS alone is sufficient, e.g. by temporarily commenting out the `style={adminThemeStyle(themeVars)}` line and reloading, then restoring it).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
fix(admin): make portaled shadcn content dark-theme-aware at the CSS level

Dialog/Sheet/etc. render via Base UI's Portal, outside .admin-shell, so
they never picked up .admin-shell's own bg-background/border-border/...
remap in dark mode - only the light values declared at <html> scope.
Extend the existing html:has(.admin-shell.dark) block to remap the same
shadcn semantic tokens, so every portaled surface gets correct dark
colors without a per-component JS patch.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: New `Sheet` primitive

**Files:**
- Create: `src/components/ui/sheet.tsx`

**Interfaces:**
- Consumes: `@base-ui/react/dialog` (`Dialog as SheetPrimitive`), `@/lib/utils` (`cn`), `@/components/ui/button` (`Button`), `lucide-react` (`XIcon`) — same imports `dialog.tsx` uses.
- Produces: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription` from `@/components/ui/sheet`.
  - `SheetContent` props: `SheetPrimitive.Popup.Props & { side?: "left" | "right"; showCloseButton?: boolean }`. `side` is a **physical** side (not logical start/end) — callers that need RTL-aware docking compute the physical side themselves via `useAdminDrawerSide()` and pass it in, exactly like they already compute `drawer.shellClass`/`drawer.offscreenX` today. Default `side` is `"right"`.
  - `showCloseButton` defaults to `true` and renders a floating `size-icon-sm` ghost `Button` at `top-2 end-2`, identical placement/behavior to `DialogContent`'s. Pass `false` when a consumer wants to place its own close control inline (e.g. next to a title, as the current drawers do).

- [ ] **Step 1: Write the file**

```tsx
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-(--z-drawer) bg-black/40 backdrop-blur-sm duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

const SHEET_SIDE_CLASS = {
  left: "left-0 border-e data-open:slide-in-from-left data-closed:slide-out-to-left",
  right: "right-0 border-s data-open:slide-in-from-right data-closed:slide-out-to-right",
} as const

export type SheetSide = keyof typeof SHEET_SIDE_CLASS

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: SheetSide
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 z-(--z-drawer) flex h-full w-full max-w-md flex-col gap-0 bg-popover text-popover-foreground shadow-[0_12px_40px_rgba(0,0,0,0.12)] outline-none duration-200 data-open:animate-in data-closed:animate-out",
          SHEET_SIDE_CLASS[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 end-2"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex shrink-0 flex-col gap-1 border-b border-border px-5 py-4",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/50 px-4 py-3",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-[15px] font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
```

`border-e`/`border-s` here are safe as logical properties (unlike a `dir`-flipping page) because each consumer sets `dir` on `SheetContent` itself to a fixed value per open (see Task 4) — the border resolves relative to that element's own `dir`, not the page's, so it's still deterministic per physical `side`.

- [ ] **Step 2: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors (file isn't imported anywhere yet, this just confirms it compiles standalone).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/sheet.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add a shadcn-style Sheet side-panel primitive

Built on the same @base-ui/react/dialog primitive dialog.tsx already
uses (this repo has no Radix). Nothing consumes it yet - the admin's
hand-rolled drawer components migrate onto it in following commits.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Migrate `SideDrawer.tsx` onto `Sheet`

**Files:**
- Modify: `src/features/admin/components/patients/treatments/SideDrawer.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetClose` from `@/components/ui/sheet` (Task 2); `useAdminDrawerSide` (unchanged, existing hook).
- Produces: same external API as before — `SideDrawer({ open, title, onClose, children }: Props)`. **Zero changes** required in its 6 consumers (`TreatmentBookDrawer.tsx`, `TreatmentEditorDrawer.tsx`, `ProcedureBuilderDrawer.tsx`, `ToothInspectorDrawer.tsx`, `ClientProfileDrawer.tsx`, `ClinicPricesDrawer.tsx`).

- [ ] **Step 1: Confirm no consumer reaches into internals beyond the 4 documented props**

```bash
grep -n "SideDrawer" src/features/admin/components/patients/treatments/TreatmentBookDrawer.tsx \
  src/features/admin/components/patients/treatments/TreatmentEditorDrawer.tsx \
  src/features/admin/components/patients/charting/ProcedureBuilderDrawer.tsx \
  src/features/admin/components/patients/charting/ToothInspectorDrawer.tsx \
  src/features/admin/components/patients/workspace/ClientProfileDrawer.tsx \
  src/features/admin/components/patients/workspace/ClinicPricesDrawer.tsx
```

Expected: every call site is `<SideDrawer open={...} title={...} onClose={...}>...children...</SideDrawer>` — nothing else. (Already confirmed during planning; this step is a pre-flight re-check in case the branch moved since.)

- [ ] **Step 2: Rewrite the file**

Replace the full contents of `src/features/admin/components/patients/treatments/SideDrawer.tsx` with:

```tsx
"use client";

import { X } from "lucide-react";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function SideDrawer({ open, title, onClose, children }: Props) {
  const drawer = useAdminDrawerSide();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side={drawer.rtl ? "right" : "left"}
        dir={drawer.contentDir}
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-center justify-between gap-3">
          <SheetTitle className="truncate">{title}</SheetTitle>
          <SheetClose
            render={
              <button
                type="button"
                className="rounded-full bg-[var(--admin-hover,#f3f4f6)] px-3 py-1 text-sm text-[var(--admin-muted,#4b5563)]"
              />
            }
          >
            Close
          </SheetClose>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
```

Note the close control is kept as the same "Close" text pill it was before (not swapped for an icon-X), to preserve the exact prior look — this file only changes *how* the drawer is portaled/animated/themed, not its visible content. The `X` import from the old file is no longer used and is dropped.

- [ ] **Step 3: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors in `SideDrawer.tsx` or any of its 6 consumers.

- [ ] **Step 4: Manual verification (requires a human/browser)**

Open a patient's clinical workspace, trigger each of the 6 drawers this file backs (treatment editor, treatment booking, clinic prices, client profile edit, procedure builder, tooth inspector) in both light and dark mode. Confirm: opens/closes with a slide animation from the correct side for the current locale (left in English, right in Arabic), Escape key now closes it (new — Base UI's Dialog provides this for free, the old hand-rolled version didn't), clicking the backdrop closes it, and the panel background/text/border are legible in dark mode.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/patients/treatments/SideDrawer.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): rebuild SideDrawer on the new shadcn Sheet primitive

Same createPortal + framer-motion + manual var(--admin-*) styling
every other custom drawer had - swapped for Sheet (Task: admin shadcn
drawers). Props unchanged (open/title/onClose/children), so its 6
consumers (treatment editor/booking, clinic prices, client profile,
procedure builder, tooth inspector) needed no changes. Picks up
Escape-to-close and focus trapping for free, which the old version
didn't have.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Migrate `ReservationFormDrawer.tsx` onto `Sheet`

**Files:**
- Modify: `src/features/admin/components/reservations/ReservationFormDrawer.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose` from `@/components/ui/sheet` (Task 2).
- Produces: same external `Props` type as before (`open`, `values`, `reservation`, `services`, `doctors`, `reservations`, `selectedId`, `pending`, `onClose`, `onChange`, `onSave`, `onDeleteClick`, `onStatus`). Its only consumer, `ReservationsPageView.tsx`, needs no changes.
- Also fixes a pre-existing bug: the view-mode footer currently renders **two** "Edit" buttons doing the identical `setMode("edit")` action (lines 178-192 of the old file — one `variant="outline"`, one default). This rewrite keeps only the default-variant one.

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `src/features/admin/components/reservations/ReservationFormDrawer.tsx` with:

```tsx
"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PatientHistorySnippet } from "@/features/admin/components/PatientHistorySnippet";
import { ReservationDrawerSummary } from "@/features/admin/components/reservations/ReservationDrawerSummary";
import {
  reservationToForm,
  ReservationFormFields,
} from "@/features/admin/components/ReservationFormFields";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { useTranslations } from "@/lib/i18n";
import type { ReservationFormValues } from "@/services/reservations/schemas";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import type { DoctorProfile } from "@/services/profiles";

type Mode = "view" | "edit";

type Props = {
  open: boolean;
  values: ReservationFormValues;
  reservation?: Reservation | null;
  services: Service[];
  doctors?: DoctorProfile[];
  reservations: Reservation[];
  selectedId: string;
  pending: boolean;
  onClose: () => void;
  onChange: (values: ReservationFormValues) => void;
  onSave: () => Promise<boolean>;
  onDeleteClick: () => void;
  onStatus: (status: Reservation["status"]) => void;
};

export function ReservationFormDrawer({
  open,
  values,
  reservation,
  services,
  doctors,
  reservations,
  selectedId,
  pending,
  onClose,
  onChange,
  onSave,
  onDeleteClick,
  onStatus,
}: Props) {
  const t = useTranslations();
  const [mode, setMode] = useState<Mode>("view");
  const drawer = useAdminDrawerSide();

  useEffect(() => {
    if (open) setMode("view");
  }, [open, selectedId]);

  async function handleSave() {
    const ok = await onSave();
    if (ok) setMode("view");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side={drawer.rtl ? "right" : "left"}
        dir={drawer.contentDir}
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="truncate">
              {values.patient_name || t("admin.reservations.title")}
            </SheetTitle>
            <SheetDescription>
              {mode === "view"
                ? t("admin.reservations.detailsTitle")
                : t("admin.edit")}
            </SheetDescription>
          </div>
          <SheetClose
            render={
              <button
                type="button"
                aria-label={t("admin.close")}
                className="shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
              />
            }
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--admin-canvas)] p-4">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
            {mode === "view" ? (
              <ReservationDrawerSummary
                values={values}
                reservation={reservation}
                doctors={doctors}
              />
            ) : (
              <ReservationFormFields
                values={values}
                services={services}
                doctors={doctors}
                pending={pending}
                onChange={onChange}
              />
            )}
          </div>
          <PatientHistorySnippet
            reservations={reservations}
            patientName={values.patient_name}
            phone={values.phone}
            excludeId={selectedId}
          />
        </div>

        <SheetFooter>
          {mode === "view" ? (
            <>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={onDeleteClick}
              >
                {t("admin.delete")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending || values.status === "confirmed"}
                onClick={() => onStatus("confirmed")}
              >
                {t("admin.confirm")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending || values.status === "completed"}
                onClick={() => onStatus("completed")}
              >
                {t("admin.reservations.completed")}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => setMode("edit")}
              >
                {t("admin.edit")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  if (reservation) onChange(reservationToForm(reservation));
                  setMode("view");
                }}
              >
                {t("admin.cancel")}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => void handleSave()}
              >
                {pending ? t("admin.saving") : t("admin.save")}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

Dropped compared to the original: `mounted`/`useState(false)`/`if (!mounted) return null` (Base UI's `Sheet.Root` handles SSR-safe portaling itself — confirmed by `ReservationFormDialog.tsx`, which already uses the real `Dialog` and has never needed this dance), `createPortal`/`AnimatePresence`/`motion.button`/`motion.aside` (replaced by `Sheet`/`SheetContent`), `useAdminThemeVars`/`adminThemeStyle` (Task 1's CSS fix makes this redundant — every `var(--admin-*)` reference in this file's own classes, e.g. `bg-[var(--admin-panel)]`, already resolves correctly via `<html>`-scope inheritance), the duplicate second "Edit" button.

- [ ] **Step 2: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors. Confirm specifically that `src/features/admin/components/reservations/ReservationsPageView.tsx` (the only consumer) still compiles unchanged.

- [ ] **Step 3: Manual verification (requires a human/browser)**

Open the Reservations page, click an appointment to open its details drawer, in dark mode: confirm the panel is legible, the footer shows exactly one "Edit" button (not two), Confirm/Completed/Delete/Edit are all clearly visible (this was the exact bug fixed earlier this session — confirm it's still fixed after the rewrite), switching into edit mode and back works, Escape and backdrop-click both close it.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/reservations/ReservationFormDrawer.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): rebuild the reservation details drawer on Sheet

Same migration as SideDrawer (Task: admin shadcn drawers) - drops the
hand-rolled createPortal/framer-motion/adminThemeStyle stack for the
new Sheet primitive. Also fixes a pre-existing bug where the view-mode
footer rendered two identical "Edit" buttons.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Drop the manual theme patch from `ReservationFormDialog.tsx`

**Files:**
- Modify: `src/features/admin/components/reservations/ReservationFormDialog.tsx`

**Interfaces:**
- No prop/type changes — same `Props` as before. This task only removes now-redundant internals, proving Task 1's CSS fix works standalone for the existing `Dialog` primitive (not just the new `Sheet`).

- [ ] **Step 1: Remove the theme-var patch**

In `src/features/admin/components/reservations/ReservationFormDialog.tsx`:

Remove the import:
```tsx
import { useAdminThemeVars } from "@/features/admin/hooks/useAdminThemeVars";
import { adminThemeStyle } from "@/features/admin/lib/adminThemeVars";
```

Remove the hook call:
```tsx
  const themeVars = useAdminThemeVars(open);
```

Remove the `style` prop from `DialogContent`:
```tsx
      <DialogContent
        data-showreel-action="reservation-form-modal"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        style={adminThemeStyle(themeVars)}
      >
```
becomes:
```tsx
      <DialogContent
        data-showreel-action="reservation-form-modal"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
```

Everything else in the file (the `var(--admin-*)` arbitrary-value classes scattered through the JSX, `ModeOption`, etc.) stays exactly as-is — those already work via `<html>`-scope CSS var inheritance, same as they did before, just without the redundant inline-style duplication.

- [ ] **Step 2: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Manual verification (requires a human/browser)**

Open the "New reservation" quick-book dialog (Cmd+K → New reservation, or the `+` menu) in dark mode. Confirm it looks identical to before this change — background, borders, text, the "replace existing" mode-choice cards.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/reservations/ReservationFormDialog.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): drop the manual theme-var patch from the booking dialog

No longer needed now that globals.css remaps shadcn semantic tokens
for portaled content directly (Task: admin shadcn drawers, Task 1).
Proves the CSS fix works for the existing Dialog primitive on its own,
not just the new Sheet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Migrate `HomePatientClinicDrawer.tsx` onto `Sheet`

**Files:**
- Modify: `src/features/admin/components/overview/HomePatientClinicDrawer.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetContent`, from `@/components/ui/sheet` (Task 2). Keeps its own header/loading/EHR body markup (not `SheetHeader`/`SheetFooter`, since its layout — a compact header bar plus a full-bleed scrollable EHR body — doesn't match those two's padding/border assumptions; it already didn't use anything but a plain `div` for its header before).
- Produces: same external `Props` type as before (`open`, `reservation`, `reservations`, `onClose`, `skipRemoteLoad`, `demoClinical`). Its only consumer, `ClinicDashboard.tsx`, needs no changes.
- This is the highest-complexity migration (async imaging/notes/treatments loading, demo-mode branching) — the data-loading `useEffect`s are untouched; only the portal/wrapper mechanics change.

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `src/features/admin/components/overview/HomePatientClinicDrawer.tsx` with:

```tsx
"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listPatientImaging } from "@/services/patient_imaging";
import type { PatientImaging } from "@/services/patient_imaging";
import { listToothNotes } from "@/services/patient_tooth_notes/queries";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import {
  listPatientTreatments,
  toTreatmentItem,
  type PatientTreatmentRow,
  type TreatmentItem,
} from "@/services/patient_treatments";
import {
  getPatientGroup,
  groupReservationsByPatient,
  patientKeyFromReservation,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import { PatientEhrView } from "@/features/admin/components/patients/ehr-view/PatientEhrView";
import { HomePatientClinicDrawerSkeleton } from "./HomePatientClinicDrawerSkeleton";
import {
  demoClinicalForPatient,
  type AdminDemoClinical,
} from "@/features/admin/lib/adminDemoClinical";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  open: boolean;
  reservation: Reservation | null;
  reservations: Reservation[];
  onClose: () => void;
  /** Showreel/offline: skip Supabase clinical loads and render empty EHR shell. */
  skipRemoteLoad?: boolean;
  /** Showreel: seed imaging/notes for the schedule patient with real fixtures. */
  demoClinical?: AdminDemoClinical | null;
};

export function HomePatientClinicDrawer({
  open,
  reservation,
  reservations,
  onClose,
  skipRemoteLoad = false,
  demoClinical = null,
}: Props) {
  const directory = useMemo(
    () => groupReservationsByPatient(reservations),
    [reservations],
  );
  const patientKey = reservation
    ? patientKeyFromReservation(reservation)
    : null;
  const group = patientKey ? getPatientGroup(directory, patientKey) : null;

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<PatientToothNote[]>([]);
  const [imaging, setImaging] = useState<PatientImaging[]>([]);
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const drawer = useAdminDrawerSide();
  const loading = Boolean(open && patientKey && loadedKey !== patientKey);

  useEffect(() => {
    if (!open) {
      setLoadedKey(null);
      return;
    }
    if (!patientKey) return;
    if (skipRemoteLoad) {
      const seeded = demoClinicalForPatient(demoClinical, patientKey);
      setNotes(seeded?.notes ?? []);
      setImaging(seeded?.imaging ?? []);
      setTreatments(seeded?.treatments ?? []);
      setLoadedKey(patientKey);
      return;
    }
    let alive = true;
    setNotes([]);
    setImaging([]);
    setTreatments([]);
    void Promise.all([
      listToothNotes(patientKey),
      listPatientImaging(patientKey),
      listPatientTreatments(patientKey),
    ])
      .then(([n, i, rows]) => {
        if (!alive) return;
        setNotes(n);
        setImaging(i);
        setTreatments(
          (rows as PatientTreatmentRow[]).map((row) => toTreatmentItem(row)),
        );
        setLoadedKey(patientKey);
      })
      .catch((err) => {
        if (!alive) return;
        toast.error(
          err instanceof Error ? err.message : "Could not load Clinical",
        );
        setLoadedKey(patientKey);
      });
    return () => {
      alive = false;
    };
  }, [open, patientKey, skipRemoteLoad, demoClinical]);

  useEffect(() => {
    function onShowreelClose() {
      onClose();
    }
    window.addEventListener("showreel-clinic-drawer-close", onShowreelClose);
    return () =>
      window.removeEventListener("showreel-clinic-drawer-close", onShowreelClose);
  }, [onClose]);

  if (!group) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side={drawer.rtl ? "right" : "left"}
        dir={drawer.contentDir}
        showCloseButton={false}
        data-showreel-action="clinic-drawer"
        className="w-[min(100%,68vw)] min-w-[22rem] max-w-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-[var(--admin-panel)] px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[var(--admin-primary)]">
              {group.displayName}
            </p>
            <p className="truncate text-[12px] text-[var(--admin-muted)]">
              {[
                group.phone || null,
                group.email || null,
                `${group.visits.length} visit${group.visits.length === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            data-showreel-action="clinic-drawer-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--admin-canvas)] p-2 sm:p-3">
          {loading ? (
            <HomePatientClinicDrawerSkeleton />
          ) : (
            <PatientEhrView
              key={group.patientKey}
              group={group}
              treatments={treatments}
              imaging={imaging}
              notes={notes}
              layout="stacked"
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

Dropped compared to the original: the entire local duplicate of the theme-var mechanism (`ADMIN_VAR_KEYS`, `AdminThemeVars`, `FALLBACK_THEME`, `readAdminThemeVars`, the `themeVars` state + two `useEffect`s syncing it, the `ADMIN_THEME_EVENT` listener) — Task 1's CSS fix makes all of it redundant, same reasoning as Task 4. `mounted` state and `createPortal`/`AnimatePresence`/`motion.*` are gone for the same reason as Task 4. The `open && group` guard becomes a plain `if (!group) return null;` early return followed by `<Sheet open={open} ...>` — `Sheet`/Base UI handles not rendering when `open` is false, so we only need to bail before rendering *anything* (including the closed `Sheet`) when there's no patient `group` to show at all (mirrors the original's `{open && group ? (...) : null}` gate, since `group` can be null even while `open` is true, e.g. patient not found in the directory).

- [ ] **Step 2: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors. Confirm `src/features/admin/components/overview/ClinicDashboard.tsx` (the only consumer) still compiles unchanged.

- [ ] **Step 3: Manual verification (requires a human/browser)**

From the Overview dashboard, click a patient row to open the clinical drawer, in both showreel/demo mode (`skipRemoteLoad`) and a real logged-in session, in dark mode. Confirm: loading skeleton shows briefly then the EHR view renders, header patient name/phone/visit-count line is legible, close button and Escape both work, width still spans ~68vw on desktop.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/overview/HomePatientClinicDrawer.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): rebuild the patient clinical drawer on Sheet

Same migration as the other admin drawers (Task: admin shadcn
drawers) - drops its own local duplicate of the theme-var-patching
mechanism along with the createPortal/framer-motion wrapper, since
Task 1's CSS fix makes both redundant. Async imaging/notes/treatments
loading is untouched.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Migrate `AdminMobileNav.tsx` onto `Sheet`

**Files:**
- Modify: `src/features/admin/components/AdminMobileNav.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetContent` from `@/components/ui/sheet` (Task 2).
- Produces: same external `Props` type as before (`pendingCount`, `permissions`). No consumers need changes.
- The original had **no** animation at all (instant show/hide, no framer-motion, no RTL-aware docking) — this migration adds a slide-in animation for free but otherwise preserves the always-left layout (icon rail + nav list), since RTL docking was never part of this component's behavior and isn't part of this task's scope.

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `src/features/admin/components/AdminMobileNav.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { AdminIconRail } from "./AdminIconRail";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  pendingCount?: number;
  permissions?: string[] | null;
};

export function AdminMobileNav({ pendingCount = 0, permissions }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("admin.nav.admin")}
      >
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-auto max-w-none bg-[var(--admin-canvas)] lg:hidden"
        >
          <div className="flex h-full">
            <AdminIconRail permissions={permissions} />
            <div className="flex w-64 flex-col border-e border-[var(--admin-border)]">
              <div className="flex justify-end p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label={t("admin.close")}
                >
                  <X className="size-5" />
                </Button>
              </div>
              <AdminSidebar pendingCount={pendingCount} mobile permissions={permissions} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

Dropped: `mounted` state + `createPortal` (same reasoning as prior tasks). `SheetContent`'s default `max-w-md` is overridden with `w-auto max-w-none` since this panel's width is intrinsic (icon rail + fixed `w-64` list), not a fixed max-width like the other drawers.

- [ ] **Step 2: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Manual verification (requires a human/browser)**

Shrink the browser to a mobile width (`lg` breakpoint or below), open the hamburger menu in dark mode. Confirm it slides in from the left, icon rail + nav list are legible, the X button and Escape both close it.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/AdminMobileNav.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): rebuild the mobile nav drawer on Sheet

Same migration as the other admin drawers (Task: admin shadcn
drawers). The old version had no open/close animation at all - this
picks one up for free from Sheet's default transition.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Migrate `ChatGalleryModal.tsx` onto `Dialog`

**Files:**
- Modify: `src/features/admin/components/support/chat/ChatGalleryModal.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent` from `@/components/ui/dialog` (existing, unchanged).
- Produces: same external `Props` type as before (`images`, `index`, `onIndexChange`, `onClose`). No consumers need changes.
- This is a lightbox, not a form — it needs a fullscreen, no-padding `DialogContent` variant via `className` overrides rather than the default centered card. Custom keyboard nav (arrow keys) and touch-swipe stay as manual handlers (Base UI's Dialog doesn't know about "next/previous image" — only Escape-to-close and focus-trap are inherited for free). Body-scroll-lock and the manual Escape handler are dropped since `Dialog` does both already; the Left/Right arrow-key handling is kept as-is.

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `src/features/admin/components/support/chat/ChatGalleryModal.tsx` with:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { MediaImageItem } from "./collectConversationMedia";

type Props = {
  images: MediaImageItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  onClose: () => void;
};

export function ChatGalleryModal({
  images,
  index,
  onIndexChange,
  onClose,
}: Props) {
  const t = useTranslations();
  const touchStartX = useRef<number | null>(null);
  const open = index !== null && images.length > 0;
  const safeIndex =
    index === null || images.length === 0
      ? 0
      : Math.min(Math.max(index, 0), images.length - 1);
  const current = open ? images[safeIndex] : null;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange(
          safeIndex <= 0 ? images.length - 1 : safeIndex - 1,
        );
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange(
          safeIndex >= images.length - 1 ? 0 : safeIndex + 1,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onIndexChange, open, safeIndex]);

  if (!current) return null;

  function go(delta: number) {
    if (images.length === 0) return;
    const next = (safeIndex + delta + images.length) % images.length;
    onIndexChange(next);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-label={t("admin.frontDesk.chatGalleryAria")}
        className="inset-0 top-0 left-0 flex h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col rounded-none bg-black/85 p-0"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
          <p className="text-sm font-medium tabular-nums">
            {t("admin.frontDesk.chatGalleryCount")
              .replace("{current}", String(safeIndex + 1))
              .replace("{total}", String(images.length))}
          </p>
          <div className="flex items-center gap-1">
            <a
              href={current.url}
              download={current.name ?? "image"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              {t("admin.frontDesk.download")}
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              aria-label={t("admin.frontDesk.chatGalleryClose")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-4"
          onClick={onClose}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            touchStartX.current = null;
            if (start == null) return;
            const end = e.changedTouches[0]?.clientX ?? start;
            const dx = end - start;
            if (Math.abs(dx) < 48) return;
            go(dx < 0 ? 1 : -1);
          }}
        >
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute start-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label={t("admin.frontDesk.chatGalleryPrev")}
              >
                <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute end-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label={t("admin.frontDesk.chatGalleryNext")}
              >
                <ChevronRight className="h-6 w-6 rtl:rotate-180" />
              </button>
            </>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.name ?? t("admin.frontDesk.image")}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>

        {images.length > 1 ? (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
            {images.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onIndexChange(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 ${
                  i === safeIndex ? "ring-white" : "ring-transparent opacity-70"
                }`}
                aria-label={t("admin.frontDesk.chatGalleryThumb").replace(
                  "{n}",
                  String(i + 1),
                )}
                aria-current={i === safeIndex ? "true" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

Note `role="dialog" aria-modal="true"` from the original are dropped — `DialogPrimitive.Popup` already sets these itself. `DialogOverlay` (rendered inside `DialogContent` via `DialogPortal`) adds a `bg-black/10` backdrop *behind* this fullscreen `bg-black/85` content; since the content itself is fullscreen and opaque, the overlay is invisible in practice and harmless (same layering every other `DialogContent` usage already has).

- [ ] **Step 2: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors.

- [ ] **Step 3: Manual verification (requires a human/browser)**

From a WhatsApp conversation with image attachments, open the gallery. Confirm: fullscreen black lightbox, arrow-key and swipe navigation both still work, download link works, Escape and the X button both close it, thumbnail strip highlights the current image.

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/support/chat/ChatGalleryModal.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): rebuild the chat image lightbox on Dialog

Same createPortal removal as the other admin overlays (Task: admin
shadcn drawers), using a fullscreen no-padding DialogContent variant
since this is a lightbox, not a form. Manual body-scroll-lock and
Escape handling are dropped in favor of Dialog's built-in versions;
arrow-key/swipe image navigation is unchanged.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Migrate `CommandPalette.tsx` onto `Dialog`

**Files:**
- Modify: `src/features/admin/components/CommandPalette.tsx`
- Delete: `src/features/admin/lib/commandPaletteMotion.ts`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent` from `@/components/ui/dialog` (existing, unchanged).
- Produces: same external `Props` type as before (`permissions`). No consumers need changes.
- **Deliberate UX change, pre-approved by the user:** the `layoutId={COMMAND_LAYOUT_ID}` shared-element morph (the search bar growing into the full palette panel) is dropped. It depends on `framer-motion`'s `AnimatePresence`/`layoutId` FLIP animation running both the trigger and the panel through the same animation context with matched geometry — fundamentally incompatible with a Base UI `Dialog`, which manages its own portal/mount/unmount lifecycle independently of any specific trigger element's position. The panel now just fades/zooms in from its own position (`DialogContent`'s default `data-open:fade-in-0 data-open:zoom-in-95`), like every other `Dialog` in the app.
- All search/filtering/keyboard-navigation/AI-search logic (`staticHits`, `dynamicHits`, `filtered`, `groups`, `onInputKey`, `go`, the `fetch` effects, the showreel event listener) is **untouched** — only the modal wrapper and the now-dead staged-reveal state (`resultsReady`, `reduced`, `showResults`) are removed.

- [ ] **Step 1: Rewrite the file**

Replace the full contents of `src/features/admin/components/CommandPalette.tsx` with:

```tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CornerDownLeft,
  FileText,
  Globe,
  LayoutGrid,
  MessagesSquare,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { adminPageLabelKeys, adminPagePermissions } from "@/features/admin/lib/adminNav";
import {
  buildStaticCommandHits,
  commandPaletteGroups,
  filterCommandHits,
  pushRecentId,
  recentHits,
  type CommandDisplayGroup,
  type CommandHit,
  type CommandKind,
} from "@/features/admin/lib/commandPalette";
import { scoreCommandHit, shouldUseAiSearch } from "@/features/admin/lib/commandSearch";
import { mergeAiHitOrder } from "@/features/admin/lib/commandSearchExtract";
import { SECTION_LABEL_KEYS } from "@/features/customize/sectionRegistry";
import { isCustomizeSection } from "@/features/customize/types";
import { useOptionalQuickBook } from "@/features/admin/components/quick-book/QuickBookContext";
import {
  SHOWREEL_COMMAND_EVENT,
  dispatchShowreelNavigate,
  type ShowreelCommandDetail,
} from "@/features/portfolio/showreel/product-scenes/showreelAdminEvents";
import { COMMAND_SEARCH_FIXTURE } from "@/features/portfolio/showreel/product-scenes/fixtures/commandSearchFixtures";
import { ADMIN_CLOSE_COMMAND_EVENT } from "@/features/admin/lib/adminShellEvents";

const GROUP_KEYS: Record<CommandKind, AdminMessageKey> = {
  page: "admin.search.group.page",
  patient: "admin.search.group.patient",
  reservation: "admin.search.group.reservation",
  service: "admin.search.group.service",
  "case-study": "admin.search.group.case-study",
  project: "admin.search.group.project",
  thread: "admin.search.group.thread",
  section: "admin.search.group.section",
  public: "admin.search.group.public",
};

const KIND_ICON = {
  page: FileText,
  patient: User,
  reservation: CalendarDays,
  service: LayoutGrid,
  "case-study": FileText,
  project: FileText,
  thread: MessagesSquare,
  section: LayoutGrid,
  public: Globe,
} as const;

function shortcutLabel(): string {
  if (typeof navigator === "undefined") return "⌘K";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘K" : "Ctrl+K";
}

type Props = {
  /** Omit to show every hit unfiltered (e.g. showreel demos with no session). */
  permissions?: string[] | null;
};

export function CommandPalette({ permissions }: Props = {}) {
  const t = useTranslations();
  const permissionSet = useMemo(
    () => (permissions ? new Set(permissions) : null),
    [permissions],
  );
  const router = useRouter();
  const quickBook = useOptionalQuickBook();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [dynamicHits, setDynamicHits] = useState<CommandHit[]>([]);
  const [aiIds, setAiIds] = useState<string[]>([]);
  const [aiUsed, setAiUsed] = useState(false);
  const [demoLocked, setDemoLocked] = useState(false);

  const staticHits = useMemo(
    () =>
      buildStaticCommandHits({
        pageLabel: (href) => {
          const key = adminPageLabelKeys[href];
          return key ? t(key) : href;
        },
        customizeLabel: (section) =>
          isCustomizeSection(section) ? t(SECTION_LABEL_KEYS[section]) : section,
        publicHome: t("admin.search.home"),
        publicServices: t("admin.search.publicServices"),
        publicCaseStudies: t("admin.search.publicCaseStudies"),
        publicFeatured: t("admin.search.publicFeatured"),
        publicExperience: t("admin.search.publicExperience"),
        newReservation: t("admin.search.newReservation"),
      }).filter((hit) => {
        if (hit.kind !== "page" || !permissionSet) return true;
        const required = adminPagePermissions[hit.href];
        return !required || permissionSet.has(required);
      }),
    [t, permissionSet],
  );

  const allHits = useMemo(
    () => [...staticHits, ...dynamicHits],
    [dynamicHits, staticHits],
  );

  const localFiltered = useMemo(
    () => filterCommandHits(allHits, query),
    [allHits, query],
  );

  const filtered = useMemo(
    () =>
      aiIds.length > 0
        ? mergeAiHitOrder(allHits, localFiltered, aiIds)
        : localFiltered,
    [aiIds, allHits, localFiltered],
  );

  const recents = useMemo(
    () => (open ? recentHits(allHits, window.localStorage) : []),
    [allHits, open],
  );

  const groups = useMemo(
    (): CommandDisplayGroup[] => commandPaletteGroups(filtered, query, recents),
    [filtered, query, recents],
  );

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    setAiIds([]);
    setAiUsed(false);
    setDemoLocked(false);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setActive(0);
  }, []);

  useEffect(() => {
    function onCloseCommand() {
      close();
    }
    window.addEventListener(ADMIN_CLOSE_COMMAND_EVENT, onCloseCommand);
    return () =>
      window.removeEventListener(ADMIN_CLOSE_COMMAND_EVENT, onCloseCommand);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    if (demoLocked) return;
    const q = query.trim();
    if (!q) {
      setDynamicHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((response) =>
          response.ok ? response.json() : { hits: [] as CommandHit[] },
        )
        .then((payload: { hits?: CommandHit[] }) => {
          setDynamicHits(Array.isArray(payload.hits) ? payload.hits : []);
        })
        .catch(() => undefined);
    }, 280);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, demoLocked]);

  useEffect(() => {
    setAiIds([]);
    setAiUsed(false);
    if (demoLocked) return;
    if (!open || !query.trim()) return;
    const best = Math.max(
      0,
      ...allHits.slice(0, 200).map((item) => scoreCommandHit(item, query)),
    );
    if (!shouldUseAiSearch(query, best, localFiltered.length)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const seen = new Set<string>();
      const candidates: {
        id: string;
        kind: string;
        title: string;
        subtitle?: string;
      }[] = [];
      for (const item of [...localFiltered, ...allHits]) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        candidates.push({
          id: item.id,
          kind: item.kind,
          title: item.title,
          subtitle: item.subtitle,
        });
        if (candidates.length >= 80) break;
      }
      void fetch("/api/v1/ai/command-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ query, candidates }),
      })
        .then((response) => (response.ok ? response.json() : { ids: [] }))
        .then((payload: { ids?: string[] }) => {
          const ids = Array.isArray(payload.ids) ? payload.ids : [];
          if (ids.length === 0) return;
          setAiIds(ids);
          setAiUsed(true);
        })
        .catch(() => undefined);
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [allHits, demoLocked, localFiltered, open, query]);

  useEffect(() => {
    function onShowreel(event: Event) {
      const detail = (event as CustomEvent<ShowreelCommandDetail>).detail;
      if (!detail) return;
      if (detail.type === "open") {
        openPalette();
        return;
      }
      if (detail.type === "close") {
        close();
        setDemoLocked(false);
        return;
      }
      if (detail.type === "query") {
        setDemoLocked(true);
        setQuery(detail.query);
        setOpen(true);
        setActive(0);
        return;
      }
      if (detail.type === "demo-hits" || detail.type === "seed-demo") {
        setDemoLocked(true);
        setOpen(true);
        setAiUsed(true);
        const seed =
          detail.type === "demo-hits"
            ? detail.hits
            : COMMAND_SEARCH_FIXTURE.hits.map((hit) => ({
                id: hit.id,
                kind: hit.kind,
                title: hit.title,
                subtitle: hit.subtitle,
                href: hit.href ?? "#",
                keywords: hit.title,
              }));
        setDynamicHits(seed as CommandHit[]);
        setAiIds(seed.map((hit) => hit.id));
        setActive(0);
      }
    }
    window.addEventListener(SHOWREEL_COMMAND_EVENT, onShowreel);
    return () =>
      window.removeEventListener(SHOWREEL_COMMAND_EVENT, onShowreel);
  }, [close, openPalette]);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else openPalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open, openPalette]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  function go(hit: CommandHit) {
    if (typeof window !== "undefined") {
      pushRecentId(hit.id, window.localStorage);
    }
    close();
    setDemoLocked(false);
    if (document.documentElement.dataset.showreelDemo === "1") {
      if (hit.href && hit.href !== "#") {
        dispatchShowreelNavigate({
          href: hit.href,
          title: hit.title,
          id: hit.id,
          kind: hit.kind,
        });
      }
      return;
    }
    if (demoLocked) return;
    if (hit.href === "action:quick-book") {
      quickBook?.openQuickBook();
      return;
    }
    if (hit.href === "#") return;
    router.push(hit.href);
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = flat[active];
      if (hit) go(hit);
    }
  }

  const shortcut = shortcutLabel();
  const activeHit = flat[active];

  const aiTag = (
    <span
      title={t("admin.search.ai")}
      aria-label={t("admin.search.ai")}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md",
        aiUsed
          ? "bg-[var(--admin-primary)] text-white"
          : "text-[var(--admin-muted)]",
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
    </span>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) openPalette();
        else close();
      }}
    >
      <button
        type="button"
        onClick={openPalette}
        data-showreel-action="command-palette-open"
        aria-label={t("admin.search.open")}
        className="flex h-8 w-full items-center justify-start gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] px-2.5 text-[var(--admin-text)]"
      >
        <Search className="size-3.5 shrink-0 text-[var(--admin-muted)]" />
        <span className="min-w-0 flex-1 truncate text-start text-[13px] text-[var(--admin-muted)]">
          {t("admin.search")}
        </span>
        {aiTag}
        <kbd className="hidden shrink-0 rounded-md bg-[var(--admin-panel)] px-1.5 py-0.5 text-[10px] text-[var(--admin-muted)] sm:inline">
          {shortcut}
        </kbd>
      </button>

      <DialogContent
        showCloseButton={false}
        aria-label={t("admin.search")}
        className="top-[4.25rem] flex max-h-[min(30rem,70vh)] w-[min(36rem,calc(100vw-1.5rem))] max-w-none translate-y-0 flex-col gap-0 overflow-hidden bg-[var(--admin-canvas)] p-0 text-[var(--admin-text)]"
      >
        <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
          <Search className="size-4 shrink-0 text-[var(--admin-muted)]" />
          <input
            ref={inputRef}
            value={query}
            data-showreel-action="command-palette-input"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder={t("admin.search.hint")}
            className="h-7 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--admin-muted)]"
          />
          {aiTag}
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex size-5 items-center justify-center rounded-md bg-[var(--admin-muted)] text-white"
              aria-label={t("admin.close")}
            >
              <X className="size-3" />
            </button>
          ) : (
            <CornerDownLeft className="size-3.5 text-[var(--admin-muted)]" />
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {flat.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-[var(--admin-muted)]">
              {t("admin.search.empty")}
            </p>
          ) : (
            groups.map((group, groupIndex) => (
              <section key={`${group.kind}-${groupIndex}`}>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="h-px flex-1 bg-[var(--admin-border)]" />
                  <p className="text-[10px] font-medium tracking-wide text-[var(--admin-muted)] uppercase">
                    {group.recent
                      ? t("admin.search.recent")
                      : t(GROUP_KEYS[group.kind])}
                  </p>
                  <div className="h-px flex-1 bg-[var(--admin-border)]" />
                </div>
                <ul>
                  {group.items.map((item) => {
                    const Icon = KIND_ICON[item.kind];
                    const selected = item.id === activeHit?.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          data-showreel-action="command-hit"
                          data-showreel-hit={item.id}
                          onMouseEnter={() =>
                            setActive(flat.findIndex((row) => row.id === item.id))
                          }
                          onClick={() => go(item)}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px]",
                            selected
                              ? "bg-[var(--admin-hover)]"
                              : "hover:bg-[var(--admin-hover)]",
                          )}
                        >
                          <Icon className="size-4 shrink-0 text-[var(--admin-muted)]" />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {item.title}
                          </span>
                          {item.subtitle ? (
                            <span className="hidden max-w-[40%] truncate text-[12px] text-[var(--admin-muted)] sm:inline">
                              {item.subtitle}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Dropped: `createPortal`/`AnimatePresence`/`motion.button`/`motion.div` and the `layoutId`/`commandShellTransition`/`commandBackdropTransition`/`commandResultsTransition` imports from `commandPaletteMotion.ts` (deleted in Step 2), `mounted` state, `useReducedMotion`/`reduced`, `resultsReady`/`showResults` (the staged "wait for the morph to finish before fading results in" reveal — no longer needed since the panel now opens as one atomic `Dialog`), the manual `document.body.style.overflow` lock and the `Escape`-branch of the keydown handler (both provided by `Dialog` now — the global Cmd+K *toggle* handler is kept since that's for opening/closing from anywhere, not `Dialog`-internal).

The trigger `<button>` is now a plain button (previously `motion.button` with `layoutId`) — same classes minus the `shellClass` constant (inlined) and the `h-8 w-full` sizing wrapper `div` (no longer needed without the layoutId placeholder trick the original used at lines 415/439).

- [ ] **Step 2: Delete the now-unused motion helper file**

```bash
git rm src/features/admin/lib/commandPaletteMotion.ts
```

- [ ] **Step 3: Typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors, and confirm nothing else imports `commandPaletteMotion`:

```bash
grep -rn "commandPaletteMotion\|COMMAND_LAYOUT_ID" src
```

Expected: no results.

- [ ] **Step 4: Manual verification (requires a human/browser)**

Press Cmd+K (or Ctrl+K) anywhere in the admin, in dark mode. Confirm: palette opens centered near the top with a fade/zoom-in (no more morph from the search bar — this is the expected, accepted change), typing filters results, arrow keys + Enter navigate and select, AI search kicks in for longer queries, Escape and Cmd+K-while-open both close it, clicking a result navigates and closes.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/CommandPalette.tsx
git commit -m "$(cat <<'EOF'
refactor(admin): rebuild the command palette on Dialog

Drops the framer-motion layoutId shared-element morph (search bar
growing into the panel) in favor of Dialog's plain fade/zoom-in - the
user explicitly accepted this trade-off when scoping the admin shadcn
drawers migration, since layoutId's FLIP animation can't coexist with
a Dialog's independent portal/mount lifecycle. All search/filter/
keyboard-nav/AI-search logic is untouched; only the modal wrapper and
the staged-reveal state it required are gone.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Delete the now-dead theme-var-patching code, full-repo verification

**Files:**
- Delete: `src/features/admin/hooks/useAdminThemeVars.ts`
- Modify: `src/features/admin/lib/adminThemeVars.ts` (remove `adminThemeStyle`, `readAdminThemeVars`, `FALLBACK_ADMIN_THEME`, `ADMIN_VAR_KEYS`, `AdminThemeVars`; keep only the `export { ADMIN_THEME_EVENT }` re-export if anything still imports it *from this module path* — confirm in Step 1 below, since `AdminShell.tsx`/`SettingsDashboardForm.tsx`/`EhrArchStage.tsx` were observed importing `ADMIN_THEME_EVENT` directly from `@/features/admin/lib/adminThemeEvent` instead, which would make this file deletable outright)

**Interfaces:**
- No new interfaces — this is pure dead-code removal, gated on confirming nothing still depends on it after Tasks 4/5/6.

- [ ] **Step 1: Confirm nothing but the migrated files ever used this mechanism**

```bash
grep -rln "adminThemeStyle\|readAdminThemeVars\|useAdminThemeVars\|FALLBACK_ADMIN_THEME\|ADMIN_VAR_KEYS" src
```

Expected: only `src/features/admin/hooks/useAdminThemeVars.ts` and `src/features/admin/lib/adminThemeVars.ts` themselves (their own definitions) — no consumers left, since Tasks 4/5/6 removed the only three call sites (`ReservationFormDrawer.tsx`, `ReservationFormDialog.tsx`, `HomePatientClinicDrawer.tsx`).

Also confirm the `ADMIN_THEME_EVENT` re-export from `adminThemeVars.ts` has no importers of its own:

```bash
grep -rn 'from "@/features/admin/lib/adminThemeVars"' src
```

Expected: no results (every remaining consumer of `ADMIN_THEME_EVENT` — `AdminShell.tsx`, `SettingsDashboardForm.tsx`, `EhrArchStage.tsx` — imports it from `@/features/admin/lib/adminThemeEvent` directly, not through this file).

If either check finds an unexpected consumer, stop and investigate before deleting — do not delete code a live import still needs.

- [ ] **Step 2: Delete the two files**

```bash
git rm src/features/admin/hooks/useAdminThemeVars.ts
git rm src/features/admin/lib/adminThemeVars.ts
```

(`adminThemeEvent.ts`, the tiny file defining just the `ADMIN_THEME_EVENT` string constant, is untouched — it's still used by `AdminShell.tsx`/`SettingsDashboardForm.tsx`/`EhrArchStage.tsx` for live theme-color-change notifications, unrelated to portal CSS-var patching.)

- [ ] **Step 3: Full-repo typecheck**

```bash
GITHUB_TOKEN=x yarn tsc --noEmit -p tsconfig.json
```

Expected: no errors anywhere in the repo.

- [ ] **Step 4: Run the existing test suite**

```bash
GITHUB_TOKEN=x yarn test
```

(If `yarn test` isn't the right script name, check `package.json`'s `scripts` block first — this repo's tests run via `node --experimental-strip-types --import ./scripts/test-loader.mjs --test <files>`, seen earlier in this session's process list.)

Expected: all existing tests still pass — none of them exercise these UI components directly, so this is mainly a regression guard for anything that imports from the deleted/modified files indirectly.

- [ ] **Step 5: Full manual QA pass (requires a human/browser)**

Re-verify every migrated surface once, together, in one pass, in both light and dark mode: the 6 `SideDrawer`-backed treatment/patient drawers, the reservation details drawer, the "new reservation" dialog, the patient clinical drawer, the mobile nav, the chat gallery, and the command palette. This is the final sign-off — everything up to here was verified individually per-task; this step catches anything that only breaks when multiple overlays interact (e.g. opening the command palette from within another open drawer).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(admin): delete the now-unused theme-var-patching mechanism

useAdminThemeVars.ts and adminThemeVars.ts's adminThemeStyle/
readAdminThemeVars/FALLBACK_ADMIN_THEME were only ever consumed by
ReservationFormDrawer.tsx, ReservationFormDialog.tsx, and
HomePatientClinicDrawer.tsx - all three migrated off it onto Sheet/
Dialog plus the globals.css dark-token fix earlier in this series.
Nothing else imports it (ADMIN_THEME_EVENT, the one thing other files
needed, lives in the separate adminThemeEvent.ts and is untouched).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** Sheet primitive built on Base UI (not Radix, not a centered-Dialog fallback) — Task 2. All 6 in-scope surfaces migrated — Tasks 3, 4, 6, 7, 8, 9. `ReservationFormDialog.tsx` touched too, as flagged in Global Constraints — Task 5. CollectionTable's bulk-action bar explicitly excluded — noted in File Structure and Global Constraints, no task created for it. Command Palette's morph trade-off explicitly called out — Task 9. No new dependencies — confirmed throughout (only `@base-ui/react`, `lucide-react`, `cn` reused).
- **Placeholder scan:** every code step above is complete, runnable file content or a precise before/after diff — no "TBD"/"add appropriate X" left in any step.
- **Type consistency:** `SheetContent`'s `side?: "left" | "right"` (Task 2) is used identically in Tasks 3, 4, 6 (`side={drawer.rtl ? "right" : "left"}`) and Task 7 (`side="left"`, fixed). `Sheet`'s `onOpenChange` → `onClose` adapter (`(next) => { if (!next) onClose(); }`) is the same pattern in every migrated drawer. `SheetHeader`/`SheetFooter`/`SheetTitle`/`SheetDescription`/`SheetClose` names match their `Dialog*` counterparts exactly, so no engineer reading Task 4 in isolation has to guess an export name from Task 2.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-14-admin-shadcn-drawers.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
