# Server-side filters (nuqs + Supabase) — design

Approved one-pass: all product filters query Supabase (or API over it); no client filtering of fetched list data. Includes search, date, sort, **pagination**.

## Surfaces
1. CollectionTable chrome → `serverFiltering` (nuqs) + server queries  
2. Reservations — dual fetch: calendar month list + paginated table (`listReservationsPageServer`)  
3. Patients — SQL status/service/q; cohort/date/sort/page of groups in RSC (`pagePatientGroups`)  
4. WhatsApp inbox — `listConversations({ q, status, sort })` + URL `iq`/`istatus`/`isort`  
5. Service pickers — debounced `GET /api/admin/services?q=`  
6. Command palette — debounced `GET /api/admin/search?q=` (no full index preload)

## Exceptions
Column visibility, row selection, static empty-query palette links, CMS board editors (still load full lists for CRUD reorder; table chrome client-filters until dedicated CMS list pages).
