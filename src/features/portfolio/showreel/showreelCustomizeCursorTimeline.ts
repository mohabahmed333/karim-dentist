import { CUSTOMIZE_TRANSLATE_FIXTURE } from "./product-scenes/fixtures/customizeTranslateFixtures";
import type { ShowreelCursorStep } from "./product-scenes/showreelCursorTimeline";
import {
  SHOWREEL_CUSTOMIZE_DEMO,
  type ShowreelCustomizeDemoMessage,
} from "./showreelEmbedMessage";

const { heroBefore, heroEdit, heroAfter } = CUSTOMIZE_TRANSLATE_FIXTURE;

const SIDEBAR = ".showreel-demo-customize aside";
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

/**
 * Cursor-driven customize demo: aims/hovers the sidebar as each edit lands
 * (dispatched on arrival via the same message shape ShowreelCustomizeDemoBridge
 * already applies, just delivered same-document instead of cross-frame — see
 * ShowreelCustomizeDemoBridge's local-dispatch listener), scrolls the live
 * preview, and does REAL clicks on the device switcher (it already has a
 * genuine onClick + data-showreel-action, unlike the sidebar's real CMS
 * fields, which are never clicked or typed into for real here).
 */
export const SHOWREEL_CUSTOMIZE_CURSOR_STEPS: ShowreelCursorStep[] = [
  {
    id: "edit-headline",
    at: 700,
    selector: SIDEBAR,
    beat: "Live-edit the hero",
    dispatch: localPatch("patchHero", {
      headline: heroBefore.headline,
      body: heroBefore.body,
      cta: heroBefore.cta,
    }),
  },
  {
    id: "edit-headline-live",
    at: 2400,
    selector: SIDEBAR,
    dispatch: localPatch("patchHero", {
      headline: heroEdit.headline,
      body: heroBefore.body,
      cta: heroBefore.cta,
    }),
  },
  {
    id: "edit-body",
    at: 4200,
    selector: SIDEBAR,
    beat: "Every change previews instantly",
    dispatch: localPatch("patchHero", {
      headline: heroEdit.headline,
      body: heroEdit.body,
      cta: heroEdit.cta,
    }),
  },
  {
    id: "scroll-preview",
    at: 5600,
    scrollWithin: { selector: PREVIEW, top: 220 },
  },
  {
    id: "translate",
    at: 6600,
    selector: SIDEBAR,
    beat: "Translate every module in one pass",
    dispatch: localPatch("simulateTranslate", {
      headlineAr: heroAfter.headline,
      bodyAr: heroAfter.body,
      ctaAr: heroAfter.cta,
    }),
  },
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
    beat: "Preview on mobile",
  },
  {
    id: "click-desktop",
    at: 12200,
    selector: '[data-showreel-action="customize-device-desktop"]',
    click: true,
    beat: "Back to desktop",
  },
  {
    id: "hold",
    at: 14200,
    selector: SIDEBAR,
  },
];
