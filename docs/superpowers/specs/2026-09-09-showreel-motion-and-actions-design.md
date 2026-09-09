# Showreel motion + action legibility — design

Date: 2026-09-09
Scope: `/showreel` scripted demo choreography and motion craft.
Builds on: `2026-09-09-showreel-modern-refresh-design.md` (implemented).

## Goal

The reel drives a live app through iframes, but the demos read as inert and
unmotivated. Three causes, addressed in three stages:

1. **Nothing reacts to the cursor.** The pointer glides over an app that
   ignores it, and clicks produce no physical feedback.
2. **A third of the "actions" are teleports.** 23 of 73 steps change the UI via
   a dispatched event with no visible cause; 22 more are pure waits where the
   cursor parks motionless.
3. **Nothing says what is happening.** 55 actions fire with no narration, some
   1.3s apart.

Reference: Dribbble shot 23643275 ("LOGI Mouse — Intcraction / Responsive",
Amirali Nabatian for Ace Agency). The shot itself could not be viewed — Dribbble
blocks fetching — so Part A is an interpretation of high-craft motion applied to
this codebase's constraints, not a reproduction. The user explicitly excluded
the shot's responsive-breakpoint morphing.

## Staging

Each stage is independently shippable and independently reviewable.

| Stage | Content | Risk |
| --- | --- | --- |
| 1 | Motion package (Part A) | Low — additive, no timeline changes |
| 2 | Real actions + typing + drift (Part B) | Medium — changes step semantics |
| 3 | Six features + captions + durations (Part C) | Medium — touches slide data |

---

## Part A — Motion package (Stage 1)

### A1. Cursor-reactive elements

As the cursor aims at a target, the target receives synthetic
`pointerover` → `pointerenter` → `mousemove` and a `.showreel-hover` class.
On retarget, the previous element receives `pointerout` → `pointerleave` and
loses the class.

**Constraint that shapes this design:** CSS `:hover` cannot be triggered by
synthetic events — user agents reserve it for real input. The admin UI styles
hover with Tailwind `hover:` utilities, i.e. CSS. Dispatched events therefore
reach only JS hover handlers; the visible response must come from the class.
`.showreel-hover` is consequently a *generic* lift — `translateY(-1px)`, a
raised shadow, and a slight brightness lift — not a per-component replica.

Class application and removal are owned by the same ref that owns the follow
target, so scene teardown cannot strand a class on a live admin element.

### A2. Magnetic settle

Within `MAGNET_RADIUS` (64px) of the target, spring stiffness ramps up by a
factor rising to `MAGNET_GAIN` (1.6) at zero distance. The cursor snaps in and
settles rather than merely decelerating.

New pure helper: `magnetScale(distance, radius, gain) -> number`, multiplied
into the stiffness returned by the existing `springConfigFor`.

### A3. Press consequence

On press, the target element gets `.showreel-press` (`scale(0.97)`, 140ms).
Today only the cursor animates on press; the UI itself does not move, which is
the main reason clicks read as synthetic. Removed on release, and on teardown.

### A4. Cinematic scene transitions

`useShowreelSlideTransition` currently cross-fades: `staggerExit` tweens
opacity + `y: -12`, `staggerEnter` tweens opacity + `y` from 18/16/10.

Replace with a depth push on the scene layer itself:

- Exit: `scale 1 -> 0.96`, `opacity 1 -> 0`, `y 0 -> -18`, 0.32s `power2.in`.
- Enter: `scale 1.04 -> 1`, `opacity 0 -> 1`, `y 20 -> 0`, 0.5s `power3.out`.

The existing per-element stagger is kept and nested inside the enter, so copy
still reveals in sequence. Screens read as one continuous flow rather than
separate cards.

### A5. Device reveal

`.showreel-anim-device` enters at `scale 0.965` and settles to `1` over 0.55s
on `power3.out`, alongside its existing opacity/`y` tween.

### A6. Reduced motion

Under `prefers-reduced-motion: reduce`: no magnet, no press scale, no depth
push, no device scale. Hover class still applies (it is state, not motion).

---

## Part B — Real actions (Stage 2)

### B1. Teleports become caused

`runStep` currently dispatches **before** any cursor movement, which is
precisely why the UI appears to change on its own.

New rule: when a step carries both a `selector` and a `dispatch`, the dispatch
fires **on press**, inside the click path, after the cursor has arrived.
Dispatch-only steps (no selector) keep firing at step start.

