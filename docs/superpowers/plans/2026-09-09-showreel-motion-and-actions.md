# Showreel Motion + Action Legibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the showreel's scripted demos feel caused, reactive and readable — the UI responds to the cursor, every action has a visible cause, and each beat is narrated.

**Architecture:** Three independently shippable stages. Stage 1 is additive motion (no timeline changes). Stage 2 changes step semantics in the hook plus timeline data. Stage 3 adds captions, six new features, and extends slide durations.

**Tech Stack:** React 19, framer-motion 11 (MotionValues), GSAP 3 (slide transitions), plain CSS, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-09-showreel-motion-and-actions-design.md`

## Global Constraints

- Test runner: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test <file>`. **No DOM.** Only `*.test.ts` is collected. Never write `.test.tsx`.
- Test imports use explicit `.ts` extensions.
- `yarn` is broken here (`.npmrc` references unset `${GITHUB_TOKEN}`). Use `npx` or `bash scripts/test.sh`.
- 8 pre-existing suite failures (7 import `vitest`, 1 imports a missing source) and 4 pre-existing `tsc` errors in uncommitted admin files are NOT in scope. Baseline: showreel tests green, 0 showreel type errors, 0 lint errors in showreel files touched.
- **No commits** — the user works uncommitted on `main` with ~60 unrelated modified files. Never `git add`.
- CSS `:hover` cannot be triggered by synthetic events. Any visible hover response must come from a class, not from dispatched pointer events.
- Every class written onto a live admin element must be removed on scene teardown. A stranded `.showreel-hover` on real UI is a defect.
- Do not change slide copy or ordering.

---

# STAGE 1 — Motion package

### Task 1: `magnetScale` helper

**Files:**
- Modify: `src/features/portfolio/showreel/product-scenes/showreelCursorMotion.ts`
- Test: `src/features/portfolio/showreel/product-scenes/showreelCursorMotion.test.ts`

**Interfaces:**
- Produces: `magnetScale(distance: number, radius?: number, gain?: number): number`

- [ ] **Step 1: Add failing tests**

Append to `showreelCursorMotion.test.ts` (and add `magnetScale` to the import):

```ts
describe("magnetScale", () => {
  it("does not pull outside the radius", () => {
    assert.equal(magnetScale(200), 1);
    assert.equal(magnetScale(64, 64), 1);
  });

  it("pulls hardest at the target", () => {
    assert.equal(magnetScale(0, 64, 1.6), 1.6);
  });

  it("ramps monotonically toward the target", () => {
    const far = magnetScale(48, 64, 1.6);
    const near = magnetScale(16, 64, 1.6);
    assert.ok(near > far);
    assert.ok(far > 1);
  });

  it("treats negative distance as zero", () => {
    assert.equal(magnetScale(-5, 64, 1.6), 1.6);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/product-scenes/showreelCursorMotion.test.ts
```

Expected: FAIL — `magnetScale is not a function`.

- [ ] **Step 3: Implement**

Append to `showreelCursorMotion.ts`:

```ts
const MAGNET_RADIUS = 64;
const MAGNET_GAIN = 1.6;

/** Stiffness multiplier that snaps the pointer in over the last few px. */
export function magnetScale(
  distance: number,
  radius = MAGNET_RADIUS,
  gain = MAGNET_GAIN,
): number {
  const d = Math.max(distance, 0);
  if (d >= radius) return 1;
  return 1 + (gain - 1) * (1 - d / radius);
}
```

- [ ] **Step 4: Run to verify pass**

Expected: PASS, 4 new tests.

---

### Task 2: Hover + press classes

**Files:**
- Modify: `src/features/portfolio/showreel/product-scenes/useShowreelCursorScript.ts`
- Modify: `src/features/portfolio/showreel/showreel.css`

**Interfaces:**
- Consumes: existing `aim()` and `clickWhenThere()` in the hook.
- Produces: `.showreel-hover` and `.showreel-press` classes applied to live targets.

- [ ] **Step 1: Add the CSS**

Append to `showreel.css`:

```css
/* Scripted-cursor reactions on live product UI.
   CSS :hover cannot fire from synthetic events, so the lift is a class. */
.showreel-hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
  box-shadow: 0 6px 18px -6px rgba(15, 39, 68, 0.28);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.showreel-press {
  transform: scale(0.97);
  transition: transform 140ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .showreel-hover,
  .showreel-press {
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Add hover ownership to the hook**

Inside `useShowreelCursorScript`, add a ref beside `followRef`:

```ts
  const hoverRef = useRef<Element | null>(null);
