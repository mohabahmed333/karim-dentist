/**
 * Replay on every enter, reverse on leave — works scrolling down and up.
 * onEnter / onLeave / onEnterBack / onLeaveBack → play / reverse / play / reverse
 */
export const IN_VIEW = {
  start: "top 85%",
  end: "bottom top",
  toggleActions: "play reverse play reverse",
} as const;

/** @deprecated Prefer IN_VIEW — same bidirectional replay behavior. */
export const BIDIRECTIONAL_IN_VIEW = IN_VIEW;
