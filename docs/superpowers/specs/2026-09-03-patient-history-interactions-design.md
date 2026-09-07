# Patient history dashboard — interaction engine

Date: 2026-09-03

## Scope

Dynamic SVG anchoring, timeline scrubber drag/zoom, hover/focus cascades, condition accordion, and CBCT modal for the admin Overview tab.

## 1. Dynamic positioning (`useBezierConnector`)

- Wraps the stage container with `ResizeObserver`, `window.resize`, and capture-phase `scroll` listeners.
- Measures every `[data-anchor]` node via `getBoundingClientRect()` relative to the stage origin.
- Emits precomputed connector paths using midpoint control points: `midX = (x1 + x2) / 2`.
- Re-runs when condition expand/collapse changes layout (`tick = conditionId + expandedConditionId`).

## 2. Timeline scrubber

**Math** (`scrubber-math.ts`):

- Axis: 2022 (left) → 2014 (right); `pixelToYear(x, width)`.
- Drag select: `rangeFromPixels(startPx, endPx, width, ticks)`.
- Snap: within 10px of labeled visit ticks (`07.10`, `12.10`, `19.10`).
- Zoom index maps to scales `[1, 1.5, 2, 4]`; tick clustering uses scale thresholds (<1.75 year, <3 month, else day).

**Pointer events** (`useTimelineDrag`):

- Track `pointerdown` → rubber-band year range.
- Yellow window `pointerdown` → move range preserving width.
- `[-] / [+]` step zoom index (shown as `1x … 4x`).

## 3. Interaction cascade (`useDashboardInteractions`)

| State field | Purpose |
| --- | --- |
| `selectedToothId` | Universal tooth filter (session) |
| `activeConditionId` | Selected stream node |
| `expandedConditionId` | Accordion open node; hides graph cards + fades beziers when null |
| `timelineBounds` | `{ startYear, endYear }` |
| `zoomIndex` | 0–3 → 1x–4x |
| `hoveredEntity` | `{ type: TOOTH \| NODE \| CARD, id }` |
| `cbctOpen` | Full-screen CBCT modal |

**Rules:**

- Hover tooth/badge → highlight matching condition pill + fan ray.
- Click tooth → filter stream, expand primary condition (endo preferred), scroll arch into view.
- Click condition pill → select; second click on active pill collapses accordion.
- Collapsed condition → graph cards `opacity-0`, bezier paths fade via CSS transition.
- CBCT card click → modal with pan (pointer drag) + zoom buttons.

## 4. API alignment

Existing routes (patient key = `{id}`):

- `GET /api/v1/patients/{id}/dental-chart` — odontogram matrix
- `GET /api/v1/patients/{id}/conditions/{nodeId}/node-graph` — connected cards
- `GET /api/v1/patients/{id}/timeline?start=&end=` — filtered bento widgets

Client v1 assembles chart locally via `useDentalChartSession`; API routes available for future React Query hydration.

## 5. Files

- `useBezierConnector.ts`, `useTimelineDrag.ts`, `useDashboardInteractions.ts`
- `scrubber-math.ts`, `scrubber-math.test.ts`
- Updated: `TimelineScrubber`, `OverviewStage`, `GraphCards`, `ConditionList`, `CbctViewerModal`
