type Clickable = {
  click?: () => void;
  dispatchEvent?: (event: Event) => boolean;
};

/** One activation only — pointer+click sequences double-toggle menus like the chat FAB. */
export function fireShowreelClick(el: Clickable) {
  if (typeof el.click === "function") {
    el.click();
    return;
  }
  el.dispatchEvent?.(
    new MouseEvent("click", { bubbles: true, cancelable: true }),
  );
}
