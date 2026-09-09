# Showreel Modern Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development (recommended) or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the `/showreel` deck (refined light) and rebuild the scripted demo cursor so it looks better and stops desyncing from the UI it is driving.

**Architecture:** Two independent halves. The cursor half extracts four pure helpers (spring config, arrival test, arc, tilt) plus a generic retry helper, then rewrites the hook around a `requestAnimationFrame` spring integrator writing to framer-motion `MotionValue`s — so live target tracking costs zero React re-renders inside `AdminShell`. The screen half is CSS-only except for one new progress-rail component.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, framer-motion 11, GSAP 3 (existing slide transitions), plain CSS in `showreel.css`, `node:test` for unit tests.

## Global Constraints

- Test runner is `node --experimental-strip-types --import ./scripts/test-loader.mjs --test <file>`. It has **no DOM**. Only `*.test.ts` files are collected (`scripts/test.sh` globs `src -name '*.test.ts'`). Never write a `.test.tsx`.
- Because there is no DOM in tests, every helper under test must be DOM-free with injectable timers. DOM access stays in hooks and components, which are not unit-tested.
- Test imports use explicit `.ts` extensions (e.g. `from "./fireShowreelClick.ts"`), matching `fireShowreelClick.test.ts`.
- Do not change slide copy, ordering, or `durationMs` in `showreelSlideData.ts`.
- Do not change the five `SHOWREEL_*_CURSOR_STEPS` arrays in `showreelCursorTimeline.ts`.
- Do not touch `/showreel/demo` route behavior or the admin product scenes it renders.
- Colors come from the token table in Task 5. After Task 5, no new hardcoded hex in `showreel.css`.
- Full suite must pass at every commit: `yarn test`.
- Repo currently has ~60 unrelated modified files on `main`. **Stage only the files each task names.** Never `git add -A`.

---

### Task 1: Cursor motion helpers

**Files:**
- Create: `src/features/portfolio/showreel/product-scenes/showreelCursorMotion.ts`
- Test: `src/features/portfolio/showreel/product-scenes/showreelCursorMotion.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type SpringConfig = { stiffness: number; damping: number }`
  - `type Point = { x: number; y: number }`
  - `springConfigFor(distance: number): SpringConfig`
  - `hasArrived(current: Point, target: Point, tolerance?: number): boolean`
  - `arcOffset(progress: number, distance: number): number`
  - `tiltFor(dx: number, dy: number): number`

- [ ] **Step 1: Write the failing test**

Create `showreelCursorMotion.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  arcOffset,
  hasArrived,
  springConfigFor,
  tiltFor,
} from "./showreelCursorMotion.ts";

describe("springConfigFor", () => {
  it("snaps on short hops and glides on long travels", () => {
    const short = springConfigFor(0);
    const long = springConfigFor(900);
    assert.equal(short.stiffness, 420);
    assert.equal(short.damping, 34);
    assert.equal(long.stiffness, 180);
    assert.equal(long.damping, 26);
  });

  it("interpolates monotonically between the ends", () => {
    const mid = springConfigFor(450);
    assert.ok(mid.stiffness < 420 && mid.stiffness > 180);
    assert.ok(mid.damping < 34 && mid.damping > 26);
  });

  it("clamps beyond the far end so huge jumps stay stable", () => {
    assert.deepEqual(springConfigFor(5000), springConfigFor(900));
  });

  it("treats negative distance as zero", () => {
    assert.deepEqual(springConfigFor(-10), springConfigFor(0));
  });
});

describe("hasArrived", () => {
  it("is true inside the tolerance radius", () => {
    assert.equal(hasArrived({ x: 100, y: 100 }, { x: 102, y: 101 }), true);
  });

  it("is false outside the tolerance radius", () => {
    assert.equal(hasArrived({ x: 100, y: 100 }, { x: 120, y: 100 }), false);
  });

  it("treats the tolerance edge as arrived", () => {
    assert.equal(hasArrived({ x: 0, y: 0 }, { x: 4, y: 0 }, 4), true);
  });
});

describe("arcOffset", () => {
  it("is zero at both ends of the flight", () => {
    assert.equal(arcOffset(0, 500), 0);
    assert.equal(arcOffset(1, 500), 0);
  });

  it("peaks at mid-flight", () => {
    const peak = arcOffset(0.5, 500);
    assert.ok(peak > arcOffset(0.25, 500));
    assert.ok(peak > arcOffset(0.75, 500));
  });

  it("caps the bow so long travels do not fly off screen", () => {
    assert.equal(arcOffset(0.5, 100000), 42);
  });

  it("does not bow a zero-distance move", () => {
    assert.equal(arcOffset(0.5, 0), 0);
  });
});

describe("tiltFor", () => {
  it("leans right when travelling right", () => {
    assert.equal(tiltFor(100, 0), 12);
  });

  it("leans left when travelling left", () => {
    assert.equal(tiltFor(-100, 0), -12);
  });

  it("stays upright when barely moving", () => {
    assert.equal(tiltFor(0.2, 0.2), 0);
  });

  it("stays upright on purely vertical travel", () => {
    assert.equal(tiltFor(0, 100), 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/product-scenes/showreelCursorMotion.test.ts
```

