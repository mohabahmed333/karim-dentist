# Admin nuqs server filters — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Steps in `/todo.md`.

**Goal:** Shared URL filters + server-side Supabase filtering on dashboard, reservations, patients.

**Tasks:**
1. Add `nuqs` + adapter
2. Shared filter parsers + `listReservationsServer` filters
3. Shared `AdminReservationFilters` UI
4. Wire dashboard / reservations / patients pages
5. Smoke typecheck

**Not in scope:** Attention items special-cased (use same filtered set).
