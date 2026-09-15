"use client";

import type { ReactNode } from "react";
import type { PatientGender, PatientProfileUpsertValues } from "@/services/patient_profiles";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";

const GENDER_LABEL_KEYS: Record<Exclude<PatientGender, "">, AdminMessageKey> = {
  female: "admin.patients.profile.genderFemale",
  male: "admin.patients.profile.genderMale",
  other: "admin.patients.profile.genderOther",
  prefer_not: "admin.patients.profile.genderPreferNot",
};

export function ClientProfileSummary({
  value,
}: {
  value: PatientProfileUpsertValues;
}) {
  const t = useTranslations();
  const genderLabel = value.gender ? t(GENDER_LABEL_KEYS[value.gender]) : "—";
  return (
    <div className="space-y-5 px-5 pb-6 pt-1">
      <Section title={t("admin.patients.profile.sectionIdentity")}>
        <Row label={t("admin.patients.profile.fullName")} text={value.display_name} />
        <Row label={t("admin.patients.phone")} text={value.phone} />
        <Row label={t("admin.patients.email")} text={value.email} />
      </Section>
      <Section title={t("admin.patients.profile.sectionDemographics")}>
        <Row
          label={t("admin.patients.profile.age")}
          text={value.age_years != null ? String(value.age_years) : null}
        />
        <Row label={t("admin.patients.profile.dob")} text={value.date_of_birth} />
        <Row label={t("admin.patients.profile.gender")} text={genderLabel} />
      </Section>
      <Section title={t("admin.patients.profile.sectionMedicalHistory")}>
        <ChipList items={value.medical_history} />
      </Section>
      <Section title={t("admin.patients.profile.sectionAllergies")}>
        <ChipList items={value.allergies} />
      </Section>
      <Section title={t("admin.patients.profile.sectionMedications")}>
        <p className="whitespace-pre-wrap text-[13px] text-[#111111]">
          {value.medications.trim() || "—"}
        </p>
      </Section>
      <Section title={t("admin.patients.profile.sectionNotes")}>
        <p className="whitespace-pre-wrap text-[13px] text-[#111111]">
          {value.notes.trim() || "—"}
        </p>
      </Section>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[#9CA3AF]">—</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-lg border border-[#E8EAED] bg-[#F8F9FB] px-2.5 py-1 text-[11px] font-semibold text-[#111111]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Row({ label, text }: { label: string; text?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-[12px] text-[#70758A]">{label}</p>
      <p className="text-[13px] font-medium text-[#111111]">
        {text?.trim() ? text : "—"}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h4 className="text-[11px] font-semibold tracking-wide text-[#70758A] uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}