```

Add these helpers inside the scheduler effect, above `aim`:

```ts
    const HOVER_IN = ["pointerover", "pointerenter", "mousemove"] as const;
    const HOVER_OUT = ["pointerout", "pointerleave"] as const;

    /** Move the synthetic hover to `el` (or clear it). Dispatched events reach
        JS handlers; the visible lift comes from the class. */
    const setHover = (el: Element | null) => {
      const previous = hoverRef.current;
      if (previous === el) return;
      if (previous) {
        previous.classList.remove("showreel-hover");
        for (const type of HOVER_OUT) {
          previous.dispatchEvent(
            new PointerEvent(type, { bubbles: false, cancelable: true }),
          );
        }
      }
      hoverRef.current = el;
      if (el) {
        el.classList.add("showreel-hover");
        for (const type of HOVER_IN) {
          el.dispatchEvent(
            new PointerEvent(type, { bubbles: true, cancelable: true }),
          );
        }
      }
    };
```

In `aim`, after `followRef.current = follow;` add:

```ts
      setHover(follow);
```

In `clickWhenThere`, wrap the press so the element moves too:

```ts
    const clickWhenThere = (selector: string, el: Element) => {
      aim(centerOf(el), el, () => {
        if (cancelled) return;
        setPressing(true);
        el.classList.add("showreel-press");
        after(PRESS_DELAY_MS, () => {
          if (cancelled) return;
          fireClick(resolveTarget(getRoot(), selector) ?? el);
        });
        after(PRESS_RELEASE_MS, () => {
          el.classList.remove("showreel-press");
          if (cancelled) return;
          setPressing(false);
        });
      });
    };
```

Note the release removes the class **before** the `cancelled` guard, so a
teardown mid-press cannot strand it.

- [ ] **Step 3: Clean up on teardown**

In the scheduler effect's cleanup, before the existing ref resets:

```ts
      hoverRef.current?.classList.remove("showreel-hover");
      hoverRef.current = null;
      document
        .querySelectorAll(".showreel-hover, .showreel-press")
        .forEach((el) =>
          el.classList.remove("showreel-hover", "showreel-press"),
        );
```

The sweep is belt-and-braces: `fireClick` can re-render a subtree and swap the
element identity out from under `hoverRef`.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit 2>&1 | grep -ci showreel   # expect 0
npx eslint src/features/portfolio/showreel/product-scenes/useShowreelCursorScript.ts
```

Expected: 0 type errors, clean lint.

---

### Task 3: Magnetic settle

**Files:**
- Modify: `src/features/portfolio/showreel/product-scenes/useShowreelCursorScript.ts`

**Interfaces:**
- Consumes: `magnetScale` from Task 1.

- [ ] **Step 1: Import and apply**

Add `magnetScale` to the existing import from `./showreelCursorMotion`.

In the rAF loop, replace the spring integration block:

```ts
        const { stiffness, damping } = configRef.current;
        const px = x.get();
        const py = y.get();
        velocity.x += (stiffness * (target.x - px) - damping * velocity.x) * dt;
        velocity.y += (stiffness * (target.y - py) - damping * velocity.y) * dt;
```

with:

```ts
        const { stiffness, damping } = configRef.current;
        const px = x.get();
        const py = y.get();
        // Snap in over the last few px instead of merely decelerating.
        const pull = magnetScale(Math.hypot(target.x - px, target.y - py));
        const k = stiffness * pull;
        velocity.x += (k * (target.x - px) - damping * velocity.x) * dt;
        velocity.y += (k * (target.y - py) - damping * velocity.y) * dt;
```

