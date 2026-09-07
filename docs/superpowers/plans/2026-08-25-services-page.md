# Services Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dark Services section (home + `/services`), CMS, admin, motion, hardcoded nav.

**Tech:** Next.js App Router, Supabase migration+RLS, Customize collection pattern, GSAP ScrollTrigger.

## Tasks

1. Migration `services` + settings columns + seed + RLS; regen types
2. Portfolio data: fetch services; Zod if used
3. UI: `ServicesSection` + CSS + scroll/hover motion
4. Wire home + `/services` page; nav Work link always
5. Customize: section registry, panel, collection CRUD, preview
6. Admin: `/admin/services` + overview card + sidebar
7. Verify locally (page render, customize, types)
