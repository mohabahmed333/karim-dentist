import type { CustomizeRoute } from "@/features/customize/context/CustomizeRouteContext";
// From types.ts, not the feature barrel — the barrel drags the whole
// customize editor into every /showreel/demo iframe that only needs this
// one predicate.
import { isCustomizeSection } from "@/features/customize/types";
import type { PortfolioData } from "@/services/portfolio";
import type { ShowreelCustomizeRouteParams } from "./showreelEmbedMessage";
import {
  resolveShowreelCaseStudyItemId,
  resolveShowreelFocusField,
} from "./showreelDemoRouteHelpers";

export function buildShowreelCustomizeRoute(
  params: ShowreelCustomizeRouteParams,
  data: PortfolioData,
): CustomizeRoute {
  const raw = params.section ?? "hero";
  const section = isCustomizeSection(raw) ? raw : "hero";
  const indexPreview = params.view === "index";
  const builderMode = params.view === "builder";
  const focusField = resolveShowreelFocusField(params.focus);

  let itemId: string | null = null;
  if (section === "case-studies") {
    if (builderMode || params.item) {
      itemId = resolveShowreelCaseStudyItemId(
        params.item ?? (builderMode ? "first" : undefined),
        data.caseStudies.map((item) => item.id),
      );
    }
  }
  if (builderMode && section === "slider") {
    itemId = data.featured[0]?.id ?? null;
  }

  return {
    section,
    itemId,
    focusField,
    builderMode,
    sectionBlockId: null,
    indexPreview,
  };
}
