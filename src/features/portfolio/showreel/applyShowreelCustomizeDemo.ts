import type { CustomizeActions } from "@/features/customize/context/CustomizeContext";
import {
  moveHomepageSection,
  normalizeHomepageSectionOrder,
} from "@/features/portfolio/lib/homepageSectionOrder";
import type { PortfolioData } from "@/services/portfolio";
import { CUSTOMIZE_TRANSLATE_FIXTURE } from "./product-scenes/fixtures";
import type { ShowreelCustomizeDemoMessage } from "./showreelEmbedMessage";
import {
  SHOWREEL_CUSTOMIZE_UI_EVENT,
  type ShowreelCustomizeUiDetail,
} from "./showreelCustomizeUi";

type Patches = Pick<
  CustomizeActions,
  "patchCollectionItem" | "patchSettings" | "patchHero"
>;

export function emitShowreelCustomizeUi(detail: ShowreelCustomizeUiDetail) {
  window.dispatchEvent(
    new CustomEvent(SHOWREEL_CUSTOMIZE_UI_EVENT, { detail }),
  );
}

/** Apply one parent-driven customize demo message. */
export function applyShowreelCustomizeDemo(
  message: ShowreelCustomizeDemoMessage,
  snapshot: PortfolioData,
  live: PortfolioData,
  patches: Patches,
) {
  const firstId = snapshot.caseStudies[0]?.id;
  const fx = CUSTOMIZE_TRANSLATE_FIXTURE;
  const { patchCollectionItem, patchSettings, patchHero } = patches;

  if (message.action === "reset") {
    if (firstId) {
      patchCollectionItem("case-studies", firstId, {
        title: snapshot.caseStudies[0]?.title ?? "",
      });
    }
    patchSettings({
      homepage_section_order: normalizeHomepageSectionOrder(
        snapshot.settings?.homepage_section_order,
      ),
    });
    patchHero({
      headline: fx.heroBefore.headline,
      body: fx.heroBefore.body,
      cta_primary_label: fx.heroBefore.cta,
      headline_ar: "",
      body_ar: "",
      cta_primary_label_ar: "",
    });
    emitShowreelCustomizeUi({ type: "device", device: "desktop" });
    emitShowreelCustomizeUi({ type: "locale", locale: "en" });
    return;
  }

  if (message.action === "patchCaseStudy") {
    const id = message.payload?.id ?? firstId;
    const title = message.payload?.title;
    if (!id || title === undefined) return;
    patchCollectionItem("case-studies", id, { title });
    return;
  }

  if (message.action === "reorderHomepage") {
    const { fromIndex, toIndex } = message.payload ?? {};
    if (fromIndex === undefined || toIndex === undefined) return;
    const order = normalizeHomepageSectionOrder(
      live.settings?.homepage_section_order,
    );
    patchSettings({
      homepage_section_order: moveHomepageSection(order, fromIndex, toIndex),
    });
    return;
  }

  if (message.action === "patchHero") {
    const { headline, body, cta, headlineAr, bodyAr, ctaAr } =
      message.payload ?? {};
    patchHero({
      ...(headline !== undefined ? { headline } : {}),
      ...(body !== undefined ? { body } : {}),
      ...(cta !== undefined ? { cta_primary_label: cta } : {}),
      ...(headlineAr !== undefined ? { headline_ar: headlineAr } : {}),
      ...(bodyAr !== undefined ? { body_ar: bodyAr } : {}),
      ...(ctaAr !== undefined ? { cta_primary_label_ar: ctaAr } : {}),
    });
    return;
  }

  if (message.action === "simulateTranslate") {
    const { headlineAr, bodyAr, ctaAr } = message.payload ?? {};
    patchHero({
      ...(headlineAr !== undefined ? { headline_ar: headlineAr } : {}),
      ...(bodyAr !== undefined ? { body_ar: bodyAr } : {}),
      ...(ctaAr !== undefined ? { cta_primary_label_ar: ctaAr } : {}),
    });
    return;
  }

  if (message.action === "setDevice") {
    const device = message.payload?.device;
    if (device) emitShowreelCustomizeUi({ type: "device", device });
    return;
  }

  if (message.action === "setLocale") {
    const locale = message.payload?.locale;
    if (locale) emitShowreelCustomizeUi({ type: "locale", locale });
  }
}
