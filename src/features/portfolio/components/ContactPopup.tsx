"use client";

import { useEffect } from "react";
import type { ContactInfo } from "../lib/contactInfo";
import { ContactPopupBody } from "./ContactPopupBody";

type Props = {
  open: boolean;
  contact: ContactInfo;
  onClose: () => void;
};

/** Site-styled contact details modal (black / white / muted). */
export function ContactPopup({ open, contact, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="contact-popup" role="presentation">
      <button
        type="button"
        className="contact-popup-backdrop"
        aria-label="Close contact"
        onClick={onClose}
      />
      <div
        className="contact-popup-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-popup-title"
      >
        <header className="contact-popup-header">
          <h2 id="contact-popup-title" className="contact-popup-title">
            {contact.headline}
          </h2>
          <button
            type="button"
            className="contact-popup-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <ContactPopupBody contact={contact} />
      </div>
    </div>
  );
}
