# Permission guards (pilot)

## Scope

Use for **Users** and **Roles** features: wrap destructive or mutating controls with `PermissionGuard`, and wrap route elements with `ProtectedRoute`. Keys live in `@/lib/permissions/schema` (`PERMISSIONS`) and must match rows in `public.permissions`.

## Imports

- `PermissionGuard`, `Can` — `@/components/permissions/PermissionGuard`, `@/components/permissions/Can`
- `ProtectedRoute` — `@/components/routing/ProtectedRoute`
- `useEffectivePermissions` — `@/hooks/useEffectivePermissions` (`can()`, `keys`)

## Rules

1. New **route** under `/users` or `/roles`: wrap in `ProtectedRoute` in `src/routes.tsx` with the correct key (`users.read`, `users.write`, `roles.read`, `roles.manage`, …).
2. New **toolbar / table / form action**: wrap with `PermissionGuard` (or `GuardedButton` / `GuardedLinkButton` from `@/components/permissions/ActionGuards`).
3. Do not rely on UI hiding alone for security — tighten **RLS** separately when changing who may mutate data.
