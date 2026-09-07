# Admin Usage — Kapso WhatsApp messages

Date: 2026-09-07

## Goal

On `/admin/usage`, add a fifth used/remaining donut for **Kapso WhatsApp messages this UTC calendar month** vs the Free plan limit of **2,000**.

## Approach

1. **Used** — count rows in `whatsapp_messages` with `wa_timestamp >=` UTC month start. Inbound and outbound both count. Empty inbox is 0, not unavailable.
2. **Quota** — 2,000 (Kapso Free). No Kapso usage API.
3. **Unavailable** — only when the count query fails.
4. **UI** — existing `UsageMetricCard`; grid stays 4-wide and the fifth card wraps. Free badge unchanged.

## Out of scope

- Inbound/outbound split
- Kapso credits or media storage
- Paginated Kapso message-list API
- Blocking sends at quota
