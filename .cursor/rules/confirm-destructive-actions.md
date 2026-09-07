---
name: confirm-destructive-actions
description: Use ConfirmDeleteDialog + trash icon for deletes; never window.confirm
version: "1.0.0"
---

## Rule

For **delete / destructive actions** in the UI:

1. **Do not use `window.confirm`** — it is inaccessible, ugly, and untestable.
2. Use **`ConfirmDeleteDialog`** from `@/components/ui/ConfirmDeleteDialog` with **controlled** `open` / `onOpenChange` and copy in `title` + `description` that names the entity.
3. Table rows should expose a **trash icon** (`Trash2` from `lucide-react`) on a ghost `Button` with `aria-label` including the item name; `onClick` must **`stopPropagation`** so row click navigation does not fire.
4. Open the dialog from the page: e.g. `onRequestDelete: (item) => setDeleteTarget(item)`. On confirm, run the **React Query mutation**; close the dialog in **`onSuccess`** (and invalidate list keys). Pass **`isPending`** into the dialog so both actions disable while deleting.

## Reference implementations

- `src/features/roles/RolesPage.tsx`, `columns.tsx`, `components/RoleTableActions.tsx`
- `src/features/permissions/PermissionsListPage.tsx`, `columns.tsx`, `components/PermissionTableActions.tsx`
- Shared dialog: `src/components/ui/ConfirmDeleteDialog/`

## Optional

- Secondary actions (e.g. duplicate) stay in a **`MoreHorizontal`** menu; delete stays a **dedicated destructive affordance** (trash), not buried only in a menu.
