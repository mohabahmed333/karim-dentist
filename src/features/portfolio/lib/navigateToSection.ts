import {
  restoreDrawerScroll,
  scrollToElement,
} from "./drawerScrollLock";

const CLOSE_MS = 560;

function isHomePath() {
  return window.location.pathname === "/" || window.location.pathname === "";
}

function sectionIdFromHref(href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return "";
  return href.slice(hashIndex + 1);
}

/** Close the drawer, then go to a page path or homepage section. */
export function navigateToSection(href: string, onClose: () => void) {
  onClose();

  const plainPath = href.startsWith("/") && !href.includes("#");
  const sectionId = sectionIdFromHref(href);
  const goingHome = href === "/" || href === "/#top" || href === "#top";

  window.setTimeout(() => {
    restoreDrawerScroll();

    if (goingHome) {
      if (isHomePath()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.replaceState(null, "", "/");
        return;
      }
      window.location.assign("/");
      return;
    }

    if (plainPath) {
      window.location.assign(href);
      return;
    }

    // Hash targets (Experience, About, …) live on the homepage only
    if (!isHomePath()) {
      window.location.assign(sectionId ? `/#${sectionId}` : "/");
      return;
    }

    requestAnimationFrame(() => {
      if (sectionId) {
        if (!document.getElementById(sectionId)) {
          window.location.assign(`/#${sectionId}`);
          return;
        }
        scrollToElement(sectionId);
        window.history.replaceState(null, "", `#${sectionId}`);
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(null, "", "/");
    });
  }, CLOSE_MS);
}
