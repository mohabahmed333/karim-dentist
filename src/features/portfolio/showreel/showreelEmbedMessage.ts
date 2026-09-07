export const SHOWREEL_CUSTOMIZE_ROUTE = "showreel-customize-route";
export const SHOWREEL_CUSTOMIZE_DEMO = "showreel-customize-demo";
export const SHOWREEL_EMBED_READY = "showreel-embed-ready";

export const CUSTOMIZE_DEMO_SRC = "/showreel/demo?mode=customize";
export const SITE_DEMO_SRC = "/showreel/demo?mode=site";

export type ShowreelCustomizeRouteParams = {
  section?: string;
  view?: string;
  item?: string;
  focus?: string;
};

export type ShowreelCustomizeDemoAction =
  | "reset"
  | "patchCaseStudy"
  | "reorderHomepage";

export type ShowreelCustomizeDemoMessage = {
  type: typeof SHOWREEL_CUSTOMIZE_DEMO;
  action: ShowreelCustomizeDemoAction;
  payload?: {
    id?: string;
    title?: string;
    fromIndex?: number;
    toIndex?: number;
  };
};

/** Parse `/showreel/demo?…` query params from a feature slide src. */
export function parseShowreelDemoParams(src: string): ShowreelCustomizeRouteParams {
  try {
    const url = new URL(src, "http://local");
    return {
      section: url.searchParams.get("section") ?? undefined,
      view: url.searchParams.get("view") ?? undefined,
      item: url.searchParams.get("item") ?? undefined,
      focus: url.searchParams.get("focus") ?? undefined,
    };
  } catch {
    return {};
  }
}

function postToIframe(
  iframe: HTMLIFrameElement | null,
  payload: unknown,
  retries = true,
) {
  if (!iframe?.contentWindow) return;

  const origin = window.location.origin;
  const send = () => iframe.contentWindow?.postMessage(payload, origin);

  send();
  if (!retries) return;
  window.setTimeout(send, 60);
  window.setTimeout(send, 180);
}

export function postShowreelCustomizeRoute(
  iframe: HTMLIFrameElement | null,
  params: ShowreelCustomizeRouteParams,
) {
  postToIframe(iframe, { type: SHOWREEL_CUSTOMIZE_ROUTE, params });
}

export function postShowreelCustomizeDemo(
  iframe: HTMLIFrameElement | null,
  action: ShowreelCustomizeDemoAction,
  payload?: ShowreelCustomizeDemoMessage["payload"],
) {
  const message: ShowreelCustomizeDemoMessage = {
    type: SHOWREEL_CUSTOMIZE_DEMO,
    action,
    payload,
  };
  postToIframe(iframe, message, false);
}

/** Tell the showreel parent the embed has painted (hero video, CMS UI, etc.). */
export function postShowreelEmbedReady(mode: "site" | "customize") {
  if (window.parent === window) return;

  const payload = { type: SHOWREEL_EMBED_READY, mode };
  window.parent.postMessage(payload, window.location.origin);
}
