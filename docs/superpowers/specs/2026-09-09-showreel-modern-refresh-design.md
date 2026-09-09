# Showreel modern refresh — design

Date: 2026-09-09
Scope: `/showreel` deck visual refresh (refined light) + scripted cursor rebuild.

## Goal

Two independent halves that share one token layer:

1. Modernize the `/showreel` presentation surface without changing its light clinic
   palette or slide structure.
2. Replace the scripted demo cursor with a better-looking pointer that also fixes
   four real synchronization bugs in how it moves and clicks.

Slide content, timings, and the five `SHOWREEL_*_CURSOR_STEPS` timelines are
**out of scope** and must not change.

## Part 1 — Screen refresh (refined light)

### 1.1 Token layer

`showreel.css` hardcodes the same hexes ~40 times. Introduce custom properties
scoped to `.showreel-page` and reference them everywhere:

| Token | Value | Replaces |
| --- | --- | --- |
| `--sr-bg` | `#fbfbfc` | `#f7f8f8` page background |
| `--sr-bg-deep` | `#f1f3f7` | (new, gradient stop) |
| `--sr-ink` | `#0f2744` | headline / body ink |
| `--sr-ink-soft` | `#6b7280` | kicker / lede / muted |
| `--sr-accent` | `#5e6ad2` | violet accent |
| `--sr-gold` | `#c9a962` | gold accent |
| `--sr-line` | `#e6e8ec` | hairline borders |
| `--sr-shadow-contact` | `0 1px 2px rgba(15,39,68,0.06)` | (new) |
| `--sr-shadow-ambient` | `0 18px 44px -18px rgba(15,39,68,0.28)` | flat drop-shadow |

Tokens are declared on `.showreel-page` so the `/showreel/demo` embed route
(which renders product UI, not the deck) is unaffected.

### 1.2 Layered background

`.showreel-page` background becomes a base `linear-gradient(180deg, var(--sr-bg),
var(--sr-bg-deep))` plus two pseudo layers:

- `::before` — radial wash: `--sr-accent` at 4% top-left, `--sr-gold` at 3%
  bottom-right.
- `::after` — fine grain from an inline SVG `feTurbulence` data URI at ~3%
  opacity, composited with a soft radial vignette.

Both layers are `position: absolute; inset: 0; pointer-events: none; z-index: 0`.
`.showreel-deck` already sets `z-index: 1`, so it stays above them.

### 1.3 Device chrome

- `.showreel-device-monitor` — 16px radius, `linear-gradient(180deg, #fff,
  #fafbfc)` bezel, `1px solid rgba(15,39,68,0.08)` border, box-shadow
  `var(--sr-shadow-contact), var(--sr-shadow-ambient), inset 0 0 0 1px
  rgba(255,255,255,0.9)`.
- `.showreel-device-screen` — `inset 0 0 0 1px rgba(15,39,68,0.07)` ring so the
  embedded UI does not butt against the bezel.
- `.showreel-device-phone` — 26px radius, `linear-gradient(180deg, #1b2230,
  #0b0f16)` bezel with an inner highlight ring.
- Remove `filter: drop-shadow(...)` from `.showreel-device--desktop` and
  `.showreel-device--mobile`. A filter pass over a live iframe re-rasterizes every
  frame during the GSAP slide transitions; box-shadow does not.

Device silhouettes and all existing sizing/container-query rules are unchanged.

### 1.4 Typography

- `.showreel-kicker` — `::before` accent rule (2rem x 1px, `--sr-accent`),
  `letter-spacing: 0.18em`, `font-size: 0.66rem`. The rule is suppressed on
  center-aligned scenes (`--hero`, `--outro`, `.showreel-feature-title-card`)
  where a leading rule would read as an orphan.
- `.showreel-headline` — `letter-spacing: -0.035em`, `text-wrap: balance`.
- `.showreel-lede` — `max-width: 34rem`, `line-height: 1.65`, `text-wrap: pretty`.
- `.showreel-intro-line`, `.showreel-outro-name` — `text-wrap: balance`.

### 1.5 Progress rail

New component `ShowreelProgressRail.tsx`.

```
Props: { slides: ShowreelSlide[]; index: number; playing: boolean }
```

