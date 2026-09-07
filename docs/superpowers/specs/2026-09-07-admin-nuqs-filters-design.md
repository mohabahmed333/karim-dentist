# Server-side reservation filters (nuqs)

## Goal
URL-driven filters (`from`, `to`, `status`, `service`, `q`, `compare`) on dashboard, reservations, and patients. Filter in Supabase via `listReservationsServer`, not client arrays.

## Approach
Install `nuqs` + `NuqsAdapter` on admin layout. Shared parsers + `parseReservationFilters`. Pages read `searchParams`, query server, pass rows down. Filter bars use `useQueryStates(..., { shallow: false })`.
