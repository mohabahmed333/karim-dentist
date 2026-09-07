/** Wrap words in spans; keeps nested elements (e.g. <em>) intact. */
export function wrapWords(el: HTMLElement, className = "motion-word"): void {
  if (el.dataset.wordsSplit === "1") return;
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const span = document.createElement("span");
        span.className = className;
        span.textContent = part;
        frag.appendChild(span);
      });
      node.parentNode?.replaceChild(frag, node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  };
  Array.from(el.childNodes).forEach(walk);
  el.dataset.wordsSplit = "1";
}