Stability check: worst case is `k = 420 * 1.6 = 672`, giving `2/sqrt(672)` =
77ms, still well above the 33ms `MAX_FRAME_S` clamp. Safe.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep -ci showreel   # expect 0
bash scripts/test.sh 2>&1 | grep -E "^ℹ (pass|fail)"
```

---

### Task 4: Cinematic transitions + device reveal

**Files:**
- Modify: `src/features/portfolio/showreel/useShowreelSlideTransition.ts`

- [ ] **Step 1: Depth push on enter**

In `staggerEnter`, add a scene-level tween as the first entry, before the
existing element staggers:

```ts
function staggerEnter(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  tl.fromTo(
    root,
    { opacity: 0, scale: 1.04, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out" },
    0,
  );
```

Keep every existing `fromToIf` call unchanged after it.

- [ ] **Step 2: Depth push on exit**

Replace the body of `staggerExit`:

```ts
function staggerExit(root: HTMLElement) {
  const tl = gsap.timeline({ defaults: { ease: "power2.in" } });
  const items = targets(
    root,
    ".showreel-anim-device, .showreel-anim-keyword, .showreel-intro-line, .showreel-outro-line, .showreel-anim-word, .showreel-anim-title, .showreel-anim-kicker, .showreel-intro-meta, .showreel-anim-body",
  );
  toIf(tl, items, { opacity: 0, y: -12, duration: 0.28, stagger: 0.02 }, 0);
  tl.to(root, { opacity: 0, scale: 0.96, y: -18, duration: 0.32 }, 0);
  return tl;
}
```

- [ ] **Step 3: Device scale-settle**

In `staggerEnter`, replace the devices tween:

```ts
  fromToIf(tl, devices, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }, 0.08);
```

with:

```ts
  fromToIf(
    tl,
    devices,
    { opacity: 0, y: 16, scale: 0.965 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.55,
      ease: "power3.out",
      stagger: 0.05,
    },
    0.08,
  );
```

- [ ] **Step 4: Confirm reduced motion still bypasses**

`useShowreelSlideTransition` already early-returns on `prefersReducedMotion()`
in both effects and calls `resetScene`. Verify `resetScene` clears the new
`scale`: it calls `gsap.set(scene, { opacity: 1, clearProps: "transform" })` —
`scale` is a transform, so it is cleared. No change needed.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit 2>&1 | grep -ci showreel
npx eslint src/features/portfolio/showreel/useShowreelSlideTransition.ts
bash scripts/test.sh 2>&1 | grep -E "^ℹ (pass|fail)"
```

Then load `/showreel` on the dev server and watch two slide handoffs: screens
should push in depth, not cross-fade, with no flash of a mis-scaled layer.

**STAGE 1 CHECKPOINT — stop and report before Stage 2.**

---

# STAGE 2 — Real actions

### Task 5: `typewriterFrames` helper

**Files:**
- Create: `src/features/portfolio/showreel/product-scenes/typewriterFrames.ts`
- Test: `src/features/portfolio/showreel/product-scenes/typewriterFrames.test.ts`

**Interfaces:**
- Produces: `typewriterFrames(text: string, opts?: { durationMs?: number; maxFrames?: number }): { at: number; text: string }[]`

Frames are evenly spaced across `durationMs`, capped at `maxFrames` (default 24)
so a 120-character note cannot schedule 120 timers. The final frame is always
the complete string at exactly `durationMs`.

- [ ] **Step 1: Failing tests** covering: final frame equals full text; frames
are strictly increasing prefixes of the text; `at` values are non-decreasing and
end at `durationMs`; `maxFrames` is respected; empty string yields a single
empty frame.

- [ ] **Step 2: Run, expect module-not-found.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect pass.**

### Task 6: Step semantics in the hook

**Files:**
- Modify: `src/features/portfolio/showreel/product-scenes/showreelCursorTimeline.ts` (type only)
- Modify: `src/features/portfolio/showreel/product-scenes/useShowreelCursorScript.ts`

Add to `ShowreelCursorStep`: `typeMs?: number`, `anticipate?: string`.

Three behaviour changes in `runStep`:

1. **Dispatch on press.** If a step has both `selector` and `dispatch`, do not
   dispatch at step start; pass the dispatch into `clickWhenThere` so it fires
   with the press. Dispatch-only steps are unchanged.
2. **Typing.** If `typeMs` is set and `dispatch.detail.text` is a string,
   schedule `typewriterFrames` re-dispatches instead of one dispatch.
3. **Anticipate.** On a `waitForSelector` step with `anticipate`, resolve the
   anticipate selector immediately and `aim` at it while the wait polls.

### Task 7: Timeline conversion

**Files:**
- Modify: `showreelCursorTimeline.ts`, `showreelSiteToChatTimeline.ts`

Add `click: true` to the 15 dispatch steps that already carry a selector; add
`typeMs` to the two compose steps; add `anticipate` to the wait steps that
currently park. **Before implementing, confirm the WhatsApp `compose-message`
handler sets state the same way `AiTreatmentChatPanel.tsx:188` does** — if it
appends rather than replaces, typing must be driven differently.

**STAGE 2 CHECKPOINT — stop and report before Stage 3.**

---

# STAGE 3 — Legibility and coverage

### Task 8: Beats and caption
`beatLabelAt(steps, timeMs)` helper (TDD) + `ShowreelActionCaption.tsx` + CSS,
rendered beside the cursor inside the demo iframe. 24 authored beat labels.

### Task 9: Focus ring
`.showreel-action-focus` applied ~600ms pre-press, removed after release, with
the same teardown sweep as Task 2.

### Task 10: Six unscripted features + integrity test
Script `whatsapp-ask-ai`, `odontogram-tooth`, `clinical-imaging`,
`clinic-visit-context`, `clinic-reservation-done`, `clinic-assist-chat`.
**Verify each renders in its demo scene first; drop and report any that does
not rather than authoring a dead step.**

Add the integrity test: every selector referenced by any step exists in the
union of `data-showreel-action` values defined in components, and every slide's
`durationMs` exceeds its timeline's last `at` plus a tail.

### Task 11: Durations
Extend `durationMs` in `showreelSlideData.ts` per the spec table. Total ~3m15s.

---

## Verification (all stages)

```bash
bash scripts/test.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npx tsc --noEmit 2>&1 | grep -ci showreel
npx eslint src/features/portfolio/showreel --ext .ts,.tsx
npx next build
```

Then walk `/showreel` and confirm: elements lift as the cursor arrives; clicked
elements visibly depress; slides push in depth; no `.showreel-hover` or
`.showreel-press` class survives a scene change (check in devtools).
