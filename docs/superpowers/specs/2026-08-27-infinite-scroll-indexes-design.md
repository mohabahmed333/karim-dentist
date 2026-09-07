# Infinite scroll for case studies & featured

Date: 2026-08-27

## Goal

On `/case-studies`, `/featured`, and homepage case-studies / featured carousels: show the first 6 items, then append the next 6 when the user scrolls near the end.

## Approach

Client-side batching over the already-fetched portfolio list (no new API). Shared helpers + hook; IntersectionObserver for vertical grids; Embla `scroll` near-end for carousels.

## Behavior

- Page size: 6
- Customize `previewMode`: show all items (editors must see every card)
- Sentinel / near-end only while `hasMore`
- Carousel re-inits after new slides append

## Out of scope

- Server pagination / URL pages
- Seamless loop marquee
- Services / other sections

## Tests

- `infiniteBatch.test.ts` — page size, slice, hasMore, pagesNeeded
- `carouselNearEnd.test.ts` — near-end threshold + fire lock
- `infiniteScroll.feature.test.ts` — index, carousel, preview, list-growth scenarios
- `detailPageLinks.feature.test.ts` — slug linking + preview static cards
- Run all: `bash scripts/test.sh` (or `npm test` / `yarn test` when registry env is set)
