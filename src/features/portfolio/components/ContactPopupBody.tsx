import {
  type ContactInfo,
  externalHref,
  locationLine,
  telegramHref,
  telHref,
  whatsappHref,
} from "../lib/contactInfo";

type Props = {
  contact: ContactInfo;
};

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="contact-popup-row">
      <p className="contact-popup-label">{label}</p>
      {href ? (
        <a
          className="contact-popup-value"
          href={href}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <p className="contact-popup-value">{value}</p>
      )}
    </div>
  );
}

export function ContactPopupBody({ contact }: Props) {
  const place = locationLine(contact);
  const map = contact.mapUrl || undefined;

  return (
    <div className="contact-popup-body">
      {contact.blurb ? (
        <p className="contact-popup-blurb">{contact.blurb}</p>
      ) : null}
      <Row label="Email" value={contact.email} href={`mailto:${contact.email}`} />
      <Row
        label="Email (alt)"
        value={contact.emailSecondary}
        href={`mailto:${contact.emailSecondary}`}
      />
      <Row
        label="Phone"
        value={contact.phone}
        href={telHref(contact.phone) || undefined}
      />
      <Row
        label="Mobile"
        value={contact.mobile}
        href={telHref(contact.mobile) || undefined}
      />
      <Row
        label="Phone (alt)"
        value={contact.phoneSecondary}
        href={telHref(contact.phoneSecondary) || undefined}
      />
      <Row label="Address" value={contact.address} href={map} />
      <Row label="Location" value={place} href={map} />
      <Row label="Hours" value={contact.hours} />
      <Row
        label="WhatsApp"
        value={contact.whatsapp}
        href={whatsappHref(contact.whatsapp) || undefined}
      />
      <Row
        label="Telegram"
        value={contact.telegram}
        href={telegramHref(contact.telegram) || undefined}
      />
      <Row
        label="Behance"
        value={contact.behance}
        href={externalHref(contact.behance) || undefined}
      />
      <Row
        label="LinkedIn"
        value={contact.linkedin}
        href={externalHref(contact.linkedin) || undefined}
      />
      <Row
        label="Instagram"
        value={contact.instagram}
        href={externalHref(contact.instagram) || undefined}
      />
      <Row
        label="Facebook"
        value={contact.facebook}
        href={externalHref(contact.facebook) || undefined}
      />
      <Row
        label="X"
        value={contact.x}
        href={externalHref(contact.x) || undefined}
      />
    </div>
  );
}
