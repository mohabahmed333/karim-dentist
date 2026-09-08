# Admin home: KPI row, more charts, WhatsApp messages

Date: 2026-09-08  
Status: approved (implement without plan)

## Goals

1. KPI cards on **one horizontal line** with overflow scroll (snap).
2. **More charts** on the overview dashboard from reservation data.
3. **Last messages** panel from WhatsApp inbox (open Front desk).

## KPIs

- Keep existing four KPIs and card chrome (no ⋮ menu).
- Single row: `flex` + `overflow-x-auto`, fixed `min-w` per card, scroll-snap.
- Optional edge fade; chevrons only if needed for discoverability.

## Charts

Keep week visits + booking mix. Add (client-rendered from extended `ReservationStats`):

| Chart | Data |
|-------|------|
| Status mix | pending / confirmed / cancelled / completed counts |
| Busy hours | bookings by hour (clinic-relevant hours) |
| 30-day trend | daily counts for last 30 days |

Layout: 2×2 for week | mix | status | hours; trend full-width below. No new chart library — match existing CSS bar style.

## Messages

- New `DashboardMessagesPanel`: name, preview, relative time, unread badge.
- ~6–8 latest open conversations via `listConversations({ status: "open", sort: "newest" })` on the overview RSC page.
- CTA / row click → `/admin/support` (Front desk).
- Empty state when none.
- Panels grid becomes 2×2: Bookings | Recent · Schedule | Messages.

## Out of scope

- Chart library, realtime on home messages, KPI count expansion, separate analytics page.
