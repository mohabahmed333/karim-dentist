/** Copy parent stylesheets into the iframe so Tailwind utilities apply. */
export function syncPreviewIframeStyles(from: Document, to: Document): void {
  let base = to.querySelector("base");
  if (!base) {
    base = to.createElement("base");
    to.head.prepend(base);
  }
  base.href = from.baseURI;

  const existingKeys = new Set(
    [...to.querySelectorAll<HTMLLinkElement>("link[href]")].map(
      (link) => `${link.rel}|${link.as}|${link.href}`,
    ),
  );
  for (const link of from.querySelectorAll<HTMLLinkElement>(
    'link[rel="stylesheet"], link[rel="preload"][as="style"], link[rel="preload"][as="font"]',
  )) {
    const key = `${link.rel}|${link.as}|${link.href}`;
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    to.head.appendChild(link.cloneNode(true));
  }

  to.querySelectorAll("style[data-preview-iframe-sync]").forEach((node) =>
    node.remove(),
  );
  for (const style of from.querySelectorAll("style")) {
    const clone = style.cloneNode(true) as HTMLStyleElement;
    clone.setAttribute("data-preview-iframe-sync", "");
    to.head.appendChild(clone);
  }
}
