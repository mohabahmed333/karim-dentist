import { CUSTOMIZE_TRANSLATE_FIXTURE } from "./product-scenes/fixtures/customizeTranslateFixtures";
import type { ShowreelCursorStep } from "./product-scenes/showreelCursorTimeline";
import { typewriterFrames } from "./product-scenes/typewriterFrames";
import {
  SHOWREEL_CUSTOMIZE_DEMO,
  type ShowreelCustomizeDemoMessage,
} from "./showreelEmbedMessage";

const { heroBefore, heroEdit, heroAfter } = CUSTOMIZE_TRANSLATE_FIXTURE;

const HEADLINE_FIELD = '.showreel-demo-customize aside [data-editor-field="headline"]';
const BODY_FIELD = '.showreel-demo-customize aside [data-editor-field="body"]';
const PREVIEW = ".showreel-demo-customize [data-customize-preview-scroll]";

function localPatch(
  action: ShowreelCustomizeDemoMessage["action"],
  payload: ShowreelCustomizeDemoMessage["payload"],
): { name: string; detail: ShowreelCustomizeDemoMessage } {
  return {
    name: SHOWREEL_CUSTOMIZE_DEMO,
    detail: { type: SHOWREEL_CUSTOMIZE_DEMO, action, payload },
  };
}

/** patchHero/simulateTranslate only apply payload keys that are present, so a
    burst of growing-prefix dispatches for a single field reads as live
    typing without touching the other fields. */
function typedFieldSteps(
  idPrefix: string,
  atStart: number,
  durationMs: number,
  action: ShowreelCustomizeDemoMessage["action"],
  field: "headline" | "body" | "headlineAr" | "bodyAr",
  text: string,
  highlight?: string,
): ShowreelCursorStep[] {
  const frames = typewriterFrames(text, { durationMs });
  return frames.map((frame, i) => ({
    id: `${idPrefix}-${i}`,
    at: atStart + frame.at,
    dispatch: localPatch(action, { [field]: frame.text }),
    // Only the LAST frame pulses — "this field just finished updating",
    // not every intermediate keystroke.
    ...(highlight && i === frames.length - 1 ? { highlight } : {}),
  }));
}

/**
 * Cursor-driven customize demo: aims/hovers the specific hero field as each
 * edit lands (dispatched on arrival via the same message shape
 * ShowreelCustomizeDemoBridge already applies, just delivered same-document
 * instead of cross-frame — see ShowreelCustomizeDemoBridge's local-dispatch
 * listener), scrolls the live preview, and does REAL clicks on the device
 * switcher (it already has a genuine onClick + data-showreel-action, unlike
 * the sidebar's real CMS fields, which are never clicked or typed into for
 * real here).
 */
export const SHOWREEL_CUSTOMIZE_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "edit-headline",
    at: 700,
    selector: HEADLINE_FIELD,
    beat: "Live-edit the hero",
    dispatch: localPatch("patchHero", {
      headline: heroBefore.headline,
      body: heroBefore.body,
      cta: heroBefore.cta,
    }),
  },
  {
    id: "edit-headline-live-aim",
    at: 2400,
    selector: HEADLINE_FIELD,
  },
  ...typedFieldSteps(
    "edit-headline-live-type",
    2400,
    900,
    "patchHero",
    "headline",
    heroEdit.headline,
    HEADLINE_FIELD,
  ),
  {
    id: "edit-body-aim",
    at: 4200,
    selector: BODY_FIELD,
    beat: "Every change previews instantly",
  },
  {
    id: "edit-body-cta",
    at: 4200,
    dispatch: localPatch("patchHero", { cta: heroEdit.cta }),
  },
  ...typedFieldSteps(
    "edit-body-type",
    4200,
    1100,
    "patchHero",
    "body",
    heroEdit.body,
    BODY_FIELD,
  ),
  {
    id: "scroll-preview",
    at: 5600,
    scrollWithin: { selector: PREVIEW, top: 220 },
  },
  {
    id: "translate-aim",
    at: 6600,
    selector: HEADLINE_FIELD,
    beat: "Translate every module in one pass",
  },
  {
    id: "translate-cta",
    at: 6600,
    dispatch: localPatch("simulateTranslate", { ctaAr: heroAfter.cta }),
  },
  ...typedFieldSteps(
    "translate-headline",
    6600,
    1400,
    "simulateTranslate",
    "headlineAr",
    heroAfter.headline,
  ),
  ...typedFieldSteps(
    "translate-body",
    6600,
    1400,
    "simulateTranslate",
    "bodyAr",
    heroAfter.body,
  ),
  {
    id: "settle-preview",
    at: 8600,
    scrollWithin: { selector: PREVIEW, top: 0 },
  },
  {
    id: "click-mobile",
    at: 9600,
    selector: '[data-showreel-action="customize-device-mobile"]',
    click: true,
    highlight: PREVIEW,
    beat: "Preview on mobile",
  },
  {
    id: "click-desktop",
    at: 12200,
    selector: '[data-showreel-action="customize-device-desktop"]',
    click: true,
    highlight: PREVIEW,
    beat: "Back to desktop",
  },
  {
    id: "hold",
    at: 14200,
    selector: HEADLINE_FIELD,
  },
];
