"use client";

import { contactCredentialsLines } from "@/features/portfolio/lib/contactCredentialsLines";
import { DentalButton } from "./DentalButton";

type Props = {
  clinicName: string;
  address: string;
  phone: string;
  blurb: string;
  whatsapp: string;
  mapUrl: string;
  doctorName: string;
  credentialsRaw: string;
  labels: {
    call: string;
    whatsapp: string;
    directions: string;
  };
};

export function DentalContactOverlayContent({
  clinicName,
  address,
  phone,
  blurb,
  whatsapp,
  mapUrl,
  doctorName,
  credentialsRaw,
  labels,
}: Props) {
  const credentials = contactCredentialsLines(credentialsRaw);

  return (
    <>
      <div className="space-y-5">
        <p
          className="text-xl font-semibold text-white"
          data-customize-field="contact_clinic_name"
        >
          {clinicName}
        </p>
        <p className="text-white/75" data-customize-field="contact_address">
          {address}
        </p>
        <p
          className="text-lg font-semibold text-white"
          data-customize-field="contact_phone"
        >
          {phone}
        </p>
        <p className="text-sm text-white/75" data-customize-field="contact_blurb">
          {blurb}
        </p>
        <div className="flex flex-wrap gap-3">
          <DentalButton
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="bg-white text-[#0f2744] hover:bg-white/90"
          >
            {labels.call}
          </DentalButton>
          <DentalButton
            href={`https://wa.me/${whatsapp}`}
            variant="secondary"
            className="border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/20"
          >
            {labels.whatsapp}
          </DentalButton>
          <DentalButton
            href={mapUrl}
            variant="ghost"
            className="border-white/40 text-white hover:border-white"
          >
            {labels.directions}
          </DentalButton>
        </div>
      </div>

      {doctorName || credentials.length > 0 ? (
        <div className="space-y-1 border-t border-white/25 pt-4">
          {doctorName ? (
            <p
              className="font-semibold text-white"
              data-customize-field="contact_doctor_name"
            >
              {doctorName}
            </p>
          ) : null}
          {credentials.map((line) => (
            <p
              key={line}
              className="text-sm text-white/75"
              data-customize-field="contact_credentials"
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );
}
