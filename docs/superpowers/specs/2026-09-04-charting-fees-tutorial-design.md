# Charting doctor fees + first-visit tutorial

Date: 2026-09-04

## Goal

The dentist types every procedure fee in Charting. A first-visit overlay teaches the three panels; **How this page works** replays it.

## Fees

- Catalog is `{ code, title, defaultPhase }` only. No `defaultFee`.
- Add: select a tooth → pick CDT → type whole EGP → **Add**. Empty/invalid fee disables Add.
- Edit: EGP field on the row; persist `fee_amount` on blur if the integer changed.
- Insurance % stays plan-level in `localStorage`. Totals still sum open + scheduled only.
- Existing rows keep their stored amounts until edited.

## Tutorial

- Auto-open once (`charting.tourDismissed.v1` ≠ `"1"`).
- Three steps: chart, diagnostics, planner (fees). Skip / Done writes `"1"`.
- Replay does not clear dismiss; it only reopens the overlay.

## Non-goals

Clinic-wide price settings, cents, per-line insurance, copying the Customize tour engine.
