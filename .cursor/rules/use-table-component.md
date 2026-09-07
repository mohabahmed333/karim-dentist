---
name: use-table-component
description: Use PaginatedTable + nuqs for list pages with server-side pagination
version: "1.1.0"
---

## Rule

For **data tables backed by the database**, use **`PaginatedTable`** from `@/components/ui/table/PaginatedTable` (not raw `<table>`). For **server-side pagination synced to the URL**, follow the **nuqs + React Query** pattern used on permissions and roles list pages.

## Paginated list pattern (nuqs + Supabase)

1. **URL state** — `usePaginationParams(defaultPageSize)` from `@/components/ui/table/PaginatedTable/usePaginationParams` (reads/writes `page` and `pageSize` via **nuqs**).
2. **Query key** — Add a factory on `queryKeys.<entity>.paginated(params)` in `@/lib/constants/queryKeys.ts` (same shape as `queryKeys.permissions.paginated`).
3. **Data hook** — `useQuery` with that key; `queryFn` runs a **count** query (`head: true`) plus a **`.range(offset, offset + pageSize - 1)`** data query (see `usePaginatedPermissions`, `usePaginatedRoles` in `@/services/permissions/queries`, `@/services/roles/paginated-queries`).
4. **Table** — Pass into `PaginatedTable`:
   - `paramName="page"` so page syncs with the URL (1-based in URL; table handles conversion),
   - `totalCount={data?.totalCount ?? 0}`,
   - `pageSize={PAGE_SIZE}` (constant, typically `10`, aligned with `usePaginationParams(PAGE_SIZE)`).
5. **Filters** — If URL filters exist (e.g. `useQueryState("module", …)`), reset page with **`useResetPageWhenFiltersChange(page, setPage, filterKey)`** from `@/components/ui/table/PaginatedTable/useResetPageWhenFiltersChange` (build a stable `filterKey` string from filter values). Do **not** use `useEffect(..., [setPage])` — nuqs `setPage` identity can change every render and cause **Maximum update depth exceeded**.
6. **Mutations** — `invalidateQueries({ queryKey: queryKeys.<entity>.all })` (or the list root) so **paginated** queries refetch; do not rely on optimistic `setQueryData` against the full unpaginated list unless that query is still used.

## Imports reference

```tsx
import { PaginatedTable } from "@/components/ui/table/PaginatedTable";
import { usePaginationParams } from "@/components/ui/table/PaginatedTable/usePaginationParams";
import { useResetPageWhenFiltersChange } from "@/components/ui/table/PaginatedTable/useResetPageWhenFiltersChange";
import { useQueryState, parseAsString } from "nuqs"; // optional filters
```

## Legacy / simple tables

For non-paginated or purely client-side tables, still prefer shared table primitives under `@/components/ui/table` over ad-hoc markup.

## Why

- Consistent UX, loading states, and pagination controls
- Shareable URLs (`?page=2&pageSize=10`)
- Cache keys stay explicit and invalidation stays predictable
