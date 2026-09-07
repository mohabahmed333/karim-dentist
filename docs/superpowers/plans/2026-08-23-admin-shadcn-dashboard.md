# Phase 1: shadcn Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **Note:** Do **not** use subagent-driven-development in this repo (user constraint: no Task/subagents). Execute inline in the current session.

**Goal:** Rebuild `/admin` as a light, clean shadcn CMS (sidebar + one page per section) while keeping existing Supabase services and CRUD behavior.

**Architecture:** Install shadcn (New York / neutral) with CSS variables scoped under `.admin-shell` so the dark public portfolio is untouched. Replace board/kanban editors with Table + inline edit Card. Reuse `useBoardCrud` (rename only if cheap). Phase 2 media uploads are out of scope.

**Tech Stack:** Next.js App Router 16, React 19, Tailwind CSS v4, shadcn/ui, yarn, Supabase client services already in `src/services/*`

**Spec:** `docs/superpowers/specs/2026-08-23-admin-shadcn-media-design.md` (Phase 1 only)

## Global Constraints

- Max ~100 lines per TS/TSX file; named exports only; no `any`
- Shared UI only in `src/components/ui/` — ask before adding primitives beyond the list in this plan
- Import Supabase only from `@/lib/supabase/client` or `server`
- Use `yarn` only (never npm/pnpm)
- Do not edit applied migrations in Phase 1
- Do not implement Phase 2 uploads / `media_type` columns / extra seeds
- Public portfolio styles in `globals.css` (non-admin) must keep working
- No test runner in repo yet — verify with `yarn lint` and `yarn build`; manual smoke of `/admin`
- Commits only when the user explicitly asks (skip commit steps unless requested)

---

## File map

| Path | Responsibility |
|---|---|
| `components.json` | shadcn config |
| `src/components/ui/*` | shadcn primitives |
| `src/lib/utils.ts` | `cn()` helper |
| `src/app/globals.css` | Add shadcn tokens scoped to `.admin-shell`; remove unused `.admin-board*` after migration |
| `src/app/admin/(dashboard)/layout.tsx` | Shell wrapper with `admin-shell` + Toaster |
| `src/features/admin/components/AdminSidebar.tsx` | Light sidebar nav |
| `src/features/admin/components/AdminTopbar.tsx` | Section title bar |
| `src/features/admin/components/LoginForm.tsx` | shadcn login |
| `src/features/admin/components/AdminPageHeader.tsx` | Title + primary action row |
| `src/features/admin/components/ConfirmDeleteDialog.tsx` | Delete confirmation |
| `src/features/admin/components/CollectionTable.tsx` | Reusable list table |
| `src/features/admin/components/*Editor.tsx` | Section pages (no board) |
| `src/features/admin/components/*Form.tsx` | shadcn form fields |
| Delete after unused: `AdminBoard`, `AdminColumn`, `AdminCard`, `AdminSidePanel`, `AdminNewButton`, `AdminPanelActions`, `PublishColumn`, `boardCards.ts` |

---

### Task 1: Install shadcn and scope light theme to admin

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/label.tsx`, `src/components/ui/card.tsx`, `src/components/ui/separator.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/select.tsx`, `src/components/ui/table.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/sonner.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/dropdown-menu.tsx`
- Modify: `package.json`, `yarn.lock`, `src/app/globals.css`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[])` from `@/lib/utils`
- Produces: shadcn components imported as `@/components/ui/<name>`

- [ ] **Step 1: Init shadcn with yarn**

Run from repo root (non-interactive where possible):

```bash
cd /Users/mohab/Desktop/video_repo
yarn dlx shadcn@latest init -y -b new-york -c neutral --css-variables
```

If the CLI prompts, choose: TypeScript yes, App Router, `src/`, CSS `src/app/globals.css`, alias `@/*`.

- [ ] **Step 2: Add required components**

```bash
yarn dlx shadcn@latest add button input textarea label card separator dialog select table badge sonner skeleton dropdown-menu
```

- [ ] **Step 3: Scope theme variables to `.admin-shell`**

In `src/app/globals.css`, ensure shadcn `:root` / `@theme` tokens that force light backgrounds do **not** override the public dark site. Preferred pattern:

