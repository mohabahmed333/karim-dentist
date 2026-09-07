type RouterLike = {
  push: (href: string) => void;
};

export function isLeavingCustomize(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return true;
    return !url.pathname.startsWith("/admin/customize");
  } catch {
    return true;
  }
}

export function navigateLeave(router: RouterLike, href: string) {
  const url = new URL(href, window.location.origin);
  if (url.origin === window.location.origin) {
    router.push(`${url.pathname}${url.search}${url.hash}`);
    return;
  }
  window.location.assign(href);
}
