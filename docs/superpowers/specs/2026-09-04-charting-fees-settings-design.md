# Charting fees (Settings)

Date: 2026-09-04

## Goal

Clinic admins edit CDT fees and the 4 chairside chips under Settings → Charting fees. Charting reads those values clinic-wide from Supabase.

## Schema

- `clinic_cdt_fees`: `code` PK (`^D[0-9]{4}$`), `fee_egp` int ≥ 0, `updated_at`
- `clinic_treatment_presets`: `slot` PK 1–4, `code` FK → fees, `label` text
- RLS: authenticated `is_admin()` ALL
- Seed: CDT catalog codes + Fill/Crown/Root Canal/Extract presets

## UI

Settings tabs: Site | Charting fees. Fees table + 4 chip slots (code + label; fee from schedule).

## Charting

Chips resolve from presets + fees; hardcoded defaults if empty. Existing treatment fees unchanged.