1. Keep public `:root` dark tokens as they are today.
2. Move or duplicate shadcn light tokens under:

```css
.admin-shell {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  /* …remaining shadcn neutral tokens… */
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  font-family: ui-sans-serif, system-ui, sans-serif;
}
```

3. Admin layout root element must use `className="admin-shell …"`.

Do not change public `.site-nav` / hero styles.

- [ ] **Step 4: Verify install**

Run: `yarn build`  
Expected: compile succeeds (or only pre-existing unrelated errors). If `cn` / radix imports fail, fix `package.json` deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, radix packages).

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add components.json src/lib/utils.ts src/components/ui package.json yarn.lock src/app/globals.css
git commit -m "chore(admin): add shadcn ui primitives"
```

---

### Task 2: Rebuild admin shell (sidebar, topbar, layout, toaster)

**Files:**
- Modify: `src/app/admin/(dashboard)/layout.tsx`
- Modify: `src/features/admin/components/AdminSidebar.tsx`
- Modify: `src/features/admin/components/AdminTopbar.tsx`
- Create: `src/features/admin/components/AdminPageHeader.tsx`

**Interfaces:**
- Consumes: `Button`, `Separator` from `@/components/ui/*`
- Produces: `AdminPageHeader({ title, description?, actions? })`

- [ ] **Step 1: Rewrite `AdminSidebar`**

Replace `.admin-nav` class styling with Tailwind light layout:

```tsx
// outline — keep same hrefs as today
export function AdminSidebar() {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-background p-4">
      {/* brand, nav groups Workspace / Content / Site, View site link */}
    </aside>
  );
}
```

Active link: `bg-muted text-foreground`; inactive: `text-muted-foreground hover:bg-muted/60`.

Keep routes:
- `/admin` Overview
- `/admin/hero`, `/about`, `/case-studies`, `/featured`, `/experience`, `/clients`
- `/admin/settings`
- Footer: `/` View site

File must stay ≤100 lines (split `AdminNavLink.tsx` if needed).

- [ ] **Step 2: Rewrite `AdminTopbar`**

Simple top bar: breadcrumb or page title placeholder + optional slot. Prefer reading nothing heavy — title can come from children via `AdminPageHeader` instead. Topbar may just show “Admin” + link to site.

- [ ] **Step 3: Add `AdminPageHeader`**

```tsx
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
```

- [ ] **Step 4: Update dashboard layout**

```tsx
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
```

- [ ] **Step 5: Visual check**

Run: `yarn dev` → open `/admin/login` then `/admin` after auth.  
Expected: light sidebar + content; public `/` still dark.

- [ ] **Step 6: Commit (only if user asked)**

---

### Task 3: Restyle login

**Files:**
- Modify: `src/features/admin/components/LoginForm.tsx`
- Modify: `src/app/admin/login/page.tsx` (if present)

**Interfaces:**
- Consumes: `Card`, `Input`, `Label`, `Button` from `@/components/ui/*`
- Auth API unchanged: `createClient().auth.signInWithPassword`

- [ ] **Step 1: Wrap login page in a light centered shell**

Login route is outside `(dashboard)` — wrap form in:

```tsx
<div className="admin-shell flex min-h-screen items-center justify-center bg-background p-6">
  <LoginForm />
</div>
```

so shadcn light tokens apply.

- [ ] **Step 2: Rebuild `LoginForm` with Card**

Same submit logic; UI:

```tsx
<Card className="w-full max-w-sm p-6">
  <h1 className="mb-4 text-xl font-semibold">Admin login</h1>
  {/* Label+Input email, Label+Input password, error text, Button submit */}
</Card>
```

- [ ] **Step 3: Smoke test sign-in**

Expected: success → `/admin`; bad password shows error string.

- [ ] **Step 4: Commit (only if user asked)**

---

### Task 4: Shared collection helpers (header actions + delete dialog + table)

**Files:**
- Create: `src/features/admin/components/ConfirmDeleteDialog.tsx`
- Create: `src/features/admin/components/CollectionTable.tsx`
- Keep: `src/features/admin/hooks/useBoardCrud.ts` (reuse as-is)

**Interfaces:**
- Produces:

```tsx
export function ConfirmDeleteDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  pending?: boolean;
  onConfirm: () => void;
}): JSX.Element;

