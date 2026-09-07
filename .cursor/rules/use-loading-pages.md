# Loading pages (breadcrumbs + skeletons)

## When this applies

Feature **list** and **create/edit** pages that wait on React Query (or similar) before showing the main UI.

## Required patterns

1. **Breadcrumb navigation** — Use [`PageBreadcrumb`](../../src/components/ui/PageBreadcrumb/index.tsx) with `items: { label, to? }[]`. Every segment except the last should include `to` (e.g. `Dashboard` → `/`, parent list → `/users` or `/roles`). The current page is the last item with **no** `to` (plain text, `aria-current="page"`).

2. **Skeletons instead of bare “Loading…”** — When the page layout is known, use [`Skeleton`](../../src/components/ui/skeleton.tsx) and/or feature skeletons:
   - Users: [`UserFormPageSkeleton`](../../src/features/users/components/UserFormPageSkeleton.tsx) for create/edit while roles or user data loads.
   - Roles: [`RoleFormPageSkeleton`](../../src/features/roles/components/RoleFormPageSkeleton.tsx) for create/edit while role or permissions load; [`RolePermissionsPickerSkeleton`](../../src/features/roles/components/RolePermissionsPickerSkeleton.tsx) inside the permissions picker.

3. **Tables** — Keep using [`PaginatedTable`](../../src/components/ui/table/PaginatedTable/) `loading` for the table body; add header/breadcrumb skeletons above the table when the title or counts depend on the same fetch.

## Reference implementations

- [`UsersPage.tsx`](../../src/features/users/UsersPage.tsx), [`CreateUserPage.tsx`](../../src/features/users/create-user/CreateUserPage.tsx), [`UpdateUserPage.tsx`](../../src/features/users/update-user/UpdateUserPage.tsx)
- [`RolesPage.tsx`](../../src/features/roles/RolesPage.tsx), [`CreateRolePage.tsx`](../../src/features/roles/create-role/CreateRolePage.tsx), [`UpdateRolePage.tsx`](../../src/features/roles/update-role/UpdateRolePage.tsx)
