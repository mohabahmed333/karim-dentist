# Admin Overview — Supabase storage usage

Date: 2026-08-27

## Goal

On `/admin` Overview, show a storage card: **used**, **remaining**, and **% of Supabase plan** file-storage quota.

## Approach

1. **Used bytes** — service-role recursive list of public buckets `hero`, `about`, `projects`, `clients`; sum object `metadata.size`.
2. **Plan limit** — map `SUPABASE_PLAN` (`free` → 1 GB, `pro`/`team` → 100 GB) to official Supabase file-storage quotas; optional `SUPABASE_STORAGE_QUOTA_BYTES` override for custom enterprise limits.
3. **UI** — one Overview card: used / limit, remaining, plan badge, progress bar.

## Env

```
SUPABASE_PLAN=free
# SUPABASE_STORAGE_QUOTA_BYTES=
```

Requires `SUPABASE_SERVICE_ROLE_KEY` on the server (already used for admin ops).

## Out of scope

- Per-bucket breakdown page
- Blocking uploads at quota
- Customize sidebar widget