export type CollectionColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
};

export function CollectionTable<T extends { id: string }>(props: {
  rows: T[];
  columns: CollectionColumn<T>[];
  onRowClick: (id: string) => void;
  emptyMessage?: string;
}): JSX.Element;
```

- [ ] **Step 1: Implement `ConfirmDeleteDialog`**

Use shadcn `Dialog`. Primary destructive button calls `onConfirm`. Cancel closes. Disable buttons when `pending`.

- [ ] **Step 2: Implement `CollectionTable`**

Use shadcn `Table`. Clicking a row calls `onRowClick(row.id)`. Show empty state paragraph when `rows.length === 0`.

- [ ] **Step 3: Ensure both files ≤100 lines**

- [ ] **Step 4: Commit (only if user asked)**

---

### Task 5: Singleton editors — Hero, About, Settings

**Files:**
- Modify: `src/features/admin/components/HeroEditor.tsx`
- Modify: `src/features/admin/components/AboutEditor.tsx`
- Modify: `src/features/admin/components/SettingsEditor.tsx`

**Interfaces:**
- Consumes: `AdminPageHeader`, `Card`, `Input`, `Textarea`, `Label`, `Button`, `Select`, `toast` from `sonner`
- Services unchanged: `updateHero`, about/settings mutations

- [ ] **Step 1: Convert each editor to Card + shadcn fields**

Pattern:

```tsx
export function HeroEditor({ hero }: { hero: Hero | null }) {
  // keep existing onSubmit logic
  return (
    <>
      <AdminPageHeader title="Hero" description="Homepage hero copy and media URLs." />
      <Card className="max-w-2xl space-y-4 p-6">
        {/* fields */}
        <Button type="submit" form="hero-form" disabled={pending}>Save</Button>
      </Card>
    </>
  );
}
```

On success: `toast.success("Saved")`. On error: `toast.error(message)`.

Phase 1: keep media URL **text inputs** (no file upload redesign required beyond existing `ImageUploadField` if already used on About — may restyle later in Task 5b).

- [ ] **Step 2: Restyle About’s existing `ImageUploadField` lightly**

Optional in this task: wrap upload control with Tailwind classes so it doesn’t look like old dark admin. Do not change upload API.

- [ ] **Step 3: Manual save on Hero / About / Settings**

Expected: toast + persisted values after refresh.

- [ ] **Step 4: Commit (only if user asked)**

---

### Task 6: Collection editors — Case studies + Featured

**Files:**
- Modify: `src/features/admin/components/CaseStudiesEditor.tsx`
- Modify: `src/features/admin/components/FeaturedEditor.tsx`
- Modify: `src/features/admin/components/CaseStudyForm.tsx`
- Modify: `src/features/admin/components/FeaturedForm.tsx`
- Delete when unused: board helpers listed in file map

**Interfaces:**
- Consumes: `useBoardCrud`, `CollectionTable`, `ConfirmDeleteDialog`, `AdminPageHeader`, form components
- Services: `createCaseStudy`, `updateCaseStudy`, `softDeleteCaseStudy`, featured equivalents

- [ ] **Step 1: Rewrite `CaseStudiesEditor` (no board)**

```tsx
export function CaseStudiesEditor({ items: initial }: { items: CaseStudy[] }) {
  const board = useBoardCrud<CaseStudy>({ /* same create/update/remove as today */ });
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <AdminPageHeader
        title="Case studies"
        actions={
          <Button onClick={() => void board.addItem(false)} disabled={board.pending}>
            New case study
          </Button>
        }
      />
      <CollectionTable
        rows={board.items}
        columns={[/* title, year, category, Badge published/draft */]}
        onRowClick={board.openItem}
        emptyMessage="No case studies yet."
      />
      {board.selected ? (
        <Card className="mt-6 max-w-2xl space-y-4 p-6">
          <div className="flex justify-between gap-2">
            <h2 className="text-lg font-medium">Edit</h2>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
          </div>
          <CaseStudyForm … />
          <Button type="submit" form="case-study-form" disabled={board.pending}>Save</Button>
        </Card>
      ) : null}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pending={board.pending}
        onConfirm={() => { void board.onDelete(); setDeleteOpen(false); }}
      />
    </>
  );
}
```

- [ ] **Step 2: Convert `CaseStudyForm` to shadcn Label/Input/Textarea/Select**

Keep field names and submit payload identical. Keep `ImageUploadField` for card image (Phase 1).

- [ ] **Step 3: Mirror for Featured (`FeaturedEditor` + `FeaturedForm`)**

Same list + edit card pattern; create title `"Untitled"`.

- [ ] **Step 4: Manual CRUD**

Create → appears in table → edit → save → delete confirm → gone. Unlimited rows.

- [ ] **Step 5: Commit (only if user asked)**

---

### Task 7: Collection editors — Experience + Clients + Overview

**Files:**
- Modify: `src/features/admin/components/ExperienceEditor.tsx`
- Modify: `src/features/admin/components/ExperienceForm.tsx`
- Modify: `src/features/admin/components/ClientsEditor.tsx`
- Modify: `src/features/admin/components/ClientForm.tsx`
- Modify: `src/app/admin/(dashboard)/page.tsx`

**Interfaces:** Same collection pattern as Task 6.

- [ ] **Step 1: Rewrite Experience + Clients editors** like Task 6 (table + edit card + delete dialog)

- [ ] **Step 2: Restyle Overview page**

Use `AdminPageHeader` + grid of `Card` links (stats). Keep data fetching in the server page.

- [ ] **Step 3: Smoke all sidebar routes**

Expected: every `/admin/*` page renders light UI without board columns.

- [ ] **Step 4: Commit (only if user asked)**

---

### Task 8: Remove dead board UI and unused admin CSS; verify build

**Files:**
- Delete: `AdminBoard.tsx`, `AdminColumn.tsx`, `AdminCard.tsx`, `AdminSidePanel.tsx`, `AdminNewButton.tsx`, `AdminPanelActions.tsx`, `PublishColumn.tsx`, `utils/boardCards.ts` (if unused)
- Modify: `src/app/globals.css` — remove unused `.admin-board`, `.admin-column`, `.admin-issue-card`, `.admin-side-panel`, etc. Keep only what’s still referenced OR remove all legacy `.admin-*` once Tailwind covers shell.

**Interfaces:** None.

- [ ] **Step 1: Grep for deleted component imports**

```bash
rg "AdminBoard|PublishColumn|AdminSidePanel|boardCards|admin-board" src
```

Expected: no remaining imports.

- [ ] **Step 2: Delete dead files; trim CSS**

- [ ] **Step 3: Final verification**

```bash
yarn lint
yarn build
```

Expected: both pass.

Manual: login → overview → hero save → create case study → create featured → delete one item.

- [ ] **Step 4: Update `todo.md` — mark Phase 1 complete; Phase 2 pending**

- [ ] **Step 5: Commit (only if user asked)**

```bash
git commit -m "feat(admin): rebuild dashboard with shadcn"
```

---

## Spec coverage check

| Spec Phase 1 requirement | Task |
|---|---|
| Install shadcn New York / neutral | 1 |
| Primitives list | 1 |
| AdminShell light sidebar | 2 |
| Routes per section (existing) | 2–7 (unchanged routes) |
| List sections = table + edit | 4, 6, 7 |
| Singletons = Card form | 5 |
| Delete via Dialog | 4, 6, 7 |
| Login restyle | 3 |
| Keep services / no Phase 2 media | all |
| `yarn build` | 1, 8 |

## Phase 2 (not in this plan)

Separate plan after Phase 1 ships: `media_type` columns, `MediaUploadField`, ~10/~10 seeds, public video render.

---

## Self-review notes

- No TBD placeholders.
- `useBoardCrud` kept to avoid a pointless rename mid-migration.
- Theme scoping called out explicitly to protect public dark site.
- User “no subagents” / “commit only when asked” reflected in header and commit steps.