- Fixed bottom-center, `z-index: 25`, `pointer-events: none`, `aria-hidden`.
- One tick per slide. Each tick's `flex-grow` is set from that slide's
  `durationMs`, so rail geometry reflects real pacing.
- Ticks before `index` are filled. The tick at `index` fills via a CSS animation
  whose `animation-duration` is that slide's `durationMs`, keyed on slide id so
  it restarts per slide. Ticks after `index` are empty.
- When `playing` is false the active fill is paused.
- Under `prefers-reduced-motion: reduce` the fill animation is dropped; the
  active tick renders fully filled.

Wired in `ShowreelDeck`, which already destructures `index`/`total` from
`useShowreelDeck`. No changes to `useShowreelDeck` itself.

## Part 2 — Cursor rebuild

### 2.1 Visual — `ShowreelCursorOverlay.tsx` (rewritten)

Soft glass arrow: rounded pointer path, white outline, drop shadow, over a soft
violet halo. Press state adds a ripple ring and scales the arrow down slightly.

Motion moves off `animate={{ left, top }}` (layout properties, not composited)
onto framer-motion `useSpring` motion values driving `translate3d`, plus a small
rotation tilt derived from travel direction.

```
Props: { x: number; y: number; pressing: boolean; visible: boolean }
```

### 2.2 Behavior — `useShowreelCursorScript.ts`

The hook moves out of `useShowreelDashboardCursor.ts` into its own file.
`useShowreelDashboardCursor.ts` keeps re-exporting `useShowreelCursorScript`,
`useShowreelDashboardCursor`, and `useShowreelBlockAdminNav` so its three call
sites (`ShowreelAdminSceneFrame`, `DashboardScene`, `SiteToChatScene`) and the
existing tests are untouched.

Four fixes:

**Live target tracking.** A resolved step's element is held in a ref as the
current follow target. A `requestAnimationFrame` loop reads its live
`getBoundingClientRect()` center each frame and pushes it into the motion values,
until the next step replaces the target. Fixes the drift where
`scrollIntoView({ behavior: "smooth" })` is called and the center is read on the
same tick, sending the cursor to pre-scroll coordinates it never corrects.

**Wait + retry.** `resolveTarget` polls every ~60ms up to `timeoutMs` before
dropping a step. Default 1200ms; `waitForSelector` steps get 2500ms. Today a
single probe at `step.at` silently drops the step if the drawer or panel has not
mounted, desyncing the rest of the timeline.

**Click on arrival.** After a target is set, compare the spring's current value
against the target. On arrival (within 4px, or a 900ms fallback) set
`pressing: true`, fire the click 120ms later via the existing
`fireShowreelClick`, release at 260ms. Replaces the fixed 320ms timer that can
fire mid-flight.

**Human motion.** Spring stiffness/damping scale with move distance; a sine arc
bows the path during flight; the cursor fades and scales in at scene start rather
than popping in at (72, 96), and fades out at scene end. Under reduced motion it
snaps to target with no arc and no ripple.

### 2.3 Pure helpers (testable)

New `showreelCursorMotion.ts`:

- `springConfigFor(distance) -> { stiffness, damping }`
- `hasArrived(current, target, tolerance) -> boolean`
- `arcOffset(progress, distance) -> number`
- `tiltFor(dx, dy) -> number` (degrees, clamped)

New `pollForTarget(resolve, { timeoutMs, intervalMs })` — resolves as soon as
`resolve()` returns an element, rejects/returns null at timeout.

## Testing

TDD: helper tests written before implementation.

- `showreelCursorMotion.test.ts` — the four pure functions, including boundary
  cases (zero distance, tolerance edge, tilt clamping).
- `pollForTarget.test.ts` — fake clock: resolves immediately, resolves late,
  times out.
- Existing `buildShowreelDashboardProps.test.ts`, `fireShowreelClick.test.ts`,
  `showreelSlides.test.ts`, `showreelTitleCard.test.ts` must stay green.

CSS changes are verified visually against `/showreel`; no snapshot tests exist
for the deck and none are added.

## Out of scope

- Slide copy, ordering, and `durationMs` values.
- The five `SHOWREEL_*_CURSOR_STEPS` timelines.
- The `/showreel/demo` embed route and the admin product scenes it renders.
- Dark mode for the deck.
