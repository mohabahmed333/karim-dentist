# Site → chat showreel scene

**Date:** 2026-09-09  
**Status:** Approved design (awaiting implementation plan)  
**Slide id / productScene:** `site-to-chat`  
**Runtime:** ~22–25s (one continuous product scene)

## Goal

Show a customer booking from the **public website** (with entered form data), then hand off to the **admin dashboard / schedule**, open the **WhatsApp float**, and **confirm** the reservation in chat.

## Story beats

| Beat | Approx. time | On screen |
|------|----------------|-----------|
| Fill | 0–8s | Public booking form: name, phone, service, preferred slot |
| Submit | 8–10s | Offline success (“request received”) — no API write |
| Cut | 10–12s | Hard cut to admin dashboard; matching visit on schedule |
| Open WA | 12–16s | Open WhatsApp float on that patient’s thread |
| Confirm | 16–22s | Staff sends confirmation for the booked slot |
| Hold | 22–25s | Confirmation visible in thread |

**Tags (slide chrome):** Book · Dashboard · Confirm

## Shared fixture

One patient identity reused across phases so the handoff is obvious, e.g.:

- Name: Sara Hassan (or existing showreel patient already used in WhatsApp fixtures)
- Phone: match demo inbox conversation
- Service: teeth whitening (or existing booking fixture service)
- Slot: Tue 10:30 (align with WhatsApp confirm copy already in reel)

Form values, schedule row, and WhatsApp inbound summary must use the **same** name/service/slot.

## Architecture

### Approach

Phased product scene inside `/showreel/demo?mode=product&scene=site-to-chat`:

1. Phase `public` — real public site booking UI (or a focused booking embed using real `BookingForm` / contact section), scripted cursor fill + submit with `localOnly` / demo success path.
2. Phase `admin` — existing `ShowreelAdminSceneFrame` + `ClinicDashboard` + demo inbox, WhatsApp float forced/opened, confirm message.

Hard cut between phases (unmount public → mount admin). No dual-iframe crossfade.

### New / touched surfaces

- `showreelProductRoute.ts` — add `site-to-chat`
- `ShowreelProductDemo.tsx` — route to new scene component
- `SiteToChatScene.tsx` (new) — phase state + timing
- `showreelCursorTimeline.ts` — `SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS` (or split public/admin step lists keyed by phase)
- Fixtures — booking form script + inbox message that mirrors submitted data; schedule reservation row for same patient
- `showreelSlideData.ts` — insert feature slide (~22–25s); keep existing `site` / `dashboard` / `whatsapp` slides unless product owner asks to replace
- Tests — route parse, cursor step ids, slide duration budget still in range

### Offline / safety

- No Kapso sends, no `/api/v1/booking` writes, no Supabase mutations from the demo path
- Booking submit uses demo/local success (same pattern as clinical `localOnly` / WhatsApp demo send)
- WhatsApp confirm is local demo message append (existing demo inbox clone pattern)

## Cursor / events

- Public phase: target booking fields + submit via `data-showreel-action` hooks (add if missing on `BookingForm`)
- Admin phase: open WhatsApp (FAB or messages widget) → focus thread → send confirmation (composer or quick confirm control)
- Optional dispatch events (`showreel-site-to-chat`) for phase advance and confirm if DOM click alone is unreliable

## Out of scope

- Alternate slots / interactive quick-reply book card
- Clinical workspace
- Customize CMS
- Real persistence
- Dual-iframe cinematic crossfade
- Closing chat (unless spare time after confirm hold)

## Success criteria

- On camera: form data entered → submit → dashboard shows same patient/slot → WhatsApp opens → confirmation message appears
- Deterministic offline replay; tests green for route + timeline ids
- Total scene duration 22–25s; full reel still suitable for LinkedIn (~2 min class)

## Non-goals for v1

Replacing the existing standalone WhatsApp “Workspace / Slots / Confirm” scene; this beat is the **website booking → staff confirm** story.
