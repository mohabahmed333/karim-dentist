let openHandler: (() => void) | null = null;

export function registerContactPopupHandler(handler: () => void) {
  openHandler = handler;
  return () => {
    if (openHandler === handler) openHandler = null;
  };
}

export function openContactPopup() {
  openHandler?.();
}