Expected: FAIL — `Cannot find module ... showreelCursorMotion.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `showreelCursorMotion.ts`:

```ts
export type SpringConfig = { stiffness: number; damping: number };
export type Point = { x: number; y: number };

/** Short hops snap into place; long travels glide. */
const NEAR: SpringConfig = { stiffness: 420, damping: 34 };
const FAR: SpringConfig = { stiffness: 180, damping: 26 };
const FAR_DISTANCE = 900;

/** Spring tuning for a move of `distance` px — looser the further it travels. */
export function springConfigFor(distance: number): SpringConfig {
  const t = Math.min(Math.max(distance, 0), FAR_DISTANCE) / FAR_DISTANCE;
  return {
    stiffness: NEAR.stiffness + (FAR.stiffness - NEAR.stiffness) * t,
    damping: NEAR.damping + (FAR.damping - NEAR.damping) * t,
  };
}

/** True once the pointer is close enough to press without looking off-target. */
export function hasArrived(current: Point, target: Point, tolerance = 4): boolean {
  return Math.hypot(target.x - current.x, target.y - current.y) <= tolerance;
}

const MAX_ARC = 42;

/** Lateral bow of the flight path, peaking mid-move. */
export function arcOffset(progress: number, distance: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  const amplitude = Math.min(Math.max(distance, 0) * 0.08, MAX_ARC);
  return Math.sin(progress * Math.PI) * amplitude;
}

const MAX_TILT = 12;
const MIN_TRAVEL = 1;

/** Degrees of lean in the direction of travel, clamped. */
export function tiltFor(dx: number, dy: number): number {
  const distance = Math.hypot(dx, dy);
  if (distance < MIN_TRAVEL) return 0;
  return (dx / distance) * MAX_TILT;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/product-scenes/showreelCursorMotion.test.ts
```

Expected: PASS, `pass 15  fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/features/portfolio/showreel/product-scenes/showreelCursorMotion.ts \
        src/features/portfolio/showreel/product-scenes/showreelCursorMotion.test.ts
git commit -m "feat(showreel): add cursor motion helpers"
```

---

### Task 2: Retry helper for late-mounting targets

**Files:**
- Create: `src/features/portfolio/showreel/product-scenes/pollForTarget.ts`
- Test: `src/features/portfolio/showreel/product-scenes/pollForTarget.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type PollOptions = { timeoutMs?: number; intervalMs?: number; now?: () => number; schedule?: (fn: () => void, ms: number) => unknown; cancel?: (handle: unknown) => void }`
  - `pollForTarget<T>(resolve: () => T | null | undefined, onSettled: (value: T | null) => void, options?: PollOptions): () => void` — returns a cancel function.

Callback style, not a Promise, so the caller can cancel synchronously on unmount and so tests can drive a fake clock without awaiting microtasks.

- [ ] **Step 1: Write the failing test**

Create `pollForTarget.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pollForTarget } from "./pollForTarget.ts";

/** Deterministic stand-in for setTimeout + Date.now. */
function fakeClock() {
  let time = 0;
  const queue: { at: number; id: number; fn: () => void }[] = [];
  let nextId = 1;

  return {
    now: () => time,
    schedule: (fn: () => void, ms: number) => {
      const id = nextId++;
      queue.push({ at: time + ms, id, fn });
      return id;
    },
    cancel: (handle: unknown) => {
      const i = queue.findIndex((entry) => entry.id === handle);
      if (i >= 0) queue.splice(i, 1);
    },
    advance: (ms: number) => {
      const until = time + ms;
      for (;;) {
        queue.sort((a, b) => a.at - b.at);
        const next = queue[0];
        if (!next || next.at > until) break;
        queue.shift();
        time = next.at;
        next.fn();
      }
      time = until;
    },
    pending: () => queue.length,
  };
}