15 of the 23 dispatch steps already carry a selector and convert by gaining
`click: true`. The remaining 8 either gain a selector where one is meaningful
or stay as ambient state changes.

### B2. Visible typing

New optional step field `typeMs?: number`. When set, and when the step's
`dispatch.detail` carries a string `text`, the hook re-fires that dispatch with
progressively longer text across `typeMs`.

This needs **no component changes**: the handler at
`AiTreatmentChatPanel.tsx:188` does `setInput(detail.text)`, a plain state set,
so repeated dispatches with growing text render as typing. The WhatsApp
`compose-message` handler follows the same pattern and must be confirmed before
implementation.

New pure helper: `typewriterFrames(text, { cps, maxFrames }) -> {at, text}[]`
at ~40 chars/s, frame-capped so a long note cannot schedule hundreds of timers.

### B3. Dead-wait drift

New optional step field `anticipate?: string` — a selector the cursor drifts
toward while a `waitForSelector` step is pending, so the pause reads as
anticipation rather than a stall. Absent, behaviour is unchanged.

---

## Part C — Legibility and coverage (Stage 3)

### C1. Beats and captions

New optional step field `beat?: string` on the step that *starts* a beat. Steps
without one inherit the current caption. Beat boundaries are therefore always
real step boundaries and cannot drift out of sync with a parallel array.

New component `ShowreelActionCaption.tsx` — lower-third, crossfading on beat
change, rendered inside the demo iframe alongside the cursor, above the device
and below the cursor.

24 beats, ~4-6 per screen, holding 3-5s each. Labels state intent, not
mechanics. Two deliberately carry the human-review-at-every-AI-step message
that the intro slide promises but the demos never state:
"Clinician reviews before anything is saved" and
"Staff confirms — nothing auto-books".

### C2. Focus ring

`.showreel-action-focus` applied to the resolved target ~600ms before press,
removed after release. Shares the visual language of the existing
`.showreel-dash-focus` rule.

### C3. Six unscripted features

Instrumented in the product, never demonstrated: `whatsapp-ask-ai`,
`odontogram-tooth`, `clinical-imaging`, `clinic-visit-context`,
`clinic-reservation-done`, `clinic-assist-chat`.

`odontogram-tooth` overlaps B1: the clinical scene currently *dispatches*
`select-tooth`, so that teleport becomes a genuine click on tooth #16.

Each must be verified to actually render in its demo scene before a step is
authored against it; any that does not render is dropped and reported, not
faked.

### C4. Durations

Slide `durationMs` in `showreelSlideData.ts` is extended to fit. Total reel goes
from ~2m35s to ~3m15s. Approved explicitly by the user.

| Screen | Now | After |
| --- | --- | --- |
| Dashboard | 13s | ~15s |
| Smart UX | 18s | ~22s |
| Clinical AI | 17.2s | ~24s |
| WhatsApp | 22s | ~30s |
| Site to chat | 21.5s | ~26s |
| AI booking | 15.5s | ~17s |

Each screen's slide duration must exceed its last step's `at` plus a tail; a
test enforces this so a timeline can never outrun its slide.

## Testing

Pure, DOM-free helpers, on the existing `node:test` runner:

- `magnetScale(distance, radius, gain)` — at/beyond radius returns 1, at zero
  returns `gain`, monotonic between.
- `typewriterFrames(text, opts)` — final frame equals the full text, frames are
  strictly increasing prefixes, respects `maxFrames`, handles empty string.
- `beatLabelAt(steps, timeMs)` — no label before the first beat, holds through
  beat-less steps, never regresses.
- Timeline integrity — every `beat` label non-empty; every slide's `durationMs`
  exceeds its timeline's last `at`; every selector referenced by a step exists
  in the union of `data-showreel-action` values defined in components.

The last of those is the highest-value test: it is what would have caught the
six unscripted hooks, and it prevents a typo'd selector from silently becoming
a dead step.

Motion (Parts A1-A5) has no DOM test runner available and is verified visually
against a running dev server.

## Out of scope

- Responsive breakpoint morphing (explicitly excluded by the user).
- Sound design (the reel is screen-recorded; LinkedIn autoplays muted).
- 3D / `@react-three/fiber` hero treatments.
- Slide copy and ordering.
