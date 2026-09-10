# Showreel feature title cards — design

Date: 2026-09-09  
Status: approved (user: “goo” / option A)

## Problem

Feature slides use compact copy that hides title/body and only shows giant keyword tags (`Edit` / `Preview` / `Devices`). On full-bleed demos those tags sit on top of the UI and read as a broken overlay.

## Decision

Before each feature demo, show a short full-screen title card (~1.8s) with existing `kicker` + `title` + `body`, then fade to the device UI. Do not render keyword tags on feature slides.

## Behavior

1. Feature slide becomes active + playing → title card visible; device stage hidden or covered.
2. After `SHOWREEL_TITLE_CARD_MS` (1800) → card fades out; demo visible; scroll / product activate / customize scripts may start.
3. Card duration is carved from the slide’s existing `durationMs` (no deck length change required).
4. Intro / outro copy slides unchanged.
5. Tags remain on slide data for now but are not rendered on feature slides.

## Non-goals

- Separate interstitial slides in the deck
- Shared deck-level overlay component across all kinds
- Rewriting slide copy content (use current strings)
