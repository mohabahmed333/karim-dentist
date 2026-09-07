"use client";

import type { ReactNode } from "react";
import type { PatientGender, PatientProfileUpsertValues } from "@/services/patient_profiles";

const GENDER_LABEL: Record<PatientGender, string> = {
  "": "—",
  female: "Female",
  male: "Male",
  other: "Other",
  prefer_not: "Prefer not",
};

export function ClientProfileSummary({
  value,
}: {
  value: PatientProfileUpsertValues;
}) {
  return (
    <div className="space-y-5 px-5 pb-6 pt-1">
      <Section title="Identity">
        <Row label="Full name" text={value.display_name} />
        <Row label="Phone" text={value.phone} />
        <Row label="Email" text={value.email} />
      </Section>
      <Section title="Demographics">
        <Row
          label="Age"
          text={value.age_years != null ? String(value.age_years) : null}
        />
        <Row label="Date of birth" text={value.date_of_birth} />
        <Row label="Gender" text={GENDER_LABEL[value.gender]} />
      </Section>
      <Section title="Medical history">
        <ChipList items={value.medical_history} />
      </Section>
      <Section title="Allergies">
        <ChipList items={value.allergies} />
      </Section>
      <Section title="Medications">
        <p className="whitespace-pre-wrap text-[13px] text-[#111111]">
          {value.medications.trim() || "—"}
        </p>
      </Section>
      <Section title="Reception notes">
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
