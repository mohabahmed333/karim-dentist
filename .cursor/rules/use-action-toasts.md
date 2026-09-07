# Action feedback (toasts)

## When this applies

Any **user-initiated** write or long async action: React Query **mutations**, CSV export, “apply” dialogs, etc.

## Required behavior

1. **Success** — Call `toastSuccess("…")` from [`AppToaster`](../../src/components/ui/AppToaster/index.tsx) in `onSuccess` (or after a resolved promise) so the user gets confirmation.

2. **Error** — Call `toastFromError(error)` in `onError` (or `catch`). Do **not** show raw Postgres / Supabase / JWT strings when they may leak implementation detail; `toastFromError` uses [`mapErrorMessage`](../../src/lib/toast/mapErrorMessage.ts).

3. **Advanced** — Use `toast` from the same module for `toast.promise` or custom durations when needed.

4. **Provider** — `<AppToaster />` is mounted once in [`App.tsx`](../../src/App.tsx); do not add a second `<Toaster />`.

## Reference wiring

- Users: [`UsersPage.tsx`](../../src/features/users/UsersPage.tsx) (status, delete, export), [`CreateUserPage.tsx`](../../src/features/users/create-user/CreateUserPage.tsx), [`UpdateUserPage.tsx`](../../src/features/users/update-user/UpdateUserPage.tsx)
- Roles: [`RolesPage.tsx`](../../src/features/roles/RolesPage.tsx), [`CreateRolePage.tsx`](../../src/features/roles/create-role/CreateRolePage.tsx), [`UpdateRolePage.tsx`](../../src/features/roles/update-role/UpdateRolePage.tsx), [`CloneFromRoleDialog.tsx`](../../src/features/roles/components/CloneFromRoleDialog.tsx)

## Out of scope

Initial **list load** failures (`isError` on first fetch) may keep inline error text unless product asks for a toast.
