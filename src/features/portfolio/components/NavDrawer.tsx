"use client";

import { navigateToSection } from "../lib/navigateToSection";
import { isContactFooterLink } from "../lib/footerLinkHref";
import { NavMenuClose } from "./NavMenuClose";
import { NavDrawerBrand } from "./NavDrawerBrand";
import { buildMenuGroups, type NavLink } from "./navMenuGroups";

type Props = {
  brand: string;
  brandLogo?: string | null;
  open: boolean;
  drawerId: string;
  onClose: () => void;
  onOpenContact: () => void;
  workLinks?: NavLink[];
};

function isContactLink(href: string, label: string) {
  return isContactFooterLink({ label, href });
}

export function NavDrawer({
  brand,
  brandLogo,
  open,
  drawerId,
  onClose,
  onOpenContact,
  workLinks,
}: Props) {
  const goTo = (href: string) => navigateToSection(href, onClose);
  const menuGroups = buildMenuGroups(workLinks);

  return (
    <div
      className={`nav-drawer${open ? " is-open" : ""}`}
      id={drawerId}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="nav-drawer-backdrop"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className="nav-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <NavMenuClose className="nav-drawer-close" onClick={onClose} />
        <NavDrawerBrand
          brand={brand}
          brandLogo={brandLogo}
          onNavigate={goTo}
        />
        <nav className="nav-drawer-nav" aria-label="Site">
          {menuGroups.map((group) => (
            <div key={group.label} className="nav-drawer-group">
              <p className="nav-drawer-group-label">{group.label}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(event) => {
                        event.preventDefault();
                        if (isContactLink(link.href, link.label)) {
                          onOpenContact();
                          return;
                        }
                        goTo(link.href);
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
