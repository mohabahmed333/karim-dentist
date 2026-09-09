"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";
import { prefersReducedMotion } from "@/features/portfolio/motion/gsapClient";
import {
  arcOffset,
  hasArrived,
  magnetScale,
  springConfigFor,
  tiltFor,
  type Point,
  type SpringConfig,
} from "./showreelCursorMotion";
import { pollForTarget } from "./pollForTarget";
import { scrollIntoContainerView } from "./scrollWithinContainer";
import { typewriterFrames } from "./typewriterFrames";
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
/** Long enough to cover a smooth scroll; after that the target is frozen so
    the loop stops forcing layout on every frame for the rest of the scene. */
const FOLLOW_WINDOW_MS = 1500;
/** Velocity (px/s) at which the travel-direction tilt reaches full lean. */
const TILT_FULL_SPEED = 200;

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
  const [beat, setBeat] = useState<string | null>(null);

  // Written by the step scheduler, read by the rAF loop.
  const targetRef = useRef<Point>({ ...START });
  const followRef = useRef<Element | null>(null);
  const hoverRef = useRef<Element | null>(null);
  const followUntilRef = useRef(0);
  const configRef = useRef<SpringConfig>(springConfigFor(0));
  const travelRef = useRef(0);
  const arriveRef = useRef<(() => void) | null>(null);
  // Shared with the scheduler so a restart can zero it — otherwise the cursor
  // teleports home carrying the previous run's velocity and visibly kicks.
  const velocityRef = useRef({ x: 0, y: 0 });

  const running = active && runId >= 1 && steps.length > 0;
  const stepsKey = steps.map((s) => `${s.id}:${s.at}`).join("|");

  // SiteToChatScene passes a literal `[]`, so `steps` gets a fresh identity on
  // every render. Key the effect on the value, read the array through a ref —
  // otherwise the scheduler restarts mid-scene and snaps the pointer home.
  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  });

  // Motion loop: follows the live rect of the current target so a smooth
  // scroll can move the element out from under the pointer.
  useEffect(() => {
    if (!running) return;
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_FRAME_S);
      last = now;

      const follow = followRef.current;
      if (follow && now < followUntilRef.current) {
        if (follow.isConnected) {
          const rect = follow.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) {
            targetRef.current = centerOf(follow);
          }
        }
      } else if (follow) {
        followRef.current = null;
      }

      const target = targetRef.current;
      const velocity = velocityRef.current;
      let nx: number;
      let ny: number;

      if (reduced) {
        nx = target.x;
        ny = target.y;
        velocity.x = 0;
        velocity.y = 0;
      } else {
        const { stiffness, damping } = configRef.current;
        const px = x.get();
        const py = y.get();
        // Snap in over the last few px instead of merely decelerating.
        // Worst case k = 420 * 1.6 = 672 -> 2/sqrt(672) = 77ms, still well
        // above the 33ms dt clamp, so the integrator stays stable.
        const k = stiffness * magnetScale(Math.hypot(target.x - px, target.y - py));
        velocity.x += (k * (target.x - px) - damping * velocity.x) * dt;
        velocity.y += (k * (target.y - py) - damping * velocity.y) * dt;
        nx = px + velocity.x * dt;
        ny = py + velocity.y * dt;
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
        // Ramp the lean in by speed. tiltFor normalizes by magnitude, so
        // feeding it raw velocity would hold full lean until |v| < 1 px/s and
        // then pop to 0 in a single frame.
        const speed = Math.hypot(velocity.x, velocity.y);
        tilt.set(
          tiltFor(velocity.x, velocity.y) *
            Math.min(speed / TILT_FULL_SPEED, 1),
        );
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
  }, [running, runId, stepsKey, x, y, arc, tilt]);

  // Step scheduler.
  useEffect(() => {
    // No setState here: going running -> idle already runs the previous
    // effect's cleanup, which resets both flags.
    if (!running) {
      followRef.current = null;
      arriveRef.current = null;
      return;
    }

    const timers: number[] = [];
    const cancels: (() => void)[] = [];
    let cancelled = false;

    x.set(START.x);
    y.set(START.y);
    targetRef.current = { ...START };
    travelRef.current = 0;
    followRef.current = null;
    followUntilRef.current = 0;
    arriveRef.current = null;
    velocityRef.current.x = 0;
    velocityRef.current.y = 0;
    // No setState here: the previous run's cleanup already sets beat to null
    // before this body executes (same reasoning as pressing/visible above).

    // Resolved per attempt, not captured once: the scene root can mount after
    // the run starts, and SiteToChatScene swaps its subtree between phases.
    const getRoot = (): ParentNode =>
      document.querySelector(rootSelector) ?? document;

    const after = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    const HOVER_IN = ["pointerover", "pointerenter", "mousemove"] as const;
    const HOVER_OUT = ["pointerout", "pointerleave"] as const;

    /** Move the synthetic hover to `el` (or clear it). Dispatched events reach
        JS handlers; CSS :hover cannot fire synthetically, so the visible lift
        comes from the class. */
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
      setHover(follow);
      followUntilRef.current = performance.now() + FOLLOW_WINDOW_MS;
      arriveRef.current = onArrive ?? null;
      if (onArrive) {
        // Bind the fallback to THIS callback. Reading arriveRef at fire time
        // would let a stale fallback trigger a later step's click mid-flight.
        after(ARRIVE_FALLBACK_MS, () => {
          if (cancelled || arriveRef.current !== onArrive) return;
          arriveRef.current = null;
          onArrive();
        });
      }
    };

    /** Dispatch a step's event, optionally as growing text frames so a plain
        setState(text) handler renders as visible typing. */
    const fireDispatch = (
      dispatch: { name: string; detail?: unknown },
      typeMs?: number,
    ) => {
      const detail = dispatch.detail;
      const detailObject =
        detail && typeof detail === "object"
          ? (detail as Record<string, unknown>)
          : null;
      const text = detailObject?.text;

      if (typeMs && typeof text === "string") {
        for (const frame of typewriterFrames(text, { durationMs: typeMs })) {
          after(frame.at, () => {
            if (cancelled) return;
            window.dispatchEvent(
              new CustomEvent(dispatch.name, {
                detail: { ...detailObject, text: frame.text },
              }),
            );
          });
        }
        return;
      }

      window.dispatchEvent(new CustomEvent(dispatch.name, { detail }));
    };

    const clickWhenThere = (
      selector: string,
      el: Element,
      dispatch?: { name: string; detail?: unknown },
      typeMs?: number,
    ) => {
      aim(centerOf(el), el, () => {
        if (cancelled) return;
        setPressing(true);
        el.classList.add("showreel-press");
        after(PRESS_DELAY_MS, () => {
          if (cancelled) return;
          // Click first (the visible cause), then any companion state
          // update — "click into the field" reading before "text appears".
          fireClick(resolveTarget(getRoot(), selector) ?? el);
          if (dispatch) fireDispatch(dispatch, typeMs);
        });
        // Class removal precedes the cancelled guard so a teardown mid-press
        // cannot strand it on live admin UI.
        after(PRESS_RELEASE_MS, () => {
          el.classList.remove("showreel-press");
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
          () => resolveTarget(getRoot(), selector),
          (el) => {
            if (cancelled || !el) return;
            use(el);
          },
          { timeoutMs },
        ),
      );
    };

    const runStep = (step: ShowreelCursorStep) => {
      if (step.beat) setBeat(step.beat);

      if (step.highlight) {
        const highlightSelector = step.highlight;
        // Let the primary action (click + its effect) settle before pulsing,
        // so the highlight reads as "this just landed", not "this is about
        // to happen".
        after(step.click ? 500 : 300, () => {
          if (cancelled) return;
          const el = resolveTarget(getRoot(), highlightSelector);
          if (!el) return;
          el.classList.add("showreel-highlight-pulse");
          after(750, () => {
            el.classList.remove("showreel-highlight-pulse");
          });
        });
      }

      // A dispatch paired with a selector is caused by cursor arrival (via
      // clickWhenThere's press, or aim's onArrive below) instead of firing
      // blind at step start — the fix for actions that used to teleport the
      // UI ahead of any visible cursor movement. Only a selector-less
      // dispatch (no target exists to move to) still fires immediately.
      if (step.dispatch && !step.selector) {
        fireDispatch(step.dispatch, step.typeMs);
      }

      if (step.escape) {
        pressEscape();
        return;
      }

      if (step.scrollSelector) {
        withTarget(step.scrollSelector, SELECTOR_TIMEOUT_MS, (el) => {
          // Not scrollIntoView: that scrolls every scrollable ancestor up
          // to the document, which shifted the whole scene (and the
          // cursor's frame of reference) instead of just the panel.
          scrollIntoContainerView(el);
          aim(centerOf(el), el);
        });
        return;
      }

      if (step.scrollWithin) {
        const { selector, top } = step.scrollWithin;
        withTarget(selector, SELECTOR_TIMEOUT_MS, (el) => {
          el.scrollTo({ top, behavior: "smooth" });
          aim(centerOf(el), el);
        });
        return;
      }

      if (step.selector) {
        const selector = step.selector;
        withTarget(selector, SELECTOR_TIMEOUT_MS, (el) => {
          if (step.click) {
            clickWhenThere(selector, el, step.dispatch, step.typeMs);
          } else if (step.dispatch) {
            const dispatch = step.dispatch;
            const typeMs = step.typeMs;
            aim(centerOf(el), el, () => {
              if (cancelled) return;
              fireDispatch(dispatch, typeMs);
            });
          } else {
            aim(centerOf(el), el);
          }
        });
        return;
      }

      if (step.waitForSelector) {
        // Drift toward where the result will land instead of sitting frozen
        // while the poll resolves.
        if (step.anticipate) {
          const hint = resolveTarget(getRoot(), step.anticipate);
          if (hint) aim(centerOf(hint), hint);
        }
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
      // fireClick can re-render a subtree and swap the element out from under
      // hoverRef, so sweep the document as well as clearing the ref.
      hoverRef.current = null;
      document
        .querySelectorAll(
          ".showreel-hover, .showreel-press, .showreel-highlight-pulse",
        )
        .forEach((el) =>
          el.classList.remove(
            "showreel-hover",
            "showreel-press",
            "showreel-highlight-pulse",
          ),
        );
      followRef.current = null;
      arriveRef.current = null;
      setPressing(false);
      setVisible(false);
      setBeat(null);
    };
  }, [running, runId, stepsKey, rootSelector, x, y]);

  return { x, y, arc, tilt, pressing, visible, beat };
}
