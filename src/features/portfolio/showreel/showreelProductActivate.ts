export const SHOWREEL_PRODUCT_ACTIVATE = "showreel-product-activate";

export type ShowreelProductActivateMessage = {
  type: typeof SHOWREEL_PRODUCT_ACTIVATE;
  scene: string;
  active: boolean;
};

export function isShowreelProductActivateMessage(
  data: unknown,
): data is ShowreelProductActivateMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === SHOWREEL_PRODUCT_ACTIVATE &&
    typeof msg.scene === "string" &&
    typeof msg.active === "boolean"
  );
}

export function postShowreelProductActivate(
  iframe: HTMLIFrameElement | null,
  scene: string,
  active: boolean,
) {
  if (!iframe?.contentWindow) return;
  const origin = window.location.origin;
  const payload: ShowreelProductActivateMessage = {
    type: SHOWREEL_PRODUCT_ACTIVATE,
    scene,
    active,
  };
  iframe.contentWindow.postMessage(payload, origin);
  window.setTimeout(() => {
    iframe.contentWindow?.postMessage(payload, origin);
  }, 80);
}
