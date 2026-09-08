# Reservations calendar: month switch animation

## Goal

When staff use prev/next on the appointments month calendar, the grid slides and the month title cross-fades in sync (RTL-aware). Respects `prefers-reduced-motion`.

## Approach

Framer Motion `AnimatePresence` (same stack as day schedule / compact inbox):

- Title: fade + slight vertical swap (`mode="wait"`)
- Grid: direction-aware horizontal slide (`mode="popLayout"`) inside `overflow-hidden`
- Direction `+1` next / `-1` prev; flipped for RTL
- Duration ~320ms grid / ~240ms title; reduced motion → near-instant

## Files

- `src/features/admin/lib/calendarMonthMotion.ts` (+ tests)
- `src/features/admin/components/timeline/ReservationsTimeline.tsx`
