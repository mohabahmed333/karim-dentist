import { SHOWREEL_SLIDES, type ShowreelSlide } from "./showreelSlides";

/**
 * ~70s highlights cut of the full ~3m15s reel — the same slides, verbatim,
 * so the cursor timelines, product scenes, and /showreel/demo routes need
 * no changes. Dashboard (ops overview), WhatsApp (the flagship live
 * channel), and Clinical AI (the human-review trust story) are the three
 * strongest individual demos.
 */
const HIGHLIGHT_IDS = [
  "intro",
  "dashboard",
  "whatsapp",
  "clinical-ai",
  "outro",
] as const;

export const SHOWREEL_HIGHLIGHTS_SLIDES: ShowreelSlide[] = HIGHLIGHT_IDS.map(
  (id) => {
    const slide = SHOWREEL_SLIDES.find((s) => s.id === id);
    if (!slide) {
      throw new Error(`showreel highlights: missing slide "${id}"`);
    }
    return slide;
  },
);
