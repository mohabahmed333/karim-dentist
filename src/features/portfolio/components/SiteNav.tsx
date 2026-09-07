"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { ContactInfo } from "../lib/contactInfo";
import type { NavLink } from "./navMenuGroups";
import { BrandLogo } from "./BrandLogo";
import { ContactPopup } from "./ContactPopup";
import { NavBurger } from "./NavBurger";
import { NavDrawer } from "./NavDrawer";
import { navigateToSection } from "../lib/navigateToSection";
import { registerContactPopupHandler } from "../lib/contactPopupBus";
import { useNavDrawerLock } from "../hooks/useNavDrawerLock";
import { useNavScrollHide } from "../hooks/useNavScrollHide";

type Props = {
  brand: string;
  brandLogo?: string | null;
  contact: ContactInfo;
  workLinks?: NavLink[];
};

function useHasDocument() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function SiteNav({ brand, brandLogo, contact, workLinks }: Props) {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const hasDocument = useHasDocument();
  const drawerId = useId();
  const pathname = usePathname();

  useEffect(() => {
    const nav = document.getElementById("site-nav");
    if (!nav) return;
    const isHome = pathname === "/" || pathname === "";
    if (isHome) nav.classList.remove("is-solid");
    else nav.classList.add("is-solid");
  }, [pathname]);

  useNavDrawerLock(open);
  useNavScrollHide(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    return registerContactPopupHandler(() => {
      setOpen(false);
      window.setTimeout(() => setContactOpen(true), 320);
    });
  }, []);

  function openContact() {
    setOpen(false);
    window.setTimeout(() => setContactOpen(true), 320);
  }

  return (
    <>
      <header className="site-nav" id="site-nav" data-customize-section="settings">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigateToSection("/", () => setOpen(false));
          }}
          aria-label={`${brand} home`}
        >
          <BrandLogo brand={brand} logoUrl={brandLogo} />
        </a>
        <NavBurger
          open={open}
          controls={drawerId}
          onClick={() => setOpen((v) => !v)}
        />
      </header>
      {hasDocument
        ? createPortal(
            <>
              <NavDrawer
                brand={brand}
                brandLogo={brandLogo}
                open={open}
                drawerId={drawerId}
                onClose={() => setOpen(false)}
                onOpenContact={openContact}
                workLinks={workLinks}
              />
              <ContactPopup
                open={contactOpen}
                contact={contact}
                onClose={() => setContactOpen(false)}
              />
            </>,
            document.body,
          )
        : null}
    </>
  );
}