describe("pollForTarget", () => {
  it("settles synchronously when the target is already there", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];

    pollForTarget(() => "ready", (value) => seen.push(value), {
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    assert.deepEqual(seen, ["ready"]);
    assert.equal(clock.pending(), 0);
  });

  it("keeps retrying until the target mounts", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];
    let attempts = 0;

    pollForTarget(
      () => {
        attempts += 1;
        return attempts >= 3 ? "late" : null;
      },
      (value) => seen.push(value),
      { intervalMs: 60, now: clock.now, schedule: clock.schedule, cancel: clock.cancel },
    );

    assert.deepEqual(seen, []);
    clock.advance(60);
    assert.deepEqual(seen, []);
    clock.advance(60);
    assert.deepEqual(seen, ["late"]);
    assert.equal(attempts, 3);
  });

  it("settles with null once the budget runs out", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];

    pollForTarget(() => null, (value) => seen.push(value), {
      timeoutMs: 120,
      intervalMs: 60,
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    clock.advance(60);
    assert.deepEqual(seen, []);
    clock.advance(60);
    assert.deepEqual(seen, [null]);
    assert.equal(clock.pending(), 0);
  });

  it("stops retrying after cancel", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];

    const cancel = pollForTarget(() => null, (value) => seen.push(value), {
      timeoutMs: 1000,
      intervalMs: 60,
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    cancel();
    clock.advance(1000);
    assert.deepEqual(seen, []);
    assert.equal(clock.pending(), 0);
  });

  it("settles at most once", () => {
    const clock = fakeClock();
    const seen: (string | null)[] = [];

    const cancel = pollForTarget(() => "now", (value) => seen.push(value), {
      now: clock.now,
      schedule: clock.schedule,
      cancel: clock.cancel,
    });

    cancel();
    clock.advance(500);
    assert.deepEqual(seen, ["now"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/product-scenes/pollForTarget.test.ts
```

Expected: FAIL — `Cannot find module ... pollForTarget.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `pollForTarget.ts`:

```ts
export type PollOptions = {
  timeoutMs?: number;
  intervalMs?: number;
  now?: () => number;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
};

const DEFAULT_TIMEOUT_MS = 1200;
const DEFAULT_INTERVAL_MS = 60;

/**
 * Retry `resolve` until it yields a value or the budget expires.
 * Showreel steps fire on a fixed timeline, but drawers and panels mount
 * late — a single probe silently drops the step and desyncs the demo.
 */
export function pollForTarget<T>(
  resolve: () => T | null | undefined,
  onSettled: (value: T | null) => void,
  options: PollOptions = {},
): () => void {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    intervalMs = DEFAULT_INTERVAL_MS,
    now = () => Date.now(),
    schedule = (fn, ms) => setTimeout(fn, ms),
    cancel = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  } = options;

  const started = now();
  let handle: unknown = null;
  let settled = false;

  const attempt = () => {
    if (settled) return;
    handle = null;

    const value = resolve();
    if (value !== null && value !== undefined) {
      settled = true;
      onSettled(value);
      return;
    }

    if (now() - started >= timeoutMs) {
      settled = true;
      onSettled(null);
      return;
    }

    handle = schedule(attempt, intervalMs);
  };

  attempt();

  return () => {
    if (settled) return;
    settled = true;
    if (handle !== null) cancel(handle);
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/product-scenes/pollForTarget.test.ts
```

Expected: PASS, `pass 5  fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/features/portfolio/showreel/product-scenes/pollForTarget.ts \
        src/features/portfolio/showreel/product-scenes/pollForTarget.test.ts
git commit -m "feat(showreel): add cancellable retry helper for cursor targets"
```

---

### Task 3: Cursor overlay visual rewrite

**Files:**
- Modify (full rewrite): `src/features/portfolio/showreel/product-scenes/ShowreelCursorOverlay.tsx`

**Interfaces:**
- Consumes: nothing from Tasks 1–2 directly (motion math lives in the hook).
- Produces: `ShowreelCursorOverlay(props: ShowreelCursorView)` where

```ts
export type ShowreelCursorView = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  arc: MotionValue<number>;
  tilt: MotionValue<number>;
  pressing: boolean;
  visible: boolean;
};
```

Task 4's hook returns exactly this shape, and the three call sites keep spreading it (`<ShowreelCursorOverlay {...cursor} />`).

The component is deliberately dumb: it binds `MotionValue`s to `style` so the tracking loop in Task 4 never re-renders React.

- [ ] **Step 1: Rewrite the component**

Replace the whole file with:

```tsx
"use client";

import { AnimatePresence, motion, type MotionValue } from "framer-motion";

export type ShowreelCursorView = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  arc: MotionValue<number>;
  tilt: MotionValue<number>;
  pressing: boolean;
  visible: boolean;
};

/** Visible pointer for scripted showreel clicks inside the demo iframe. */
export function ShowreelCursorOverlay({
  x,
  y,
  arc,
  tilt,
  pressing,
  visible,
}: ShowreelCursorView) {
  return (
    <div className="showreel-cursor-layer" aria-hidden>
      <AnimatePresence>
        {visible ? (
          <motion.div
            className="showreel-cursor"
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <motion.div className="showreel-cursor-arc" style={{ y: arc }}>
              <span className="showreel-cursor-halo" />
              <motion.svg
                className="showreel-cursor-arrow"
                style={{ rotate: tilt }}
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                animate={{ scale: pressing ? 0.86 : 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 26 }}
              >
                <path
                  d="M5.6 3.3a1.1 1.1 0 0 1 1.6-1.2l14.1 8.2a1.1 1.1 0 0 1-.3 2l-6 1.4a1.1 1.1 0 0 0-.8.7l-2.3 6a1.1 1.1 0 0 1-2-.1L5.6 3.3Z"
                  fill="var(--sr-ink, #0f2744)"
                  stroke="#fff"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </motion.svg>
              <AnimatePresence>
                {pressing ? (
                  <motion.span
                    className="showreel-cursor-ripple"
                    initial={{ opacity: 0.55, scale: 0.4 }}
                    animate={{ opacity: 0, scale: 1.9 }}
                    exit={{ opacity: 0, scale: 1.9 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Add the cursor CSS**

Append to `src/features/portfolio/showreel/showreel.css`:

```css
/* Scripted demo cursor */
.showreel-cursor-layer {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
}

.showreel-cursor {
  position: absolute;
  top: 0;
  left: 0;
  width: 26px;
  height: 26px;
  margin: -3px 0 0 -3px;
  will-change: transform;
}

.showreel-cursor-arc {
  position: relative;
  width: 100%;
  height: 100%;
}

.showreel-cursor-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--sr-accent, #5e6ad2) 26%, transparent) 0%,
    transparent 68%
  );
}

.showreel-cursor-arrow {
  position: relative;
  display: block;
  filter: drop-shadow(0 4px 10px rgba(15, 39, 68, 0.35));
}

.showreel-cursor-ripple {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--sr-accent, #5e6ad2) 30%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--sr-accent, #5e6ad2) 55%, transparent);
}
```

The `var(--sr-accent, #5e6ad2)` fallbacks matter: the cursor renders inside the `/showreel/demo` iframe document, which does **not** carry `.showreel-page` and therefore has no tokens. Task 5 adds the tokens for the deck; the fallbacks cover the iframe.

- [ ] **Step 3: Verify the app still builds**

```bash
yarn build
```

Expected: build succeeds. It will fail type-checking at the three call sites until Task 4 lands the matching hook — if so, note it and proceed to Task 4, then re-run.

- [ ] **Step 4: Commit**

```bash
git add src/features/portfolio/showreel/product-scenes/ShowreelCursorOverlay.tsx \
        src/features/portfolio/showreel/showreel.css
git commit -m "feat(showreel): restyle demo cursor as soft glass arrow"
```

---

### Task 4: Cursor script rebuild

**Files:**
- Create: `src/features/portfolio/showreel/product-scenes/useShowreelCursorScript.ts`
- Modify (full rewrite): `src/features/portfolio/showreel/product-scenes/useShowreelDashboardCursor.ts`

**Interfaces:**
- Consumes: `springConfigFor`, `hasArrived`, `arcOffset`, `tiltFor` (Task 1); `pollForTarget` (Task 2); `ShowreelCursorView` (Task 3); existing `resolveShowreelCursorTarget`, `ShowreelCursorStep`, `fireShowreelClick`, `SHOWREEL_CLINIC_DRAWER_CLOSE`, `SHOWREEL_NAVIGATE_EVENT`.
- Produces: `useShowreelCursorScript(active: boolean, runId?: number, steps?: ShowreelCursorStep[], rootSelector?: string): ShowreelCursorView`.

`useShowreelDashboardCursor.ts` becomes a re-export shim so `ShowreelAdminSceneFrame.tsx`, `DashboardScene.tsx`, and `SiteToChatScene.tsx` keep their existing imports unchanged.

- [ ] **Step 1: Create the new hook**

Create `useShowreelCursorScript.ts`:

```ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { prefersReducedMotion } from "@/features/portfolio/motion/gsapClient";
import {
  arcOffset,
  hasArrived,
  springConfigFor,
  tiltFor,
  type Point,
  type SpringConfig,
} from "./showreelCursorMotion";
import { pollForTarget } from "./pollForTarget";
import {
  SHOWREEL_DASHBOARD_CURSOR_STEPS,
  resolveShowreelCursorTarget,
  type ShowreelCursorStep,
} from "./showreelCursorTimeline";
import { SHOWREEL_CLINIC_DRAWER_CLOSE } from "./showreelAdminEvents";
import { fireShowreelClick } from "./fireShowreelClick";
import type { ShowreelCursorView } from "./ShowreelCursorOverlay";

const START: Point = { x: 72, y: 96 };
const STEP_LEAD_MS = 120;
const SELECTOR_TIMEOUT_MS = 1200;
const WAIT_TIMEOUT_MS = 2500;
const ARRIVE_FALLBACK_MS = 900;
const PRESS_DELAY_MS = 120;
const PRESS_RELEASE_MS = 260;
const MAX_FRAME_S = 1 / 30;

function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function fireClick(el: Element) {
  fireShowreelClick(el as HTMLElement);
  if (el.getAttribute("data-showreel-action") === "clinic-drawer-close") {
    window.dispatchEvent(new Event(SHOWREEL_CLINIC_DRAWER_CLOSE));
  }
}

function resolveTarget(root: ParentNode, selector: string): Element | null {
  return (
    resolveShowreelCursorTarget(root, selector) ??
    document.querySelector(selector)
  );
}

function pressEscape() {
  for (const node of [window, document]) {
    node.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
  }
}

/** Scripted cursor + real clicks for any showreel product scene. */
export function useShowreelCursorScript(
  active: boolean,
  runId = 0,
  steps: ShowreelCursorStep[] = SHOWREEL_DASHBOARD_CURSOR_STEPS,
  rootSelector = ".showreel-demo-dashboard, [data-showreel-demo]",
): ShowreelCursorView {
  const x = useMotionValue(START.x);
  const y = useMotionValue(START.y);
  const arc = useMotionValue(0);
  const tilt = useMotionValue(0);
  const [pressing, setPressing] = useState(false);
  const [visible, setVisible] = useState(false);

  // Written by the step scheduler, read by the rAF loop.
  const targetRef = useRef<Point>({ ...START });
  const followRef = useRef<Element | null>(null);
  const configRef = useRef<SpringConfig>(springConfigFor(0));
  const travelRef = useRef(0);
  const arriveRef = useRef<(() => void) | null>(null);

  const running = active && runId >= 1;
  const stepsKey = steps.map((s) => `${s.id}:${s.at}`).join("|");

  // SiteToChatScene passes a literal `[]`, so `steps` gets a fresh identity on
  // every render. Key the effect on the value, read the array through a ref —
  // otherwise the scheduler restarts mid-scene and snaps the pointer home.
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  // Motion loop: follows the live rect of the current target so a smooth
  // scrollIntoView can move the element out from under the pointer.
  useEffect(() => {
    if (!running) return;
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();
    let vx = 0;
    let vy = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_FRAME_S);
      last = now;

      const follow = followRef.current;
      if (follow?.isConnected) {
        const rect = follow.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          targetRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
      }

      const target = targetRef.current;
      let nx: number;
      let ny: number;

      if (reduced) {
        nx = target.x;
        ny = target.y;
        vx = 0;
        vy = 0;
      } else {
        const { stiffness, damping } = configRef.current;
        const px = x.get();
        const py = y.get();
        vx += (stiffness * (target.x - px) - damping * vx) * dt;
        vy += (stiffness * (target.y - py) - damping * vy) * dt;
        nx = px + vx * dt;
        ny = py + vy * dt;
      }

      x.set(nx);
      y.set(ny);

      const travel = travelRef.current;
      if (reduced || travel <= 0) {
        arc.set(0);
        tilt.set(0);
      } else {
        const remaining = Math.hypot(target.x - nx, target.y - ny);
        const progress = 1 - Math.min(remaining / travel, 1);
        arc.set(-arcOffset(progress, travel));
        tilt.set(tiltFor(vx, vy));
      }

      const onArrive = arriveRef.current;
      if (onArrive && hasArrived({ x: nx, y: ny }, target)) {
        arriveRef.current = null;
        onArrive();
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, x, y, arc, tilt]);

  // Step scheduler.
  useEffect(() => {
    if (!running) {
      setVisible(false);
      setPressing(false);
      followRef.current = null;
      arriveRef.current = null;
      return;
    }

    const root = document.querySelector(rootSelector);
    if (!root) return;

    const timers: number[] = [];
    const cancels: (() => void)[] = [];
    let cancelled = false;

    x.set(START.x);
    y.set(START.y);
    targetRef.current = { ...START };
    travelRef.current = 0;
    followRef.current = null;
    arriveRef.current = null;

    const after = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    /** Aim at a point, optionally riding a live element, then run `onArrive`. */
    const aim = (
      point: Point,
      follow: Element | null,
      onArrive?: () => void,
    ) => {
      const distance = Math.hypot(point.x - x.get(), point.y - y.get());
      targetRef.current = point;
      travelRef.current = distance;
      configRef.current = springConfigFor(distance);
      followRef.current = follow;
      arriveRef.current = onArrive ?? null;
      if (onArrive) {
        after(ARRIVE_FALLBACK_MS, () => {
          if (cancelled) return;
          const pending = arriveRef.current;
          if (!pending) return;
          arriveRef.current = null;
          pending();
        });
      }
    };

    const clickWhenThere = (selector: string, el: Element) => {
      aim(centerOf(el), el, () => {
        if (cancelled) return;
        setPressing(true);
        after(PRESS_DELAY_MS, () => {
          if (cancelled) return;
          fireClick(resolveTarget(root, selector) ?? el);
        });
        after(PRESS_RELEASE_MS, () => {
          if (cancelled) return;
          setPressing(false);
        });
      });
    };

    /** Look the element up with retries, then hand it to `use`. */
    const withTarget = (
      selector: string,
      timeoutMs: number,
      use: (el: Element) => void,
    ) => {
      cancels.push(
        pollForTarget<Element>(
          () => resolveTarget(root, selector),
          (el) => {
            if (cancelled || !el) return;
            use(el);
          },
          { timeoutMs },
        ),
      );
    };

    const runStep = (step: ShowreelCursorStep) => {
      if (step.dispatch) {
        window.dispatchEvent(
          new CustomEvent(step.dispatch.name, { detail: step.dispatch.detail }),
        );
      }

      if (step.scrollSelector) {
        withTarget(step.scrollSelector, SELECTOR_TIMEOUT_MS, (el) => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          aim(centerOf(el), el);
        });
        return;
      }

      if (step.selector) {
        const selector = step.selector;
        withTarget(selector, SELECTOR_TIMEOUT_MS, (el) => {
          if (step.click) clickWhenThere(selector, el);
          else aim(centerOf(el), el);
        });
        return;
      }

      if (step.escape) {
        pressEscape();
        return;
      }

      if (step.waitForSelector) {
        withTarget(step.waitForSelector, WAIT_TIMEOUT_MS, (el) => {
          aim(centerOf(el), el);
        });
      }
    };

    after(80, () => {
      if (!cancelled) setVisible(true);
    });

    for (const step of stepsRef.current) {
      after(step.at + STEP_LEAD_MS, () => {
        if (!cancelled) runStep(step);
      });
    }

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      cancels.forEach((cancel) => cancel());
      followRef.current = null;
      arriveRef.current = null;
      setPressing(false);
      setVisible(false);
    };
  }, [running, runId, stepsKey, rootSelector, x, y]);

  return { x, y, arc, tilt, pressing, visible };
}
```

- [ ] **Step 2: Turn the old file into a shim**

Replace `useShowreelDashboardCursor.ts` entirely with:

```ts
"use client";

import { useEffect } from "react";
import { SHOWREEL_DASHBOARD_CURSOR_STEPS } from "./showreelCursorTimeline";
import {
  SHOWREEL_NAVIGATE_EVENT,
  type ShowreelNavigateDetail,
} from "./showreelAdminEvents";
import { useShowreelCursorScript } from "./useShowreelCursorScript";

export { useShowreelCursorScript };

/** @deprecated use useShowreelCursorScript */
export function useShowreelDashboardCursor(active: boolean, runId = 0) {
  return useShowreelCursorScript(
    active,
    runId,
    SHOWREEL_DASHBOARD_CURSOR_STEPS,
  );
}

/** Block Next.js navigation to /admin/support; switch showreel page instead. */
export function useShowreelBlockAdminNav(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href="/admin/support"]');
      if (!link) return;
      event.preventDefault();
      window.dispatchEvent(
        new CustomEvent(SHOWREEL_NAVIGATE_EVENT, {
          detail: {
            href: "/admin/support",
            title: "Front desk",
            id: "support",
            kind: "page",
          } satisfies ShowreelNavigateDetail,
        }),
      );
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled]);
}
```

- [ ] **Step 3: Run the full suite**

```bash
yarn test
```

Expected: PASS, `fail 0`. `buildShowreelDashboardProps.test.ts`, `fireShowreelClick.test.ts`, and the new helper tests all green.

- [ ] **Step 4: Type-check via build**

```bash
yarn build
```

Expected: build succeeds. The three call sites (`ShowreelAdminSceneFrame.tsx:84`, `DashboardScene.tsx:49`, `SiteToChatScene.tsx:64,91`) spread `{...cursor}`, which now matches `ShowreelCursorView`.

- [ ] **Step 5: Commit**

```bash
git add src/features/portfolio/showreel/product-scenes/useShowreelCursorScript.ts \
        src/features/portfolio/showreel/product-scenes/useShowreelDashboardCursor.ts
git commit -m "fix(showreel): track live cursor targets, retry lookups, click on arrival"
```

---

### Task 5: CSS token layer + layered background

**Files:**
- Modify: `src/features/portfolio/showreel/showreel.css`

**Interfaces:**
- Consumes: nothing.
- Produces: the `--sr-*` custom properties on `.showreel-page`, used by Tasks 6–8 and by the cursor CSS from Task 3.

- [ ] **Step 1: Declare the tokens and layered background**

Replace the `.showreel-page` block (currently `showreel.css:9-15`) with:

```css
.showreel-page {
  --sr-bg: #fbfbfc;
  --sr-bg-deep: #f1f3f7;
  --sr-ink: #0f2744;
  --sr-ink-soft: #6b7280;
  --sr-accent: #5e6ad2;
  --sr-gold: #c9a962;
  --sr-line: #e6e8ec;
  --sr-shadow-contact: 0 1px 2px rgba(15, 39, 68, 0.06);
  --sr-shadow-ambient: 0 18px 44px -18px rgba(15, 39, 68, 0.28);

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, var(--sr-bg), var(--sr-bg-deep));
  color: var(--sr-ink);
}

.showreel-page::before,
.showreel-page::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.showreel-page::before {
  background:
    radial-gradient(
      60rem 40rem at 12% 8%,
      color-mix(in srgb, var(--sr-accent) 4%, transparent),
      transparent 70%
    ),
    radial-gradient(
      52rem 36rem at 88% 92%,
      color-mix(in srgb, var(--sr-gold) 3%, transparent),
      transparent 70%
    );
}

.showreel-page::after {
  background-image:
    radial-gradient(
      120% 100% at 50% 50%,
      transparent 55%,
      rgba(15, 39, 68, 0.05) 100%
    ),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.32'/%3E%3C/svg%3E");
  background-size: auto, 160px 160px;
  opacity: 0.55;
  mix-blend-mode: multiply;
}
```

- [ ] **Step 2: Point existing rules at the tokens**

In the same file, replace every remaining literal with its token:

- `#0f2744` → `var(--sr-ink)` in `.showreel-me-mark`, `.showreel-intro-line`, `.showreel-headline`, `.showreel-keywords li`, `.showreel-outro-name`.
- `#6b7280` → `var(--sr-ink-soft)` in `.showreel-brand-by`, `.showreel-intro-meta`, `.showreel-intro-line--3/--4/--5`, `.showreel-intro-body`, `.showreel-outro-label`, `.showreel-kicker`, `.showreel-lede`, `.showreel-keywords li:nth-child(2)`.
- `#5e6ad2` → `var(--sr-accent)` in `.showreel-intro-line--2`, `.showreel-outro-line--next`, `.showreel-keywords li:nth-child(3)`.
- `#c9a962` → `var(--sr-gold)` in `.showreel-me-mark-letter--e`, `.showreel-intro-index`, `.showreel-intro-body` border.
- `#e6e8ec` → `var(--sr-line)` in `.showreel-device-monitor` and `.showreel-scene--dashboard .showreel-scene-copy`.

Leave the two `.showreel-dash-focus` rules alone — they style content inside the demo iframe, which has no `.showreel-page` ancestor and must keep using `var(--admin-primary, #5e6ad2)`.

- [ ] **Step 3: Verify no stray literals remain**

```bash
grep -nE '#(f7f8f8|0f2744|6b7280|c9a962|e6e8ec)' src/features/portfolio/showreel/showreel.css
grep -n '#5e6ad2' src/features/portfolio/showreel/showreel.css
```

Expected: first command prints nothing. Second prints only the two `--admin-primary` fallbacks and the `--sr-accent` fallbacks in the cursor rules from Task 3.

- [ ] **Step 4: Check it renders**

```bash
yarn dev
```

Open `http://localhost:3000/showreel`. Expect a soft gradient ground with a faint corner wash and fine grain — no visible banding, no seam, and text contrast unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/features/portfolio/showreel/showreel.css
git commit -m "feat(showreel): add design tokens and layered background"
```

---

### Task 6: Modernized device chrome

**Files:**
- Modify: `src/features/portfolio/showreel/showreel.css`

**Interfaces:**
- Consumes: `--sr-line`, `--sr-shadow-contact`, `--sr-shadow-ambient` (Task 5).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Drop the filter-based shadow**

Replace the `.showreel-device--desktop, .showreel-device--mobile` rule (`showreel.css:505-508`) with:

```css
/* box-shadow, not filter: drop-shadow re-rasterizes the live iframe every
   frame during the GSAP slide transitions. */
.showreel-device--desktop,
.showreel-device--mobile {
  filter: none;
}
```

- [ ] **Step 2: Restyle the monitor**

Replace the `.showreel-device-monitor` rule (`showreel.css:510-516`) with:

```css
.showreel-device-monitor {
  width: min(72vw, 1100px);
  padding: 0.45rem 0.45rem 0.55rem;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #fafbfc);
  border: 1px solid rgba(15, 39, 68, 0.08);
  box-shadow:
    var(--sr-shadow-contact),
    var(--sr-shadow-ambient),
    inset 0 0 0 1px rgba(255, 255, 255, 0.9);
}
```

- [ ] **Step 3: Ring the screen**

Add to the `.showreel-device-screen` rule (`showreel.css:586-594`), keeping every existing declaration:

```css
  box-shadow: inset 0 0 0 1px rgba(15, 39, 68, 0.07);
```

- [ ] **Step 4: Restyle the phone**

Replace the `.showreel-device-phone` rule (`showreel.css:556-562`) with:

```css
.showreel-device-phone {
  width: min(28vw, 280px);
  padding: 0.38rem 0.35rem 0.48rem;
  border-radius: 26px;
  background: linear-gradient(180deg, #1b2230, #0b0f16);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    var(--sr-shadow-contact),
    var(--sr-shadow-ambient),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
```

- [ ] **Step 5: Check it renders**

With `yarn dev` running, open `/showreel`. Expect: rounder bezels, a visible contact shadow under each device, and no clipping of the phone bezel at the container-query breakpoints (resize the window from 1440px down to 900px to confirm — the `--showreel-phone-col` rules are unchanged and must still hold).

- [ ] **Step 6: Commit**

```bash
git add src/features/portfolio/showreel/showreel.css
git commit -m "feat(showreel): modernize device bezels and shadows"
```

---

### Task 7: Typographic polish

**Files:**
- Modify: `src/features/portfolio/showreel/showreel.css`

**Interfaces:**
- Consumes: `--sr-accent`, `--sr-ink`, `--sr-ink-soft` (Task 5).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Restyle the kicker**

Replace the `.showreel-kicker` rule (`showreel.css:299-306`) with:

```css
.showreel-kicker {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.75rem;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--sr-ink-soft);
}

.showreel-kicker::before {
  content: "";
  flex: 0 0 auto;
  width: 2rem;
  height: 1px;
  background: var(--sr-accent);
}

/* A leading rule reads as an orphan on centered scenes. */
.showreel-scene--hero .showreel-kicker,
.showreel-scene--outro .showreel-kicker,
.showreel-feature-title-card .showreel-kicker {
  justify-content: center;
}

.showreel-scene--hero .showreel-kicker::before,
.showreel-scene--outro .showreel-kicker::before,
.showreel-feature-title-card .showreel-kicker::before {
  display: none;
}
```

- [ ] **Step 2: Tighten the headline**

In `.showreel-headline` (`showreel.css:308-316`), change `letter-spacing: -0.03em` to `-0.035em` and add:

```css
  text-wrap: balance;
```

- [ ] **Step 3: Improve the lede measure**

Replace the `.showreel-lede` rule (`showreel.css:318-324`) with:

```css
.showreel-lede {
  margin: 0 auto 1.25rem;
  max-width: 34rem;
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--sr-ink-soft);
  text-wrap: pretty;
}
```

- [ ] **Step 4: Balance the big display lines**

Add `text-wrap: balance;` to `.showreel-intro-line` (`showreel.css:220-228`) and to `.showreel-outro-name` (`showreel.css:262-270`).

- [ ] **Step 5: Check it renders**

With `yarn dev` running, step through `/showreel`. Expect: the accent rule appears before feature-slide kickers but not on the intro, outro, or title cards; headlines break into even lines; ledes no longer run long on wide screens.

- [ ] **Step 6: Commit**

```bash
git add src/features/portfolio/showreel/showreel.css
git commit -m "feat(showreel): refine kicker, headline and lede typography"
```

---

### Task 8: Slide progress rail

**Files:**
- Create: `src/features/portfolio/showreel/ShowreelProgressRail.tsx`
- Modify: `src/features/portfolio/showreel/ShowreelDeck.tsx`
- Modify: `src/features/portfolio/showreel/showreel.css`

**Interfaces:**
- Consumes: `ShowreelSlide` and `SHOWREEL_SLIDES` from `./showreelSlides`; `--sr-accent`, `--sr-ink-soft` (Task 5).
- Produces: `ShowreelProgressRail(props: { slides: ShowreelSlide[]; index: number; playing: boolean })`.

`useShowreelDeck` already returns `index`; `ShowreelDeck` currently destructures only `{ slide, total, playing, setPlaying }` and must add `index`.

- [ ] **Step 1: Create the component**

Create `ShowreelProgressRail.tsx`:

```tsx
"use client";

import type { CSSProperties } from "react";
import type { ShowreelSlide } from "./showreelSlides";

type Props = {
  slides: ShowreelSlide[];
  index: number;
  playing: boolean;
};

/** Segmented pacing rail — tick width tracks each slide's real duration. */
export function ShowreelProgressRail({ slides, index, playing }: Props) {
  return (
    <div className="showreel-rail" aria-hidden>
      {slides.map((slide, i) => {
        const state = i < index ? "is-done" : i === index ? "is-live" : "";
        return (
          <span
            key={slide.id}
            className={`showreel-rail-tick ${state}`.trim()}
            style={
              {
                flexGrow: slide.durationMs,
                "--sr-tick-ms": `${slide.durationMs}ms`,
              } as CSSProperties
            }
          >
            <span
              // Keyed on slide id so the fill restarts for each slide.
              key={`${slide.id}:${index}`}
              className="showreel-rail-fill"
              data-paused={i === index && !playing ? "1" : undefined}
            />
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add the rail CSS**

Append to `showreel.css`:

```css
/* Slide pacing rail */
.showreel-rail {
  position: fixed;
  bottom: clamp(0.75rem, 2vh, 1.25rem);
  left: 50%;
  z-index: 25;
  display: flex;
  gap: 0.3rem;
  width: min(38rem, 60vw);
  transform: translateX(-50%);
  pointer-events: none;
}

.showreel-rail-tick {
  position: relative;
  flex-basis: 0;
  height: 2px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sr-ink-soft) 22%, transparent);
}

.showreel-rail-fill {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform: scaleX(0);
  border-radius: inherit;
  background: var(--sr-accent);
}

.showreel-rail-tick.is-done .showreel-rail-fill {
  transform: scaleX(1);
}

.showreel-rail-tick.is-live .showreel-rail-fill {
  animation: showreel-rail-fill var(--sr-tick-ms) linear forwards;
}

.showreel-rail-tick.is-live .showreel-rail-fill[data-paused] {
  animation-play-state: paused;
}

@keyframes showreel-rail-fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .showreel-rail-tick.is-live .showreel-rail-fill {
    animation: none;
    transform: scaleX(1);
  }
}
```

- [ ] **Step 3: Wire it into the deck**

In `ShowreelDeck.tsx`, add the import beside the existing ones:

```tsx
import { ShowreelProgressRail } from "./ShowreelProgressRail";
```

Change the destructure from:

```tsx
  const { slide, total, playing, setPlaying } = useShowreelDeck();
```

to:

```tsx
  const { slide, index, total, playing, setPlaying } = useShowreelDeck();
```

Then, immediately before the closing `</div>` of `.showreel-deck` (after the `.showreel-stage` div), add:

```tsx
      <ShowreelProgressRail
        slides={SHOWREEL_SLIDES}
        index={index}
        playing={playing}
      />
```

`SHOWREEL_SLIDES` is already imported in this file.

- [ ] **Step 4: Run the full suite and build**

```bash
yarn test && yarn build
```

Expected: `fail 0` and a successful build.

- [ ] **Step 5: Check it renders**

With `yarn dev` running, open `/showreel` and watch a full cycle. Expect: ticks of unequal width matching slide durations, the active tick filling left-to-right over exactly that slide's duration, and earlier ticks staying filled.

- [ ] **Step 6: Commit**

```bash
git add src/features/portfolio/showreel/ShowreelProgressRail.tsx \
        src/features/portfolio/showreel/ShowreelDeck.tsx \
        src/features/portfolio/showreel/showreel.css
git commit -m "feat(showreel): add slide pacing rail"
```

---

## Verification

Run before declaring done:

```bash
yarn test
yarn build
yarn lint
```

Then walk `/showreel` end to end and confirm:

1. The cursor fades in rather than popping in at a corner.
2. On the dashboard scene's `scroll-schedule` step, the cursor rides the widget down as it scrolls instead of being left behind.
3. Every click lands with the pointer visibly on the target.
4. The `wait-drawer` and `wait-whatsapp` steps still resolve when the panel mounts late.
5. The progress rail completes exactly as each slide hands off.
