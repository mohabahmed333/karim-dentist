"use client";

import type { Tables } from "@/lib/supabase/database.types";
import type { DentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";
import { localizedCms, useLocale, useTranslations } from "@/lib/i18n";
import { BookingForm } from "./BookingForm";
import { DentalContactCardBlock } from "./DentalContactCardBlock";
import { DentalContactOverlayContent } from "./DentalContactOverlayContent";
import { SectionBar } from "./SectionBar";
import { ScrollReveal } from "./ScrollReveal";
import { dentalSectionShell } from "@/features/portfolio/lib/dentalLayout";
import { cn } from "@/lib/utils";

const DEFAULT_CARD =
  "/dental/768432495_18084585374253727_8866675210638190928_n.webp";

type DentalContactSectionProps = {
  settings: Tables<"site_settings"> | null;
  services: Tables<"services">[];
  copy: DentalSectionCopy["contact"];
  number: string;
};

export function DentalContactSection({
  settings,
  services,
  copy,
  number,
}: DentalContactSectionProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const phone = settings?.contact_phone || "+20 111 192 2252";
  const clinicName = localizedCms(
    locale,
    settings?.contact_clinic_name || settings?.brand_name,
    settings?.contact_clinic_name_ar,
    t("contactClinic"),
  );
  const doctorEn = settings?.contact_doctor_name ?? "";
  const doctorName = localizedCms(
    locale,
    doctorEn,
    settings?.contact_doctor_name_ar,
    doctorEn,
  );
  const credentialsEn = settings?.contact_credentials ?? "";
  const credentialsRaw = localizedCms(
    locale,
    credentialsEn,
    settings?.contact_credentials_ar,
    credentialsEn,
  );
  const blurb = localizedCms(
    locale,
    settings?.contact_blurb,
    settings?.contact_blurb_ar,
    t("contactNote"),
  );
  const whatsapp = settings?.contact_whatsapp || "201111922252";
  const address = settings?.contact_address || t("contactAddress");
  const mapUrl =
    settings?.contact_map_url ||
    "https://www.google.com/maps/search/?api=1&query=A+41+Ozone+Medical+Center,+New+Cairo,+Al+Narges+Buildings";
  const cardImage = settings?.contact_card_image_url || DEFAULT_CARD;

  return (
    <section
      className={cn("border-t border-[#e6e8ec] bg-white", dentalSectionShell)}
      id="contact"
      data-customize-section="contact"
    >
      <SectionBar label={copy.label} number={number} labelField="contact_title" />
      <ScrollReveal>
        <h2
          className="text-3xl font-semibold text-[#0f2744]"
          data-customize-field="contact_headline"
        >
          {copy.heading}
        </h2>
      </ScrollReveal>

      <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-2">
        <ScrollReveal direction="left" className="h-full min-h-0">
          <DentalContactCardBlock
            cardImage={cardImage}
            imageAlt={t("contactImageAlt")}
          >
            <DentalContactOverlayContent
              clinicName={clinicName}
              address={address}
              phone={phone}
              blurb={blurb}
              whatsapp={whatsapp}
              mapUrl={mapUrl}
              doctorName={doctorName}
              credentialsRaw={credentialsRaw}
              labels={{
                call: t("contactCall"),
                whatsapp: t("contactWhatsapp"),
                directions: t("contactDirections"),
              }}
            />
          </DentalContactCardBlock>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <BookingForm services={services} />
        </ScrollReveal>
      </div>
    </section>
  );
}
