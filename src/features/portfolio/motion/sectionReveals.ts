export type RevealConfig = {
  trigger: string;
  targets: string;
  from?: Record<string, number>;
  stagger?: number;
  duration?: number;
};

/** Mild opacity on image cards keeps media visible while still revealing. */
export const SECTION_REVEALS: RevealConfig[] = [
  {
    trigger: "#about",
    targets: ".about-frame",
    from: { y: 28, opacity: 0.2 },
    stagger: 0,
  },
  {
    trigger: "#about",
    targets: ".about-copy",
    from: { y: 36, opacity: 0, x: 24 },
    stagger: 0,
  },
  {
    trigger: "#case-studies",
    targets: ".section-heading",
    from: { y: 28, opacity: 0 },
    stagger: 0,
  },
  {
    trigger: "#case-studies",
    targets: ".case-card",
    from: { y: 40, opacity: 0 },
    stagger: 0.09,
    duration: 0.85,
  },
  {
    trigger: "#featured",
    targets: ".section-heading",
    from: { y: 28, opacity: 0 },
    stagger: 0,
  },
  {
    trigger: "#featured",
    targets: ".featured-card",
    from: { y: 44, opacity: 0 },
    stagger: 0.07,
    duration: 0.82,
  },
  {
    trigger: "#experience",
    targets: ".section-header",
    from: { y: 24, opacity: 0 },
  },
  {
    trigger: "#clients",
    targets: ".brands-header",
    from: { y: 20, opacity: 0 },
  },
  {
    trigger: "#clients",
    targets: ".clients-grid li, .clients-col, .clients-cell",
    from: { opacity: 0 },
    stagger: 0.025,
    duration: 0.55,
  },
  {
    trigger: "#contact",
    targets: ".footer-brand, .footer-cols > div",
    from: { y: 32, opacity: 0 },
    stagger: 0.1,
  },
];
